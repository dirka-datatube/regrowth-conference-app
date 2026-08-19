import { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Capture button — bottom-right of Insights.
 *
 * The Figma frame shows a plain "+". Spec v3 (4 Aug) supersedes that: the "+"
 * is to be replaced by a camera/video toggle plus a microphone record button.
 * We keep the design's circular affordance and expand it into the three
 * capture modes on tap, so the visual language matches the file while the
 * behaviour matches the spec.
 *
 * `video` and `voice` are gated by the caller: on a PWA, MediaRecorder stops
 * when the browser is backgrounded or the screen locks, so long-session audio
 * capture is not offered unless the host can sustain it.
 */

export type CaptureMode = 'note' | 'photo' | 'video' | 'voice';

const ACTIONS: { mode: CaptureMode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { mode: 'voice', icon: 'mic', label: 'Record a voice note' },
  { mode: 'video', icon: 'videocam', label: 'Record video' },
  { mode: 'photo', icon: 'camera', label: 'Take a photo' },
  { mode: 'note', icon: 'create', label: 'Write a note' },
];

export function Fab({
  onCapture,
  disabledModes = [],
}: {
  onCapture: (mode: CaptureMode) => void;
  disabledModes?: CaptureMode[];
}) {
  const [open, setOpen] = useState(false);
  const actions = ACTIONS.filter((a) => !disabledModes.includes(a.mode));

  return (
    <View className="absolute bottom-32 right-5 items-end gap-y-3">
      {open &&
        actions.map((a) => (
          <Pressable
            key={a.mode}
            accessibilityLabel={a.label}
            onPress={() => {
              setOpen(false);
              onCapture(a.mode);
            }}
            className="flex-row items-center gap-x-3"
          >
            <Text className="font-ui text-tab text-snow">{a.label}</Text>
            <View className="h-11 w-11 items-center justify-center rounded-pill bg-glass border border-glass-line">
              <Ionicons name={a.icon} size={20} color="#FFFFFF" />
            </View>
          </Pressable>
        ))}

      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityLabel={open ? 'Close capture menu' : 'Capture a note'}
        accessibilityState={{ expanded: open }}
        className="h-[43px] w-[43px] items-center justify-center rounded-pill bg-earth"
      >
        <Ionicons name={open ? 'close' : 'add'} size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
