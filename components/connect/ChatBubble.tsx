import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { timeLabel, type ActionHint, type ChatItem } from '@/lib/support';
import { colors } from '@/lib/theme';

/**
 * The assistant's "Chat Icon" (73:453) — an illustration in the comp; an
 * Ionicons glyph on a teal disc stands in.
 */
export function AssistantIcon({ size = 28 }: { size?: number }) {
  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center rounded-pill bg-ocean"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name="chatbubble-ellipses" size={Math.round(size * 0.5)} color={colors.snow} />
    </View>
  );
}

/** The map-pin row under an answer: opens the screen that holds the facts. */
function ActionRow({ action }: { action: ActionHint }) {
  return (
    <Pressable
      onPress={() => router.push(action.href as never)}
      accessibilityRole="link"
      accessibilityLabel={action.label}
      className="h-8 flex-row items-center gap-x-2 rounded-cta border border-teal-line bg-teal-wash px-2"
    >
      <Ionicons name={action.icon} size={16} color={colors.snow} />
      <Text className="flex-1 font-data text-[12px] font-semibold text-snow" numberOfLines={1}>
        {action.label}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={colors.snow} />
    </Pressable>
  );
}

/**
 * One message. Assistant and team on the left (the team with its own disc and
 * name), the attendee on the right in teal. Timestamps sit inside the bubble,
 * as in the comp.
 */
export function ChatBubble({ item }: { item: ChatItem }) {
  if (item.kind === 'user') {
    return (
      <View className="items-end">
        <View className="max-w-[240px] gap-y-1 rounded-card rounded-tr-[4px] bg-ocean px-3 py-2.5">
          <Text className="font-data text-[14px] leading-[20px] text-snow">{item.text}</Text>
          <Text className="text-right font-data text-[10px] text-snow/70">
            {item.pending ? 'Sending…' : timeLabel(item.at)}
          </Text>
        </View>
      </View>
    );
  }

  const staff = item.kind === 'staff';
  return (
    <View className="flex-row items-start gap-x-2.5">
      {staff ? (
        <View className="h-7 w-7 items-center justify-center rounded-pill bg-earth">
          <Text className="font-data text-[10px] font-bold text-snow">RG</Text>
        </View>
      ) : (
        <AssistantIcon />
      )}
      <View
        className={`max-w-[280px] shrink gap-y-2 rounded-card rounded-tl-[4px] border px-3 py-3 ${
          staff ? 'border-card-line bg-well' : 'border-tile-line bg-tile'
        }`}
      >
        {staff && <Text className="font-data text-[11px] font-bold text-earth">REGROWTH Team</Text>}
        <Text className="font-data text-[14px] leading-[20px] text-snow">{item.text}</Text>
        {item.kind === 'assistant' && item.action && <ActionRow action={item.action} />}
        <Text className="font-data text-[10px] text-quiet">{timeLabel(item.at)}</Text>
      </View>
    </View>
  );
}
