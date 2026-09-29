import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Chip } from '@/components/Chip';
import { IS_DEMO } from '@/lib/demo';
import { canRecordInBackground, hasUserActivation, nativeAppLink, recordingCaveat } from '@/lib/capture';
import { formatClock, useDeviceCaptures, type DeviceCapture } from '@/lib/recording';
import { colors } from '@/lib/theme';
import { CaptureButtons } from './CaptureButtons';
import { NoteEditor } from './NoteEditor';
import { RecorderPanel } from './Recorder';
import { Attachments, CapturePrompt } from './Attachments';
import { Notice, type NoticeAction } from './Notices';
import { pickPhoto, recordVideo, type PickResult } from './mediaCapture';
import { useVoiceNote } from './useVoiceNote';
import type { NoteDraft, SaveStatus } from './useNoteDraft';

/**
 * Note capture chrome — Create Note (93:1081) and its Audio Recording state
 * (134:998) — shared by the note detail.
 *
 * Header: back, title and rule, with the mic and moon discs. Body: the event
 * tag as a large Inter title, then the note in Butler, borderless. Recording
 * brings the recorder in under the text, where the comp draws it; a long note
 * scrolls above it, so the controls never leave the screen. The comp has no
 * save control (notes autosave), so a slim footer adds the save state and
 * Done, and a camera for photo notes.
 */

export type CaptureMode = 'voice' | 'photo' | 'video';

export type NoteTag = {
  title: string;
  /** Small line above the title — the event, when the title is a session. */
  eyebrow?: string | null;
  /** Events this note could be tagged to (the attendee's registrations). */
  options?: { id: string; label: string }[];
  selected?: string | null;
  onSelect?: (id: string) => void;
};

const NO_CAPTURES: DeviceCapture[] = [];
const PLACEHOLDER = 'What’s resonating? What will you act on?';
// Wraps short notes so the recorder sits right under the text, and scrolls
// long ones above it.
const SHRINK_TO_FIT: ViewStyle = { flexGrow: 0, flexShrink: 1 };
const FILL: ViewStyle = { flex: 1 };

function saveLine(status: SaveStatus, exists: boolean): string {
  switch (status) {
    case 'locked':
      return 'Not saved — register to keep notes';
    case 'saving':
      return 'Saving…';
    case 'saved':
      return 'Saved';
    case 'error':
      return 'Not saved — check your connection';
    case 'idle':
      return exists ? 'Saved' : 'Saves as you type';
  }
}

function TagTitle({ tag }: { tag: NoteTag }) {
  const [open, setOpen] = useState(false);
  const options = tag.options ?? [];
  const canPick = options.length > 1 && !!tag.onSelect;
  return (
    <View>
      {tag.eyebrow ? (
        <View className="mb-1.5 flex-row items-center gap-x-1.5">
          <Ionicons name="pricetag-outline" size={12} color={colors.indicator} />
          <Text className="font-data text-[13px] text-quiet">{tag.eyebrow}</Text>
        </View>
      ) : null}
      <Pressable
        onPress={() => setOpen((o) => !o)}
        disabled={!canPick}
        accessibilityRole={canPick ? 'button' : 'header'}
        accessibilityLabel={canPick ? `${tag.title} — change event` : tag.title}
        aria-expanded={canPick ? open : undefined}
        className="flex-row items-center gap-x-2"
      >
        <Text className="shrink font-data text-[30px] leading-[36px] text-snow">{tag.title}</Text>
        {canPick && <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.quiet} />}
      </Pressable>
      {canPick && open && (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {options.map((o) => (
            <Chip
              key={o.id}
              label={o.label}
              selected={o.id === tag.selected}
              onPress={() => {
                tag.onSelect?.(o.id);
                setOpen(false);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/** The chrome while a note loads, or in place of one that cannot be opened. */
export function NoteScreenState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: NoticeAction;
}) {
  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top']}>
      <StatusBar style="light" />
      <View className="px-5 pt-2">
        <ScreenHeader title={title} />
      </View>
      <View className="flex-1 items-center justify-center gap-y-4 px-8">
        {message ? (
          <Text className="text-center font-data text-[14px] leading-[20px] text-quiet">{message}</Text>
        ) : (
          <ActivityIndicator color={colors.snow} accessibilityLabel="Loading the note" />
        )}
        {action && (
          <Pressable onPress={action.onPress} accessibilityRole="button" className="rounded-cta bg-ocean px-4 py-2.5">
            <Text className="font-data text-[13px] font-semibold text-snow">{action.label}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

export function FooterButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-9 w-9 items-center justify-center rounded-pill bg-well"
    >
      <Ionicons name={icon} size={18} color={colors.snow} />
    </Pressable>
  );
}

export function NoteComposer({
  headerTitle,
  draft,
  tag,
  autoCapture = null,
  lockedNotice,
  beforeBody,
  children,
  footerStart,
  onDone,
}: {
  headerTitle: string;
  draft: NoteDraft;
  tag: NoteTag;
  /** The capture the screen was opened for (`?capture=`). */
  autoCapture?: CaptureMode | null;
  /** Shown under the title when the note cannot be saved. */
  lockedNotice?: ReactNode;
  /** Between the title and the note — the detail's flags. */
  beforeBody?: ReactNode;
  /** After the note and its captures — the detail's AI summary. */
  children?: ReactNode;
  /** Extra footer controls, before the save state. */
  footerStart?: ReactNode;
  onDone: (noteId: string | null) => void;
}) {
  const web = Platform.OS === 'web';
  const [notice, setNotice] = useState<{ text: string; action?: NoticeAction } | null>(null);
  // Native: screen-off recording starts on — it is why the app exists.
  const [keepAlive, setKeepAlive] = useState(true);
  const [leaving, setLeaving] = useState(false);

  const voice = useVoiceNote({
    onPhrase: draft.append,
    keepAliveInBackground: keepAlive,
    captureKeyRef: draft.captureKeyRef,
  });
  const captures = useDeviceCaptures((s) => s.byKey[draft.captureKey] ?? NO_CAPTURES);
  const removeCapture = useDeviceCaptures((s) => s.remove);

  // A browser with no recorder at all joins the moon in pointing to the app.
  // Demo mode simulates instead, so the prototype always records.
  const micNeedsApp = web && !IS_DEMO && canRecordInBackground() === 'unsupported';
  const openApp = () => router.push(nativeAppLink() as never);

  async function finishRecording() {
    const audio = await voice.stop();
    // A recording needs a note to belong to, even before anything is written.
    if (audio && !draft.currentId()) await draft.ensure(`Voice note · ${formatClock(audio.durationMs)}`);
  }

  async function onMic() {
    if (voice.active) return finishRecording();
    if (micNeedsApp) return openApp();
    setNotice(null);
    voice.clearError();
    // Once the recorder has taken its space, show where the words will land.
    if (await voice.start()) setTimeout(showNoteEnd, 80);
  }

  function onMoon() {
    if (web) {
      // Leaving now would end the recording, so explain instead of navigating.
      if (voice.active) {
        setNotice({
          text: 'Recording with the screen off needs the REGROWTH app — the browser stops capture when the screen locks.',
          action: { label: 'Get the app', onPress: openApp },
        });
      } else {
        openApp();
      }
      return;
    }
    const next = !keepAlive;
    setKeepAlive(next);
    setNotice({
      text: next
        ? 'Screen-off recording is on — lock your phone and the recording carries on.'
        : 'Screen-off recording is off — recording pauses when your phone locks.',
    });
  }

  function attach(result: PickResult, fallbackTitle: string) {
    if (result.kind === 'error') setNotice({ text: result.message });
    if (result.kind !== 'picked') return;
    useDeviceCaptures.getState().add(draft.captureKeyRef.current, result.capture);
    if (!draft.currentId()) draft.ensure(fallbackTitle);
  }

  async function addPhoto() {
    attach(await pickPhoto(), 'Photo note');
  }

  async function addVideo() {
    if (web) {
      setNotice({
        text: 'Video notes need the REGROWTH app. Here you can record your voice and add photos.',
        action: { label: 'Get the app', onPress: openApp },
      });
      return;
    }
    attach(await recordVideo(), 'Video note');
  }

  // Opened from a capture button (Home, Insights, Profile): start that capture.
  // A browser allows it only just after a tap, so a link opened cold waits.
  const actions = useRef({ onMic, addPhoto, addVideo });
  actions.current = { onMic, addPhoto, addVideo };
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoCapture || autoStarted.current) return;
    autoStarted.current = true;
    if (autoCapture === 'voice') {
      if (hasUserActivation('sticky')) actions.current.onMic();
      else setNotice({ text: 'Tap the mic to start recording.' });
    } else if (autoCapture === 'photo') {
      if (hasUserActivation('transient')) actions.current.addPhoto();
    } else {
      actions.current.addVideo();
    }
  }, [autoCapture]);

  async function done() {
    if (leaving) return;
    setLeaving(true);
    if (voice.active) await finishRecording();
    const saved = await draft.flush();
    setLeaving(false);
    if (!saved && draft.canSave) return; // the footer says why
    onDone(draft.currentId());
  }

  // Keep the newest words in view as they arrive, unless the reader has
  // scrolled back up to read.
  const scrollRef = useRef<ScrollView>(null);
  const view = useRef({ offset: 0, height: 0, editorBottom: 0 });
  function showNoteEnd() {
    const v = view.current;
    if (v.height) scrollRef.current?.scrollTo({ y: Math.max(0, v.editorBottom - v.height + 24), animated: true });
  }
  function onEditorLayout(e: LayoutChangeEvent) {
    const { y, height } = e.nativeEvent.layout;
    const v = view.current;
    const before = v.editorBottom;
    v.editorBottom = y + height;
    if (voice.status !== 'recording' || v.editorBottom <= before) return;
    if (v.offset + v.height >= before - 60) showNoteEnd();
  }

  const panelNotes: string[] = [];
  const settled = voice.status !== 'starting';
  if (!settled) panelNotes.push('Waiting for the microphone…');
  if (voice.notice) panelNotes.push(voice.notice);
  if (settled && voice.source === 'simulated') {
    panelNotes.push('Demo: there is no microphone here, so the levels and the transcript are simulated.');
  } else if (settled && voice.transcriptSource === 'scripted') {
    panelNotes.push('Demo: this browser has no live captions, so a sample session types itself out.');
  }
  if (settled && voice.transcriptSource === 'none') {
    panelNotes.push('Recording audio only — the transcript arrives after upload.');
  }
  const caveat = web && voice.source === 'microphone' ? recordingCaveat() : null;
  if (caveat) panelNotes.push(caveat);

  const shownNotice = voice.error
    ? {
        text: voice.error.message,
        action: voice.error.reason === 'unsupported' ? { label: 'Get the app', onPress: openApp } : undefined,
        onDismiss: voice.clearError,
      }
    : notice
      ? { ...notice, onDismiss: () => setNotice(null) }
      : null;

  const photoPrompt = autoCapture === 'photo' && !captures.some((c) => c.kind === 'photo');
  const videoPrompt = autoCapture === 'video' && !web && !captures.some((c) => c.kind === 'video');

  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View className="px-5 pt-2">
        <ScreenHeader
          title={headerTitle}
          right={
            <CaptureButtons
              recording={voice.active}
              onMic={onMic}
              micNeedsApp={micNeedsApp}
              onMoon={onMoon}
              moonOn={!web && keepAlive}
              moonNeedsApp={web}
            />
          }
        />
      </View>

      <KeyboardAvoidingView style={FILL} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={SHRINK_TO_FIT}
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 32, paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={32}
          onLayout={(e) => {
            view.current.height = e.nativeEvent.layout.height;
          }}
          onScroll={(e) => {
            view.current.offset = e.nativeEvent.contentOffset.y;
          }}
        >
          <TagTitle tag={tag} />
          {lockedNotice}
          {shownNotice && <Notice {...shownNotice} />}
          {beforeBody}
          <View onLayout={onEditorLayout} className="mt-3">
            <NoteEditor
              value={draft.body}
              onChangeText={draft.setBody}
              interim={voice.interim}
              listening={voice.listening}
              newParagraph={voice.startsParagraph}
              placeholder={PLACEHOLDER}
              compact={!!children}
            />
          </View>
          {(captures.length > 0 || photoPrompt || videoPrompt) && (
            <View className="mt-4 gap-y-3">
              {photoPrompt && <CapturePrompt icon="camera-outline" title="Add a photo" onPress={addPhoto} />}
              {videoPrompt && <CapturePrompt icon="videocam-outline" title="Record a video" onPress={addVideo} />}
              <Attachments captures={captures} onRemove={(id) => removeCapture(draft.captureKey, id)} />
            </View>
          )}
          {children}
        </ScrollView>

        {voice.active && (
          <RecorderPanel
            meter={voice.meter}
            status={voice.status}
            onPause={voice.pause}
            onResume={voice.resume}
            onStop={finishRecording}
            notes={panelNotes.slice(0, 2)}
          />
        )}

        <View className="flex-1" />

        <View className="flex-row items-center gap-x-2.5 px-5 pb-2 pt-3">
          <FooterButton icon="camera-outline" label="Add a photo" onPress={addPhoto} />
          {footerStart}
          <Text className="flex-1 font-data text-[12px] text-quiet" numberOfLines={1}>
            {saveLine(draft.status, !!draft.noteId)}
          </Text>
          <Pressable
            onPress={done}
            disabled={leaving}
            accessibilityRole="button"
            accessibilityLabel="Done — save and close"
            className="rounded-cta bg-ocean px-4 py-2.5"
          >
            <Text className="font-data text-[13px] font-semibold text-snow">Done</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
