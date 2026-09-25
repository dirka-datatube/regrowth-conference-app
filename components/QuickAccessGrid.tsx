import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * Quick access — three-up tiles (Home 132:687). The Navigate event home uses
 * the same grid for Agenda, Speakers, Venue Map and the rest (Sprint 10).
 *
 * A tile without an href is a destination that is not built yet. It stays in
 * place, dimmed, so the grid keeps the comp's shape without a dead tap.
 *
 * ICONS — Ionicons stand-ins for the comp's illustrated glyphs (Urgent
 * Message, Planner, Light, Crowd, Person, Rain Cloud); see TabBar.tsx.
 */

export type QuickAccessItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: string;
};

export function QuickAccessGrid({ items }: { items: QuickAccessItem[] }) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {items.map((item) => (
        <Pressable
          key={item.label}
          disabled={!item.href}
          onPress={() => item.href && router.navigate(item.href as never)}
          accessibilityRole="button"
          accessibilityLabel={item.href ? item.label : `${item.label} — coming soon`}
          accessibilityState={{ disabled: !item.href }}
          className={`h-[85px] basis-[30%] grow items-center justify-center gap-y-2 rounded-tile border border-tile-line bg-tile backdrop-blur ${
            item.href ? '' : 'opacity-50'
          }`}
        >
          <View className="h-9 w-9 items-center justify-center rounded-pill bg-tile">
            <Ionicons name={item.icon} size={20} color={colors.snow} />
          </View>
          <Text className="text-center font-data text-[11px] font-semibold text-snow">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
