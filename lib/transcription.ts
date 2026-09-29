import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Live transcript — the words of a recording, as they are spoken.
 *
 * The only speech engine the app can use today is the browser's own: the Web
 * Speech API (`SpeechRecognition`, prefixed `webkitSpeechRecognition` in
 * Chrome and Safari; Firefox has none). Native has no provider until
 * Decision 4 picks a speech-to-text service, so there — and in browsers
 * without the API — a recording is audio only and its transcript arrives
 * after upload. Demo mode types a scripted transcript instead, so the
 * prototype shows the behaviour anywhere.
 *
 * Nothing here touches a browser API at import or render time. Support is
 * feature-detected when listening starts, and every engine error is handled
 * (falling back to the script in demo, to audio only otherwise) rather than
 * thrown.
 */

export type TranscriptSource =
  | 'speech' // the browser's speech engine
  | 'scripted' // demo: a sample session types itself out
  | 'none'; // audio only — the transcript arrives after upload

// The Web Speech API is not in TypeScript's DOM library. Only what we use.
type SpeechAlternative = { readonly transcript: string };
type SpeechResult = {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechAlternative | undefined;
};
type SpeechResultEvent = {
  readonly resultIndex: number;
  readonly results: { readonly length: number; readonly [index: number]: SpeechResult | undefined };
};
type SpeechEngine = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type SpeechEngineCtor = new () => SpeechEngine;

function speechEngine(): SpeechEngineCtor | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechEngineCtor;
    webkitSpeechRecognition?: SpeechEngineCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** True when this browser can transcribe as someone speaks. */
export function hasLiveTranscript(): boolean {
  return speechEngine() !== null;
}

function browserLanguage(): string {
  const lang = typeof navigator === 'undefined' ? undefined : navigator.language;
  return lang || 'en-AU';
}

// Errors the engine will not recover from in this session: no permission, no
// microphone, no speech service (offline, or a Chromium build without one).
const FATAL = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'network',
  'language-not-supported',
  'bad-grammar',
]);

/** Sentence-case a phrase from the engine and close it with a full stop. */
export function tidyPhrase(raw: string): string {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const cased = text[0].toUpperCase() + text.slice(1);
  return /[.!?…,;:]$/.test(cased) ? cased : `${cased}.`;
}

/**
 * Add a transcribed phrase to the end of a note. The first phrase of a new
 * recording starts a paragraph; the rest run on as prose.
 */
export function appendPhrase(body: string, phrase: string, newParagraph: boolean): string {
  if (!phrase) return body;
  const base = body.replace(/[ \t]+$/, '');
  if (!base.trim()) return phrase;
  if (newParagraph) return `${base.replace(/\n+$/, '')}\n\n${phrase}`;
  return base.endsWith('\n') ? `${base}${phrase}` : `${base} ${phrase}`;
}

export type Transcriber = {
  /** Start listening, or carry on after pause(). */
  run(): void;
  pause(): void;
  /** Stop listening. Resolves once the words still in flight have landed. */
  stop(): Promise<void>;
  /** Tear down without delivering anything else. */
  dispose(): void;
};

// How long stop() waits for an engine to hand over its last words.
const SETTLE_MS = 1200;

type TranscriberHandlers = {
  onPhrase: (text: string) => void;
  onInterim: (text: string) => void;
  onSource: (source: TranscriptSource) => void;
};

type TranscriberOptions = {
  /** Demo: type `script` out when there is no speech engine. */
  allowScripted: boolean;
  script?: readonly string[];
  lang?: string;
};

/**
 * The engine behind useLiveTranscript, free of React so it can be exercised
 * directly in a browser.
 */
export function createTranscriber(handlers: TranscriberHandlers, options: TranscriberOptions): Transcriber {
  let source: TranscriptSource = 'none';
  let state: 'idle' | 'running' | 'paused' = 'idle';
  let interim = '';
  let disposed = false;

  let engine: SpeechEngine | null = null;
  let restarts: number[] = [];
  let restartTimer: ReturnType<typeof setTimeout> | null = null;
  let settle: (() => void) | null = null;

  const script = options.script ?? [];
  let scriptTimer: ReturnType<typeof setTimeout> | null = null;
  let sentence = 0;
  let shown = 0;

  function setSource(next: TranscriptSource) {
    if (next === source) return;
    source = next;
    if (!disposed) handlers.onSource(next);
  }

  function setInterim(next: string) {
    if (next === interim) return;
    interim = next;
    if (!disposed) handlers.onInterim(next);
  }

  function deliver(text: string) {
    if (text && !disposed) handlers.onPhrase(text);
  }

  function clearTimers() {
    if (restartTimer) clearTimeout(restartTimer);
    if (scriptTimer) clearTimeout(scriptTimer);
    restartTimer = null;
    scriptTimer = null;
  }

  function silence(e: SpeechEngine) {
    e.onresult = null;
    e.onerror = null;
    e.onend = null;
    try {
      e.abort();
    } catch {
      // already stopped
    }
  }

  // No speech engine (or it gave up): the script in demo, audio only otherwise.
  function fallBack() {
    setInterim('');
    if (options.allowScripted) {
      setSource('scripted');
      typeOn();
    } else {
      setSource('none');
    }
  }

  function listen(): boolean {
    const Engine = speechEngine();
    if (!Engine) return false;
    let e: SpeechEngine;
    try {
      e = new Engine();
    } catch {
      return false;
    }
    const delivered = new Set<number>();
    let lastFinal = '';
    e.continuous = true;
    e.interimResults = true;
    e.lang = options.lang ?? browserLanguage();
    e.onresult = (event) => {
      let pending = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result?.[0]?.transcript ?? '';
        if (!result?.isFinal) {
          pending += text;
          continue;
        }
        if (delivered.has(i)) continue;
        delivered.add(i);
        // Some Android builds repeat every earlier phrase in each new final
        // result; keep only what is new.
        const said = text.trim();
        const fresh =
          lastFinal && said.toLowerCase().startsWith(lastFinal) ? said.slice(lastFinal.length) : said;
        lastFinal = said.toLowerCase();
        deliver(tidyPhrase(fresh));
      }
      setInterim(pending.trim());
    };
    e.onerror = (event) => {
      if (!FATAL.has(event.error)) return; // no-speech, aborted: onend restarts
      if (engine === e) engine = null;
      silence(e);
      settle?.();
      settle = null;
      fallBack();
    };
    e.onend = () => {
      if (engine !== e) return;
      engine = null;
      if (interim) {
        deliver(tidyPhrase(interim));
        setInterim('');
      }
      settle?.();
      settle = null;
      if (state === 'running' && source === 'speech') relisten();
    };
    try {
      e.start();
    } catch {
      silence(e);
      return false;
    }
    engine = e;
    return true;
  }

  // Engines end a session after a stretch of silence; start a new one. One
  // that keeps ending straight away is broken, so stop trying.
  function relisten() {
    const now = Date.now();
    restarts = restarts.filter((t) => now - t < 15_000);
    restarts.push(now);
    if (restarts.length > 6) {
      fallBack();
      return;
    }
    restartTimer = setTimeout(() => {
      restartTimer = null;
      if (state !== 'running' || source !== 'speech' || engine) return;
      if (!listen()) fallBack();
    }, 250);
  }

  function typeOn() {
    if (scriptTimer || state !== 'running' || source !== 'scripted') return;
    if (sentence >= script.length) return; // the sample session is over; keep listening
    const words = script[sentence].split(' ');
    const delay = shown === 0 ? 650 : shown >= words.length ? 380 : 170 + Math.random() * 200;
    scriptTimer = setTimeout(() => {
      scriptTimer = null;
      if (state !== 'running' || source !== 'scripted') return;
      if (shown < words.length) {
        shown += 1;
        setInterim(words.slice(0, shown).join(' '));
      } else {
        setInterim('');
        deliver(script[sentence]);
        sentence += 1;
        shown = 0;
      }
      typeOn();
    }, delay);
  }

  // Stopping mid-sentence completes it, so the demo never leaves half a line.
  function finishSentence() {
    if (shown > 0 && sentence < script.length) {
      deliver(script[sentence]);
      sentence += 1;
    }
    shown = 0;
    setInterim('');
  }

  return {
    run() {
      if (disposed || state === 'running') return;
      const resuming = state === 'paused';
      state = 'running';
      if (!resuming) {
        restarts = [];
        if (listen()) setSource('speech');
        else fallBack();
        return;
      }
      if (source === 'speech' && !engine && !listen()) fallBack();
      else if (source === 'scripted') typeOn();
    },
    pause() {
      if (state !== 'running') return;
      state = 'paused';
      clearTimers();
      // The engine delivers the words in flight, then ends without restarting.
      try {
        engine?.stop();
      } catch {
        // already stopped
      }
    },
    stop() {
      if (state === 'idle') return Promise.resolve();
      state = 'idle';
      clearTimers();
      if (source === 'scripted') {
        finishSentence();
        return Promise.resolve();
      }
      const current = engine;
      if (!current) {
        if (interim) deliver(tidyPhrase(interim));
        setInterim('');
        return Promise.resolve();
      }
      // The engine hands over what it heard last, then ends (see onend).
      return new Promise<void>((resolve) => {
        settle = resolve;
        setTimeout(resolve, SETTLE_MS);
        try {
          current.stop();
        } catch {
          resolve();
        }
      });
    },
    dispose() {
      disposed = true;
      state = 'idle';
      clearTimers();
      if (engine) silence(engine);
      engine = null;
      settle?.();
      settle = null;
    },
  };
}

/**
 * React face of createTranscriber. `onPhrase` receives each finished phrase,
 * ready to append to the note; `interim` holds the words still being heard.
 */
export function useLiveTranscript({
  onPhrase,
  allowScripted,
  script,
}: {
  onPhrase: (text: string) => void;
  allowScripted: boolean;
  script?: readonly string[];
}) {
  const [source, setSource] = useState<TranscriptSource>('none');
  const [interim, setInterim] = useState('');
  const onPhraseRef = useRef(onPhrase);
  useEffect(() => {
    onPhraseRef.current = onPhrase;
  }, [onPhrase]);

  const options = useRef({ allowScripted, script });
  const engine = useRef<Transcriber | null>(null);
  const get = useCallback(() => {
    if (!engine.current) {
      engine.current = createTranscriber(
        { onPhrase: (text) => onPhraseRef.current(text), onInterim: setInterim, onSource: setSource },
        options.current,
      );
    }
    return engine.current;
  }, []);

  useEffect(
    () => () => {
      engine.current?.dispose();
      engine.current = null;
    },
    [],
  );

  const run = useCallback(() => get().run(), [get]);
  const pause = useCallback(() => engine.current?.pause(), []);
  const stop = useCallback(() => engine.current?.stop() ?? Promise.resolve(), []);

  return { source, interim, run, pause, stop };
}
