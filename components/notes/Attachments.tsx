import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatClock, playRecording, type DeviceCapture, type Playback } from '@/lib/recording';
import { colors } from '@/lib/theme';

/**
 * What was captured for a note on this device: recordings (with playback),
 * photos and videos. None of it is uploaded yet — no storage bucket fits note
 * media — and each item says so.
 */

type Of<K extends DeviceCapture['kind']> = Extract<DeviceCapture, { kind: K }>;

function RemoveButton({ label, onPress, overlay }: { label: string; onPress: () => void; overlay?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`h-7 w-7 items-center justify-center rounded-pill ${overlay ? 'absolute right-2 top-2 bg-scrim' : 'bg-well'}`}
    >
      <Ionicons name="close" size={14} color={colors.snow} />
    </Pressable>
  );
}

function Row({
  icon,
  title,
  caption,
  action,
  onRemove,
  removeLabel,
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
  action?: React.ReactNode;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <View className="flex-row items-center gap-x-3 rounded-tile border border-card-line px-3 py-2.5">
      {action ?? <View className="h-9 w-9 items-center justify-center rounded-pill bg-well">{icon}</View>}
      <View className="flex-1 gap-y-0.5">
        <Text className="font-data text-[14px] text-snow">{title}</Text>
        <Text className="font-data text-[12px] leading-[16px] text-quiet">{caption}</Text>
      </View>
      <RemoveButton label={removeLabel} onPress={onRemove} />
    </View>
  );
}

function AudioItem({ capture, onRemove }: { capture: Of<'audio'>; onRemove: () => void }) {
  const [playing, setPlaying] = useState(false);
  const playback = useRef<Playback | null>(null);
  useEffect(() => {
    const current = playback;
    return () => current.current?.stop();
  }, []);

  async function toggle() {
    if (playing) {
      playback.current?.stop();
      return;
    }
    if (!capture.uri) return;
    setPlaying(true);
    playback.current = await playRecording(capture.uri, () => {
      playback.current = null;
      setPlaying(false);
    });
  }

  return (
    <Row
      icon={<Ionicons name="mic-outline" size={18} color={colors.snow} />}
      title={`Voice recording · ${formatClock(capture.durationMs)}`}
      caption={
        capture.simulated
          ? 'Demo recording — simulated, so there is no audio to play.'
          : 'Kept on this device — recordings are not uploaded yet.'
      }
      action={
        capture.uri ? (
          <Pressable
            onPress={toggle}
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Stop playing the recording' : 'Play the recording'}
            className="h-9 w-9 items-center justify-center rounded-pill bg-earth"
          >
            <Ionicons name={playing ? 'stop' : 'play'} size={16} color={colors.snow} />
          </Pressable>
        ) : undefined
      }
      onRemove={onRemove}
      removeLabel="Remove this recording"
    />
  );
}

function PhotoItem({ capture, onRemove }: { capture: Of<'photo'>; onRemove: () => void }) {
  // Tall portraits are cropped to 4:5 so a photo never swallows the note.
  const ratio = capture.width && capture.height ? Math.max(capture.width / capture.height, 0.8) : 4 / 3;
  return (
    <View>
      <View>
        <Image
          source={{ uri: capture.uri }}
          resizeMode="cover"
          accessibilityLabel="Photo added to this note"
          accessibilityIgnoresInvertColors
          className="w-full rounded-tile"
          style={{ aspectRatio: ratio }}
        />
        <RemoveButton label="Remove this photo" onPress={onRemove} overlay />
      </View>
      <Text className="mt-1.5 font-data text-[12px] leading-[16px] text-quiet">
        Kept on this device — photos do not sync with your notes yet.
      </Text>
    </View>
  );
}

function VideoItem({ capture, onRemove }: { capture: Of<'video'>; onRemove: () => void }) {
  return (
    <Row
      icon={<Ionicons name="videocam-outline" size={18} color={colors.snow} />}
      title={capture.durationMs ? `Video · ${formatClock(capture.durationMs)}` : 'Video'}
      caption="Kept on this device — videos are not uploaded yet."
      onRemove={onRemove}
      removeLabel="Remove this video"
    />
  );
}

/** Dashed tile for a capture the screen was opened for but that has not happened yet. */
export function CapturePrompt({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="items-center gap-y-2 rounded-tile border border-dashed border-card-line px-4 py-6"
    >
      <Ionicons name={icon} size={24} color={colors.snow} />
      <Text className="font-data text-[14px] text-snow">{title}</Text>
      <Text className="font-data text-[12px] text-quiet">It stays with this note on this device.</Text>
    </Pressable>
  );
}

export function Attachments({
  captures,
  onRemove,
}: {
  captures: readonly DeviceCapture[];
  onRemove: (id: string) => void;
}) {
  if (!captures.length) return null;
  return (
    <View className="gap-y-3">
      {captures.map((c) =>
        c.kind === 'audio' ? (
          <AudioItem key={c.id} capture={c} onRemove={() => onRemove(c.id)} />
        ) : c.kind === 'photo' ? (
          <PhotoItem key={c.id} capture={c} onRemove={() => onRemove(c.id)} />
        ) : (
          <VideoItem key={c.id} capture={c} onRemove={() => onRemove(c.id)} />
        ),
      )}
    </View>
  );
}
