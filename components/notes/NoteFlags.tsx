import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Note } from '@/types/database';
import { colors } from '@/lib/theme';

/**
 * Pin, Important and Reminder — the three states an Insights card shows
 * (heart, Important, Reminder; 80:1892), switched from the note itself.
 *
 * There is no date picker in the app yet, so a reminder is set for 9am
 * tomorrow and the line under the flags says exactly when.
 */

export type NoteFlagValues = Pick<Note, 'pinned' | 'important' | 'reminder_at'>;

function tomorrowMorning(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function formatReminder(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Flag({
  icon,
  label,
  on,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityLabel={label}
      aria-checked={on}
      className={`h-8 flex-row items-center gap-x-1.5 rounded-pill border px-3 ${
        on ? 'border-transparent bg-accent-soft' : 'border-card-line'
      }`}
    >
      <Ionicons name={icon} size={14} color={on ? colors.snow : colors.indicator} />
      <Text className="font-ui text-tab text-snow">{label}</Text>
    </Pressable>
  );
}

export function NoteFlags({
  value,
  onChange,
  error,
}: {
  value: NoteFlagValues;
  onChange: (patch: Partial<NoteFlagValues>) => void;
  error?: string | null;
}) {
  return (
    <View className="mt-4 gap-y-2">
      <View className="flex-row flex-wrap gap-2">
        <Flag
          icon={value.pinned ? 'heart' : 'heart-outline'}
          label="Pinned"
          on={value.pinned}
          onPress={() => onChange({ pinned: !value.pinned })}
        />
        <Flag
          icon="filter-outline"
          label="Important"
          on={value.important}
          onPress={() => onChange({ important: !value.important })}
        />
        <Flag
          icon="alarm-outline"
          label="Reminder"
          on={!!value.reminder_at}
          onPress={() => onChange({ reminder_at: value.reminder_at ? null : tomorrowMorning() })}
        />
      </View>
      {error ? (
        <Text className="font-data text-[12px] text-quiet">{error}</Text>
      ) : value.reminder_at ? (
        <Text className="font-data text-[12px] text-quiet">Reminder set for {formatReminder(value.reminder_at)}</Text>
      ) : null}
    </View>
  );
}
