import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { create } from 'zustand';
import { isInAppBrowser } from '@/lib/capture';

/**
 * Audio recording for notes — the platform plumbing behind one small hook.
 *
 *   • Web: getUserMedia + MediaRecorder, with an AnalyserNode for the live
 *     level. The browser records only while the page is open and visible
 *     (lib/capture.ts), so hiding the page pauses the recording and says why.
 *   • Native: expo-av Audio.Recording with metering. `keepAliveInBackground`
 *     sets `staysActiveInBackground`, which with UIBackgroundModes "audio"
 *     (app.json) keeps recording with the screen locked.
 *   • Simulated (demo only): generated levels when there is no microphone, so
 *     the prototype still shows the Audio Recording state.
 *
 * Everything is feature-detected when recording starts; nothing touches a
 * browser API at import or render time, and every failure becomes a message.
 *
 * Nothing is uploaded: no storage bucket fits note audio yet, so a recording
 * stays on the device (a blob: URL on the web, a file in the cache on native)
 * and is listed with its note by useDeviceCaptures below.
 */

export type RecorderStatus = 'idle' | 'starting' | 'recording' | 'paused';
export type RecorderSource = 'microphone' | 'simulated';
export type RecorderFailure = 'denied' | 'no-device' | 'busy' | 'unsupported' | 'failed';

export type RecordedAudio = {
  /** blob: URL (web) or file:// URI (native); null for a simulated recording. */
  uri: string | null;
  mimeType: string | null;
  durationMs: number;
  simulated: boolean;
};

export type MeterReading = { levels: readonly number[]; elapsedMs: number };

/** Live level history and elapsed time, read with useSyncExternalStore so only the waveform re-renders ten times a second. */
export type RecorderMeter = {
  get(): MeterReading;
  subscribe(listener: () => void): () => void;
};

const TICK_MS = 100; // one waveform bar per tick
const MAX_LEVELS = 160; // wider than any phone's waveform
const FLOOR = 0.04; // the level drawn when there is nothing to meter

class RecorderError extends Error {
  constructor(readonly reason: RecorderFailure) {
    super(reason);
  }
}

type Driver = {
  /** 0–1 input level now, or null when this driver cannot meter. */
  level(): number | null;
  pause(): void;
  resume(): void;
  stop(): Promise<{ uri: string | null; mimeType: string | null; durationMs?: number }>;
  /** Release everything without keeping the audio. */
  dispose(): void;
  setKeepAlive?(on: boolean): void;
};

/** dBFS (speech sits around -40 to -10) to a 0–1 bar height. */
function dbToLevel(db: number): number {
  return Math.min(1, Math.max(0, (db + 55) / 45));
}

function failureFor(err: unknown): RecorderFailure {
  const name = (err as { name?: string } | null)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') {
    return 'no-device';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') return 'busy';
  return 'failed';
}

function failureMessage(reason: RecorderFailure): string {
  switch (reason) {
    case 'denied':
      if (isInAppBrowser()) return 'This in-app browser blocks the microphone. Open the page in Safari or Chrome to record.';
      return Platform.OS === 'web'
        ? 'Microphone access is blocked. Allow it for this site in your browser settings, then tap the mic again.'
        : 'Microphone access is off. Turn it on for REGROWTH in Settings, then tap the mic again.';
    case 'no-device':
      return 'No microphone was found on this device.';
    case 'busy':
      return 'Another app is using the microphone. Close it, then tap the mic again.';
    case 'unsupported':
      return 'This browser cannot record audio. Use the REGROWTH app to record a session.';
    case 'failed':
      return 'Recording could not start. Try again in a moment.';
  }
}

export const SCREEN_OFF_NOTICE =
  'Paused while the screen was off — your browser stops recording when the screen locks. Tap Resume to carry on.';
const DEVICE_LOST =
  'The microphone disconnected, so recording stopped. What was captured is kept with this note.';

// --- Web -------------------------------------------------------------------

type LevelMeter = { attach(stream: MediaStream): void; level(): number | null; close(): void };

function createLevelMeter(): LevelMeter | null {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Ctx = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctx) return null;
  let ctx: AudioContext;
  try {
    ctx = new Ctx();
  } catch {
    return null;
  }
  let analyser: AnalyserNode | null = null;
  let samples: Uint8Array | null = null;
  const wake = () => {
    if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
  };
  wake();
  // Safari only runs a context resumed from a tap. If this one is still
  // suspended, the next tap anywhere wakes it.
  const doc = typeof document === 'undefined' ? null : document;
  doc?.addEventListener('pointerdown', wake);
  return {
    attach(stream) {
      try {
        analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        samples = new Uint8Array(analyser.fftSize);
        ctx.createMediaStreamSource(stream).connect(analyser);
      } catch {
        analyser = null;
      }
    },
    level() {
      if (!analyser || !samples || ctx.state !== 'running') return null;
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i += 1) {
        const v = (samples[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / samples.length);
      return dbToLevel(20 * Math.log10(rms || 1e-6));
    },
    close() {
      doc?.removeEventListener('pointerdown', wake);
      ctx.close().catch(() => undefined);
    },
  };
}

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
  return candidates.find((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  });
}

async function startWebDriver(onEnded: () => void): Promise<Driver> {
  const devices = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
  if (
    typeof window === 'undefined' ||
    typeof MediaRecorder === 'undefined' ||
    typeof devices?.getUserMedia !== 'function'
  ) {
    throw new RecorderError('unsupported');
  }

  // Made before the first await, while the tap that started recording still
  // counts as a gesture — Safari keeps a context created later suspended.
  const meter = createLevelMeter();

  let stream: MediaStream;
  try {
    stream = await devices.getUserMedia({ audio: true });
  } catch (err) {
    meter?.close();
    throw new RecorderError(failureFor(err));
  }
  const tracks = stream.getTracks();
  const release = () => {
    tracks.forEach((t) => {
      t.removeEventListener('ended', onEnded);
      t.stop();
    });
    meter?.close();
  };

  const chunks: Blob[] = [];
  const mimeType = pickMimeType();
  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    // Hand over data every second, so a recording cut short keeps what it has.
    recorder.start(1000);
  } catch {
    release();
    throw new RecorderError('unsupported');
  }
  meter?.attach(stream);
  tracks.forEach((t) => t.addEventListener('ended', onEnded));

  return {
    level: () => meter?.level() ?? null,
    pause() {
      try {
        if (recorder.state === 'recording') recorder.pause();
      } catch {
        // pause unsupported: the tick stops counting and drawing regardless
      }
    },
    resume() {
      try {
        if (recorder.state === 'paused') recorder.resume();
      } catch {
        // see pause()
      }
    },
    stop() {
      return new Promise((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          release();
          const type = recorder.mimeType || mimeType || 'audio/webm';
          const blob = chunks.length ? new Blob(chunks, { type }) : null;
          resolve({ uri: blob ? URL.createObjectURL(blob) : null, mimeType: type });
        };
        recorder.onstop = finish;
        // A recorder that never reports stopping still hands back what it has.
        setTimeout(finish, 2000);
        try {
          if (recorder.state === 'inactive') finish();
          else recorder.stop();
        } catch {
          finish();
        }
      });
    },
    dispose() {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      try {
        if (recorder.state !== 'inactive') recorder.stop();
      } catch {
        // already stopped
      }
      release();
    },
  };
}

// --- Native ----------------------------------------------------------------

function recordingMode(keepAlive: boolean) {
  return { allowsRecordingIOS: true, playsInSilentModeIOS: true, staysActiveInBackground: keepAlive };
}

function releaseAudioMode() {
  return Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => undefined);
}

async function startNativeDriver(keepAlive: boolean): Promise<Driver> {
  let granted = false;
  try {
    granted = (await Audio.requestPermissionsAsync()).granted;
  } catch {
    throw new RecorderError('failed');
  }
  if (!granted) throw new RecorderError('denied');

  let metering: number | null = null;
  let recording: Audio.Recording;
  try {
    await Audio.setAudioModeAsync(recordingMode(keepAlive));
    ({ recording } = await Audio.Recording.createAsync(
      { ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true },
      (status) => {
        if (typeof status.metering === 'number') metering = status.metering;
      },
      TICK_MS,
    ));
  } catch {
    await releaseAudioMode();
    throw new RecorderError('failed');
  }

  return {
    level: () => (metering === null ? null : dbToLevel(metering)),
    pause() {
      recording.pauseAsync().catch(() => undefined);
    },
    resume() {
      recording.startAsync().catch(() => undefined);
    },
    async stop() {
      const status = await recording.stopAndUnloadAsync().catch(() => null);
      await releaseAudioMode();
      return { uri: recording.getURI(), mimeType: null, durationMs: status?.durationMillis };
    },
    dispose() {
      recording
        .stopAndUnloadAsync()
        .catch(() => undefined)
        .then(releaseAudioMode);
    },
    setKeepAlive(on) {
      Audio.setAudioModeAsync(recordingMode(on)).catch(() => undefined);
    },
  };
}

// --- Simulated (demo) --------------------------------------------------------

function simulatedDriver(): Driver {
  let amp = 0.6;
  let hush = 0;
  let beat = 0;
  return {
    level() {
      beat += 1;
      if (hush > 0) {
        hush -= 1;
        return 0.04 + Math.random() * 0.08;
      }
      if (Math.random() < 0.05) hush = 2 + Math.floor(Math.random() * 6); // a breath between phrases
      if (beat % 3 === 0) amp = 0.35 + Math.random() * 0.65; // a new syllable
      return Math.min(1, amp * (0.45 + Math.random() * 0.55));
    },
    pause() {},
    resume() {},
    stop: async () => ({ uri: null, mimeType: null }),
    dispose() {},
  };
}

// --- Hook --------------------------------------------------------------------

function createMeterStore() {
  let reading: MeterReading = { levels: [], elapsedMs: 0 };
  const listeners = new Set<() => void>();
  return {
    get: () => reading,
    set(next: MeterReading) {
      reading = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type RecorderOptions = {
  /** Demo: record simulated levels when the microphone is unavailable. */
  simulateIfUnavailable?: boolean;
  /** Native: keep recording with the screen locked. */
  keepAliveInBackground?: boolean;
  /** Every finished recording — including one ended by leaving the screen. */
  onFinish?: (audio: RecordedAudio) => void;
};

export function useRecorder({
  simulateIfUnavailable = false,
  keepAliveInBackground = true,
  onFinish,
}: RecorderOptions = {}) {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [source, setSource] = useState<RecorderSource | null>(null);
  const [error, setError] = useState<{ reason: RecorderFailure; message: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [meter] = useState(createMeterStore);

  const statusRef = useRef<RecorderStatus>('idle');
  const sourceRef = useRef<RecorderSource | null>(null);
  const driverRef = useRef<Driver | null>(null);
  const cancelStart = useRef(false);
  const mounted = useRef(true);
  const clock = useRef({ total: 0, since: 0 });
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const options = useRef({ simulateIfUnavailable, keepAliveInBackground, onFinish });
  useEffect(() => {
    options.current = { simulateIfUnavailable, keepAliveInBackground, onFinish };
  }, [simulateIfUnavailable, keepAliveInBackground, onFinish]);

  const setBoth = useCallback((next: RecorderStatus) => {
    statusRef.current = next;
    if (mounted.current) setStatus(next);
  }, []);

  const elapsed = useCallback(() => {
    const c = clock.current;
    return c.total + (c.since ? Date.now() - c.since : 0);
  }, []);

  const stopTicker = useCallback(() => {
    if (ticker.current) clearInterval(ticker.current);
    ticker.current = null;
  }, []);

  const startTicker = useCallback(() => {
    stopTicker();
    ticker.current = setInterval(() => {
      const driver = driverRef.current;
      if (!driver || statusRef.current !== 'recording') return;
      const prev = meter.get().levels;
      const levels = prev.length >= MAX_LEVELS ? prev.slice(prev.length - MAX_LEVELS + 1) : prev.slice();
      levels.push(driver.level() ?? FLOOR);
      meter.set({ levels, elapsedMs: elapsed() });
    }, TICK_MS);
  }, [elapsed, meter, stopTicker]);

  const stop = useCallback(async (): Promise<RecordedAudio | null> => {
    if (statusRef.current === 'starting') {
      cancelStart.current = true;
      setBoth('idle');
      return null;
    }
    const driver = driverRef.current;
    if (!driver) return null;
    driverRef.current = null;
    stopTicker();
    const durationMs = elapsed();
    clock.current = { total: durationMs, since: 0 };
    setBoth('idle');
    if (mounted.current) setNotice(null);
    const out = await driver.stop();
    const audio: RecordedAudio = {
      uri: out.uri,
      mimeType: out.mimeType,
      durationMs: out.durationMs ?? durationMs,
      simulated: sourceRef.current === 'simulated',
    };
    options.current.onFinish?.(audio);
    return audio;
  }, [elapsed, setBoth, stopTicker]);

  // The microphone went away mid-recording (unplugged, or taken by the OS).
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);
  const onTrackEnded = useCallback(() => {
    if (statusRef.current !== 'recording' && statusRef.current !== 'paused') return;
    stopRef.current().catch(() => undefined);
    if (mounted.current) setError({ reason: 'failed', message: DEVICE_LOST });
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (statusRef.current !== 'idle') return false;
    cancelStart.current = false;
    setError(null);
    setNotice(null);
    setBoth('starting');
    let driver: Driver;
    let src: RecorderSource = 'microphone';
    try {
      driver =
        Platform.OS === 'web'
          ? await startWebDriver(onTrackEnded)
          : await startNativeDriver(options.current.keepAliveInBackground);
    } catch (err) {
      // Cancelled by stop() (which already went idle), or a real failure.
      if (cancelStart.current) return false;
      if (!options.current.simulateIfUnavailable) {
        const reason = err instanceof RecorderError ? err.reason : 'failed';
        if (mounted.current) setError({ reason, message: failureMessage(reason) });
        setBoth('idle');
        return false;
      }
      driver = simulatedDriver();
      src = 'simulated';
    }
    if (!mounted.current || cancelStart.current) {
      driver.dispose();
      return false;
    }
    driverRef.current = driver;
    sourceRef.current = src;
    setSource(src);
    clock.current = { total: 0, since: Date.now() };
    meter.set({ levels: [], elapsedMs: 0 });
    setBoth('recording');
    startTicker();
    return true;
  }, [meter, onTrackEnded, setBoth, startTicker]);

  const pauseWith = useCallback(
    (reason: string | null) => {
      const driver = driverRef.current;
      if (statusRef.current !== 'recording' || !driver) return;
      driver.pause();
      clock.current = { total: elapsed(), since: 0 };
      meter.set({ levels: meter.get().levels, elapsedMs: clock.current.total });
      setBoth('paused');
      if (reason && mounted.current) setNotice(reason);
    },
    [elapsed, meter, setBoth],
  );

  const pause = useCallback(() => pauseWith(null), [pauseWith]);

  const resume = useCallback(() => {
    const driver = driverRef.current;
    if (statusRef.current !== 'paused' || !driver) return;
    driver.resume();
    clock.current = { total: clock.current.total, since: Date.now() };
    setNotice(null);
    setBoth('recording');
  }, [setBoth]);

  const clearError = useCallback(() => setError(null), []);

  // Web: a hidden page is a locked screen or another tab. The browser stops
  // capturing either way, so pause honestly rather than record silence.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pauseWith(SCREEN_OFF_NOTICE);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pauseWith]);

  // Web: closing or reloading the tab mid-recording loses it — ask first.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (status !== 'recording' && status !== 'paused') return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);

  // Native: the screen-off setting can change mid-recording.
  useEffect(() => {
    driverRef.current?.setKeepAlive?.(keepAliveInBackground);
  }, [keepAliveInBackground]);

  // Leaving the screen ends the recording; what was captured is still handed
  // to onFinish, so it stays with the note.
  useEffect(() => {
    mounted.current = true;
    const opts = options;
    return () => {
      mounted.current = false;
      cancelStart.current = true;
      stopTicker();
      const driver = driverRef.current;
      driverRef.current = null;
      if (!driver) return;
      const durationMs = elapsed();
      const simulated = sourceRef.current === 'simulated';
      const finish = opts.current.onFinish;
      driver
        .stop()
        .then((out) =>
          finish?.({ uri: out.uri, mimeType: out.mimeType, durationMs: out.durationMs ?? durationMs, simulated }),
        )
        .catch(() => undefined);
    };
  }, [elapsed, stopTicker]);

  return {
    status,
    source,
    error,
    notice,
    meter: meter as RecorderMeter,
    start,
    pause,
    resume,
    stop,
    clearError,
  };
}

// --- Formatting ----------------------------------------------------------------

/** "00:10:04" — the recorder's clock. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const parts = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
  return parts.map((n) => String(n).padStart(2, '0')).join(':');
}

/** "10 minutes 4 seconds" — the clock for screen readers. */
export function spokenDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const part = (n: number, unit: string) => (n ? `${n} ${unit}${n === 1 ? '' : 's'}` : '');
  return [part(h, 'hour'), part(m, 'minute'), part(s, 'second')].filter(Boolean).join(' ') || '0 seconds';
}

// --- Playback ------------------------------------------------------------------

export type Playback = { stop(): void };

/** Play a recording kept on this device. `onEnd` fires when it finishes, fails or is stopped. */
export async function playRecording(uri: string, onEnd: () => void): Promise<Playback | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof window.Audio === 'undefined') {
      onEnd();
      return null;
    }
    const el = new window.Audio(uri);
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      el.pause();
      onEnd();
    };
    el.addEventListener('ended', end);
    el.addEventListener('error', end);
    try {
      await el.play();
      return { stop: end };
    } catch {
      end();
      return null;
    }
  }
  try {
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      sound.unloadAsync().catch(() => undefined);
      onEnd();
    };
    sound.setOnPlaybackStatusUpdate((s) => {
      if (!s.isLoaded || s.didJustFinish) end();
    });
    return { stop: end };
  } catch {
    onEnd();
    return null;
  }
}

// --- Captures kept on this device ------------------------------------------------

/**
 * Media captured for a note on this device: recordings, photos and videos.
 *
 * No storage bucket fits note media yet (headshots, logos and the gallery are
 * public; business cards are for OCR), so nothing is uploaded. Captures live
 * for the app session, keyed by note id — or by a draft key until the note
 * row exists — so the note detail can show what Create Note captured.
 */
export type DeviceCapture =
  | { kind: 'audio'; id: string; uri: string | null; durationMs: number; simulated: boolean }
  | { kind: 'photo'; id: string; uri: string; width: number; height: number }
  | { kind: 'video'; id: string; uri: string; durationMs: number | null };

type DeviceCaptures = {
  byKey: Record<string, DeviceCapture[]>;
  add: (key: string, capture: DeviceCapture) => void;
  remove: (key: string, id: string) => void;
  /** A draft's captures follow it once its note has an id. */
  rekey: (from: string, to: string) => void;
};

export const useDeviceCaptures = create<DeviceCaptures>((set) => ({
  byKey: {},
  add: (key, capture) =>
    set((s) => ({ byKey: { ...s.byKey, [key]: [...(s.byKey[key] ?? []), capture] } })),
  remove: (key, id) =>
    set((s) => ({ byKey: { ...s.byKey, [key]: (s.byKey[key] ?? []).filter((c) => c.id !== id) } })),
  rekey: (from, to) =>
    set((s) => {
      const moving = s.byKey[from];
      if (from === to || !moving) return s;
      const byKey = { ...s.byKey };
      delete byKey[from];
      byKey[to] = [...(byKey[to] ?? []), ...moving];
      return { byKey };
    }),
}));

export function captureId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
