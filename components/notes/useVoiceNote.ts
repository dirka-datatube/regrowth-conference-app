import { useCallback, useEffect, useRef } from 'react';
import { IS_DEMO } from '@/lib/demo';
import { DEMO_TRANSCRIPT } from '@/lib/demo-notes';
import { captureId, useDeviceCaptures, useRecorder, type RecordedAudio } from '@/lib/recording';
import { useLiveTranscript } from '@/lib/transcription';

/**
 * A voice note: the recorder and the live transcript, moving together. The
 * transcript listens while the recorder records, pauses with it and stops with
 * it; each finished phrase goes to `onPhrase` for the note body, and each
 * finished recording is filed with the note's device captures.
 *
 * Demo mode records simulated levels when there is no microphone, and types
 * the scripted keynote where the browser cannot transcribe.
 */
export function useVoiceNote({
  onPhrase,
  keepAliveInBackground,
  captureKeyRef,
}: {
  /** `newParagraph` is true for the first phrase of each recording. */
  onPhrase: (text: string, newParagraph: boolean) => void;
  keepAliveInBackground: boolean;
  captureKeyRef: { readonly current: string };
}) {
  const newParagraph = useRef(false);
  const onPhraseRef = useRef(onPhrase);
  useEffect(() => {
    onPhraseRef.current = onPhrase;
  }, [onPhrase]);

  const deliver = useCallback((text: string) => {
    onPhraseRef.current(text, newParagraph.current);
    newParagraph.current = false;
  }, []);
  const transcript = useLiveTranscript({ onPhrase: deliver, allowScripted: IS_DEMO, script: DEMO_TRANSCRIPT });

  const onFinish = useCallback(
    (audio: RecordedAudio) => {
      useDeviceCaptures.getState().add(captureKeyRef.current, {
        kind: 'audio',
        id: captureId(),
        uri: audio.uri,
        durationMs: audio.durationMs,
        simulated: audio.simulated,
      });
    },
    [captureKeyRef],
  );
  const recorder = useRecorder({ simulateIfUnavailable: IS_DEMO, keepAliveInBackground, onFinish });

  // A simulated recording has no microphone for a speech engine to hear.
  const { run, pause, stop } = transcript;
  const simulated = recorder.source === 'simulated';
  useEffect(() => {
    if (recorder.status === 'recording') run(simulated ? 'script' : 'auto');
    else if (recorder.status === 'paused') pause();
    else if (recorder.status === 'idle') stop();
  }, [recorder.status, simulated, run, pause, stop]);

  const startRecorder = recorder.start;
  const start = useCallback(() => {
    newParagraph.current = true;
    return startRecorder();
  }, [startRecorder]);

  // Stop both together, and wait for the transcript's last words, so a save
  // straight after has everything.
  const stopRecorder = recorder.stop;
  const stopBoth = useCallback(async () => {
    const [audio] = await Promise.all([stopRecorder(), stop()]);
    return audio;
  }, [stopRecorder, stop]);

  const active = recorder.status !== 'idle';
  return {
    ...recorder,
    start,
    stop: stopBoth,
    active,
    interim: active ? transcript.interim : '',
    transcriptSource: transcript.source,
    /** Words are arriving (or would, if anyone spoke): show the cue. */
    listening: recorder.status === 'recording' && transcript.source !== 'none',
    /** The next phrase opens a paragraph — the first of each recording. */
    startsParagraph: newParagraph.current,
  };
}
