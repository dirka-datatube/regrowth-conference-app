import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

export type NoticeAction = { label: string; onPress: () => void };

/** A quiet line of context under the note's title — why capture paused, what a control needs. */
export function Notice({ text, action, onDismiss }: { text: string; action?: NoticeAction; onDismiss?: () => void }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="mt-4 flex-row items-start gap-x-2.5 rounded-tile border border-hairline bg-tile px-3.5 py-3"
    >
      <Ionicons name="information-circle-outline" size={16} color={colors.quiet} />
      <View className="flex-1 gap-y-1.5">
        <Text className="font-data text-[12px] leading-[17px] text-lede">{text}</Text>
        {action && (
          <Pressable onPress={action.onPress} accessibilityRole="link" hitSlop={8} className="self-start">
            <Text className="font-data text-[12px] font-semibold text-accent">{action.label}</Text>
          </Pressable>
        )}
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dismiss">
          <Ionicons name="close" size={16} color={colors.quiet} />
        </Pressable>
      )}
    </View>
  );
}

/**
 * Notes belong to an attendee, so writing one needs a registration. The
 * editor still works — a thought is not lost for want of one — but nothing is
 * saved, and this says so.
 */
export function RegistrationNotice({ signedIn, eventName }: { signedIn: boolean; eventName: string }) {
  return (
    <View className="mt-4 gap-y-3 rounded-card border border-hairline bg-tile p-4">
      <View className="flex-row items-center gap-x-2.5">
        <Ionicons name="lock-closed-outline" size={18} color={colors.snow} />
        <Text className="flex-1 font-data text-[15px] font-bold text-snow">Notes unlock with registration</Text>
      </View>
      <Text className="font-data text-[13px] leading-[18px] text-quiet">
        {signedIn
          ? `Register for ${eventName} to keep notes, recordings and AI summaries here. Anything written now is not saved.`
          : 'Sign in with the account you registered with to keep notes, recordings and AI summaries here. Anything written now is not saved.'}
      </Text>
      <Pressable
        onPress={() => router.push((signedIn ? '/events' : '/(auth)/welcome') as never)}
        accessibilityRole="button"
        className="self-start rounded-cta bg-ocean px-4 py-2.5"
      >
        <Text className="font-data text-[13px] font-semibold text-snow">{signedIn ? 'View Events' : 'Sign In'}</Text>
      </Pressable>
    </View>
  );
}
