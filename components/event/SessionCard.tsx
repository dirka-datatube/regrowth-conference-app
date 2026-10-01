import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import { SESSION_TYPE_LABEL, type GuideSession } from '@/lib/eventContent';
import { formatTime } from '@/lib/eventTime';
import { colors } from '@/lib/theme';
import type { SessionType } from '@/types/database';

/**
 * Agenda card (92:288 "Sample Agenda"): "09:00 AM • MAIN STAGE" and the type
 * tag, the title, the speaker chip, and the bookmark that saves the session to
 * the attendee's schedule.
 */

const TAG: Record<SessionType, { box: string; text: string }> = {
  keynote: { box: 'bg-earth', text: 'text-basalt' },
  panel: { box: 'bg-ocean', text: 'text-snow' },
  workshop: { box: 'bg-accent-soft', text: 'text-snow' },
  breakout: { box: 'bg-chip-idle', text: 'text-snow' },
  meal: { box: 'bg-chip-idle', text: 'text-snow' },
  social: { box: 'bg-chip-idle', text: 'text-snow' },
  admin: { box: 'bg-chip-idle', text: 'text-snow' },
};

export function TypeTag({ type }: { type: SessionType }) {
  const t = TAG[type] ?? TAG.breakout;
  return (
    <View className={`rounded-md px-2 py-1 ${t.box}`}>
      <Text className={`font-label text-[10px] font-bold tracking-[0.5px] ${t.text}`}>
        {SESSION_TYPE_LABEL[type] ?? type.toUpperCase()}
      </Text>
    </View>
  );
}

/** "Founder, Regrowth" — the chip's second line. */
function role(s: { title: string | null; company: string | null }) {
  return [s.title, s.company].filter(Boolean).join(', ');
}

export function SpeakerChip({ speakers }: { speakers: GuideSession['speakers'] }) {
  if (!speakers.length) return <View className="flex-1" />;
  if (speakers.length === 1) {
    const [s] = speakers;
    return (
      <View className="flex-1 flex-row items-center gap-x-2">
        <Avatar name={s.name} uri={s.headshot_url} size={24} />
        <View className="flex-1">
          <Text className="font-data text-[13px] font-semibold text-snow" numberOfLines={1}>
            {s.name}
          </Text>
          {!!role(s) && (
            <Text className="font-data text-[11px] text-quiet" numberOfLines={1}>
              {role(s)}
            </Text>
          )}
        </View>
      </View>
    );
  }
  return (
    <View className="flex-1 flex-row items-center gap-x-2">
      <View className="flex-row">
        {speakers.slice(0, 3).map((s, i) => (
          <View key={s.id} className={`rounded-pill border border-midnight ${i ? '-ml-2' : ''}`}>
            <Avatar name={s.name} uri={s.headshot_url} size={24} />
          </View>
        ))}
      </View>
      <View className="flex-1">
        <Text className="font-data text-[13px] font-semibold text-snow" numberOfLines={1}>
          {speakers.map((s) => s.name).join(', ')}
        </Text>
        <Text className="font-data text-[11px] text-quiet">{speakers.length} speakers</Text>
      </View>
    </View>
  );
}

export function SessionCard({
  session,
  timeZone,
  live,
  saved,
  onToggleSave,
  onPress,
}: {
  session: GuideSession;
  timeZone?: string;
  live?: boolean;
  saved?: boolean;
  /** Omitted when the attendee cannot save (not registered for the event). */
  onToggleSave?: () => void;
  onPress: () => void;
}) {
  const meta = [formatTime(session.start_at, timeZone), session.room?.toUpperCase()].filter(Boolean).join(' • ');
  return (
    // The bookmark is a sibling of the card's pressable, not a child: on the
    // web both render as <button>, and a button may not contain another.
    <View className="rounded-card border border-hairline bg-tile">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${session.title}, ${meta}`}
        className="gap-y-3 p-[18px]"
      >
        <View className="flex-row items-center justify-between gap-x-3">
          <View className="flex-1 flex-row items-center gap-x-2">
            {live && <View className="h-2 w-2 rounded-pill bg-switch-on" accessibilityLabel="Live now" />}
            <Text className="flex-1 font-data text-[12px] font-semibold tracking-[0.5px] text-quiet" numberOfLines={1}>
              {meta}
            </Text>
          </View>
          <TypeTag type={session.type} />
        </View>

        <Text className="font-data text-[18px] font-semibold leading-[23px] text-snow">{session.title}</Text>

        {(session.speakers.length > 0 || !!onToggleSave) && (
          <View className={`flex-row items-center ${onToggleSave ? 'min-h-[30px] pr-10' : ''}`}>
            <SpeakerChip speakers={session.speakers} />
          </View>
        )}
      </Pressable>

      {onToggleSave && (
        <Pressable
          onPress={onToggleSave}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${session.title} from your saved sessions` : `Save ${session.title}`}
          accessibilityState={{ selected: !!saved }}
          className="absolute bottom-[23px] right-[18px] h-5 w-5 items-center justify-center"
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? colors.accent : colors.snow} />
        </Pressable>
      )}
    </View>
  );
}
