import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * "Talk to the team" (73:453 escalation-card): hands the chat to a person.
 * The avatar stack is team photos in the comp; people glyphs stand in.
 */
export type EscalationState = 'ready' | 'waiting' | 'with-team' | 'signed-out';

const COPY: Record<EscalationState, { title: string; sub: string; button?: string }> = {
  ready: { title: 'Talk to the team', sub: 'Hand this chat to a person on the REGROWTH event team.', button: 'Connect' },
  waiting: { title: 'The team has been asked', sub: 'A person will reply in this chat. Check back soon.' },
  'with-team': { title: 'You’re chatting with the team', sub: 'Replies from REGROWTH appear in this chat.' },
  'signed-out': { title: 'Talk to the team', sub: 'Sign in so the REGROWTH team can reply to you here.', button: 'Sign in' },
};

export function EscalationCard({ state, onPress }: { state: EscalationState; onPress: () => void }) {
  const copy = COPY[state];
  return (
    <View className="flex-row items-center gap-x-3 rounded-card border border-card-line bg-well px-4 py-3.5">
      <View className="h-7 w-12 flex-row">
        <View className="h-7 w-7 items-center justify-center rounded-pill border-2 border-midnight bg-ocean">
          <Ionicons name="person" size={13} color={colors.snow} />
        </View>
        <View className="-ml-2 h-7 w-7 items-center justify-center rounded-pill border-2 border-midnight bg-earth">
          <Ionicons name="person" size={13} color={colors.snow} />
        </View>
      </View>
      <View className="flex-1 gap-y-0.5">
        <Text className="font-data text-[14px] font-semibold text-snow">{copy.title}</Text>
        <Text className="font-data text-[11px] leading-[14px] text-quiet" numberOfLines={2}>
          {copy.sub}
        </Text>
      </View>
      {copy.button ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={state === 'ready' ? 'Connect with the REGROWTH team' : 'Sign in'}
          className="h-[26px] justify-center rounded-cta bg-ocean px-3"
        >
          <Text className="font-data text-[12px] font-semibold text-snow">{copy.button}</Text>
        </Pressable>
      ) : (
        <Ionicons name="checkmark-circle" size={22} color={colors.snow} />
      )}
    </View>
  );
}
