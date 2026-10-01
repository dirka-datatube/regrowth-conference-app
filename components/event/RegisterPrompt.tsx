import { View, Text } from 'react-native';
import { ActionButton } from './ActionButton';
import { openSupport } from '@/lib/content';

/**
 * Where a registered attendee sees Save, Follow, notes and questions, someone
 * who is not registered for the event sees this instead: what registering
 * unlocks, and the way to ask about tickets.
 */
export function RegisterPrompt({ eventName, unlocks }: { eventName: string; unlocks: string }) {
  return (
    <View className="gap-y-3 rounded-card border border-hairline bg-tile p-4">
      <Text className="font-data text-[13px] leading-[18px] text-lede">
        Register for {eventName} to {unlocks}.
      </Text>
      <ActionButton label="Ask about tickets" icon="ticket-outline" tone="outline" onPress={openSupport} className="self-start" />
    </View>
  );
}
