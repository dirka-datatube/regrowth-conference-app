import { View, Pressable, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppStore } from '@/lib/store';
import { GlassPanel } from './Glass';

/**
 * Glass tab bar — the design's bottom navigation.
 *
 * Selected tab renders as a translucent blue pill carrying icon + label;
 * unselected tabs are icon-only. "Me" is the attendee's own avatar rather
 * than a glyph, which is how the Figma file distinguishes it.
 *
 * ICON SOURCES — these are Ionicons stand-ins. The Figma file exports its own
 * glyphs (Planner, Urgent Message, Light, Crowd) which could not be fetched
 * from this environment (the network policy blocks figma.com). See
 * assets/icons/README.md for the node-id → filename manifest; drop the real
 * PNG/SVGs in and swap ICONS below.
 */

const ICONS: Record<string, { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap }> = {
  index: { on: 'home', off: 'home-outline' },
  alerts: { on: 'mail', off: 'mail-outline' },
  events: { on: 'calendar', off: 'calendar-outline' },
  insights: { on: 'bulb', off: 'bulb-outline' },
  connect: { on: 'people', off: 'people-outline' },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const attendee = useAppStore((s) => s.attendee);

  return (
    <View className="absolute inset-x-0 bottom-0">
      <GlassPanel tone="raised" radius="rounded-nav" className="h-[92px] px-4 pt-4">
        <View className="flex-row items-center justify-between">
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = (options.title ?? route.name) as string;
            const focused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            const isMe = route.name === 'me';
            const icon = ICONS[route.name];

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                className={`h-8 flex-row items-center justify-center gap-x-1.5 rounded-pill ${
                  focused && !isMe ? 'bg-accent-soft px-3' : 'px-1.5'
                }`}
              >
                {isMe ? (
                  attendee?.photo_url ? (
                    <Image
                      source={{ uri: attendee.photo_url }}
                      className={`h-8 w-8 rounded-pill ${focused ? 'border-2 border-accent' : ''}`}
                      accessibilityIgnoresInvertColors
                    />
                  ) : (
                    <View
                      className={`h-8 w-8 items-center justify-center rounded-pill bg-glass ${
                        focused ? 'border-2 border-accent' : ''
                      }`}
                    >
                      <Ionicons name="person" size={16} color="#FFFFFF" />
                    </View>
                  )
                ) : (
                  <Ionicons
                    name={focused ? icon.on : icon.off}
                    size={22}
                    color={focused ? '#FFFFFF' : '#B9C0C9'}
                  />
                )}
                {focused && !isMe && <Text className="font-ui text-tab text-snow">{label}</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Home indicator */}
        <View className="mt-3 items-center">
          <View className="h-[5px] w-[135px] rounded-pill bg-indicator" />
        </View>
      </GlassPanel>
    </View>
  );
}
