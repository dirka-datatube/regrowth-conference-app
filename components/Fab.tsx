import { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Capture button — bottom-right of Insights.
 *
 * The Figma frame shows a plain "+". Spec v3 (4 Aug) supersedes that: the "+"
 * is replaced by a camera/video toggle plus a microphone record button. We
 * keep the design's circular affordance and expand it into the capture modes
 * on tap, so the visual language matches the file while the behaviour matches
 * the spec.
 *
 * Modes listed in `nativeOnlyModes` are still shown — with an "App" badge —
 * rather than hidden. Since the hybrid native wrapper was bought (2026-08-19)
 * there is somewhere to send people, so a browser user who wants to record a
 * keynote gets told how, instead of finding a feature that silently isn't
 * there.
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
  nativeOnlyModes = [],
  onNeedsApp,
}: {
  onCapture: (mode: CaptureMode) => void;
  /** Shown with an "App" badge; tapping calls onNeedsApp instead of onCapture. */
  nativeOnlyModes?: CaptureMode[];
  onNeedsApp?: (mode: CaptureMode) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View className="absolute bottom-32 right-5 items-end gap-y-3">
      {open &&
        ACTIONS.map((a) => {
          const nativeOnly = nativeOnlyModes.includes(a.mode);
          return (
            <Pressable
              key={a.mode}
              accessibilityLabel={nativeOnly ? `${a.label} — needs the REGROWTH app` : a.label}
              onPress={() => {
                setOpen(false);
                if (nativeOnly) onNeedsApp?.(a.mode);
                else onCapture(a.mode);
              }}
              className="flex-row items-center gap-x-3"
            >
              <Text className="font-ui text-tab text-snow">{a.label}</Text>
              {nativeOnly && (
                <View className="rounded-pill bg-accent-soft px-2 py-0.5">
                  <Text className="font-ui text-meta text-snow">App</Text>
                </View>
              )}
              <View
                className={`h-11 w-11 items-center justify-center rounded-pill border border-glass-line bg-glass ${
                  nativeOnly ? 'opacity-70' : ''
                }`}
              >
                <Ionicons name={a.icon} size={20} color="#FFFFFF" />
              </View>
            </Pressable>
          );
        })}

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
