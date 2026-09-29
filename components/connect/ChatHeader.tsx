import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AssistantIcon } from './ChatBubble';
import { colors } from '@/lib/theme';

/**
 * Customer Support header (73:453 ai-header): the assistant's icon, name and
 * status pill, and the close control. The status says "automated" because it
 * is — people answer through the escalation card.
 */
export function ChatHeader({ onClose }: { onClose: () => void }) {
  return (
    <View className="h-[60px] flex-row items-center gap-x-2 px-[17px]">
      <AssistantIcon size={35} />
      <View className="flex-1 gap-y-0.5">
        <Text accessibilityRole="header" className="font-data text-[14px] font-bold text-snow">
          REGROWTH Assistant
        </Text>
        <View className="flex-row items-center gap-x-1.5">
          <View className="h-1.5 w-1.5 rounded-pill bg-switch-on" />
          <Text className="font-data text-[11px] text-quiet">Online · Automated replies</Text>
        </View>
      </View>
      <Pressable
        onPress={onClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Close support chat"
        className="h-9 w-9 items-center justify-center rounded-pill border border-glass-line bg-glass"
      >
        <Ionicons name="close-circle-outline" size={20} color={colors.snow} />
      </Pressable>
    </View>
  );
}
