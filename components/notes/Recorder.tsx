import { useState, useSyncExternalStore } from 'react';
import { View, Text, Pressable, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatClock, spokenDuration, type RecorderMeter, type RecorderStatus } from '@/lib/recording';
import { colors } from '@/lib/theme';

/**
 * The recorder from Audio Recording (134:998): a white pill waveform over the
 * elapsed time, with Pause and Stop.
 *
 * Bars left of the playhead are the audio captured so far, one per 100ms tick;
 * grey ticks to its right are the time still to come. The playhead walks in
 * from the left and settles two-thirds across, where the comp draws it, and
 * the bars scroll beneath it from then on.
 */

const PAD = 16; // pill inset to the first bar
const BAR = 2;
const PITCH = 5; // bar + gap, as measured on the comp
const PLAYHEAD_AT = 0.66;

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

export function Waveform({ levels }: { levels: readonly number[] }) {
  const [width, setWidth] = useState(0);
  const slots = Math.max(0, Math.floor((width - PAD * 2 + (PITCH - BAR)) / PITCH));
  const bars = levels.slice(-Math.floor(slots * PLAYHEAD_AT));
  const ticks = Math.max(0, slots - bars.length - 1);
  const playhead = PAD + bars.length * PITCH;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="image"
      accessibilityLabel="Recording levels"
      className="h-[70px] justify-center overflow-hidden rounded-pill bg-snow"
    >
      {width > 0 && (
        <>
          <View className="flex-row items-center gap-x-[3px]" style={{ paddingHorizontal: PAD }}>
            {bars.map((level, i) => (
              <View key={i} className="w-[2px] rounded-pill bg-earth" style={{ height: 6 + Math.round(level * 32) }} />
            ))}
            {/* The playhead's slot. */}
            <View className="w-[2px]" />
            {Array.from({ length: ticks }, (_, i) => (
              <View key={`t${i}`} className="h-2 w-[2px] rounded-pill bg-tertiary" />
            ))}
          </View>
          <View className="absolute bottom-2 top-[3px] w-[2px] bg-earth" style={{ left: playhead }} />
          <View className="absolute top-[3px] h-[9px] w-[9px] rounded-pill bg-earth" style={{ left: playhead - 3.5 }} />
        </>
      )}
    </View>
  );
}

function RecorderButton({
  tone,
  icon,
  label,
  onPress,
  disabled,
}: {
  tone: 'light' | 'earth';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const light = tone === 'light';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${label} recording`}
      className={`h-6 w-[94px] flex-row items-center justify-center gap-x-1.5 rounded-pill ${
        light ? 'bg-snow/85' : 'bg-earth'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <Ionicons name={icon} size={light ? 12 : 10} color={light ? colors.midnight : colors.snow} />
      <Text className={`font-data text-[14px] ${light ? 'text-midnight' : 'text-snow'}`}>{label}</Text>
    </Pressable>
  );
}

export function RecorderPanel({
  meter,
  status,
  onPause,
  onResume,
  onStop,
  notes,
}: {
  meter: RecorderMeter;
  status: RecorderStatus;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  /** Quiet lines under the controls: caveats, and what the transcript is doing. */
  notes: string[];
}) {
  // Only this panel re-renders on each level tick, not the note around it.
  const { levels, elapsedMs } = useSyncExternalStore(meter.subscribe, meter.get);
  const paused = status === 'paused';
  const running = status === 'recording' || paused;

  return (
    <View className="px-7 pt-5">
      <Waveform levels={running ? levels : []} />
      <View className="mt-2.5 flex-row items-center">
        <Text
          className="flex-1 font-label text-[18px] text-snow"
          style={TABULAR}
          accessibilityLabel={`${paused ? 'Paused at' : 'Recorded'} ${spokenDuration(elapsedMs)}`}
        >
          {formatClock(running ? elapsedMs : 0)}
        </Text>
        <View className="flex-row gap-x-[13px]">
          <RecorderButton
            tone="light"
            icon={paused ? 'play' : 'pause'}
            label={paused ? 'Resume' : 'Pause'}
            onPress={paused ? onResume : onPause}
            disabled={!running}
          />
          <RecorderButton tone="earth" icon="stop" label="Stop" onPress={onStop} />
        </View>
      </View>
      {notes.map((note) => (
        <Text key={note} className="mt-2 font-data text-[12px] leading-[17px] text-quiet">
          {note}
        </Text>
      ))}
    </View>
  );
}
