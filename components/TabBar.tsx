import { View, Pressable, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { GlassPanel } from './Glass';

/**
 * Glass tab bar — the design's bottom navigation.
 *
 * Selected tab renders as a translucent blue pill carrying icon + label;
 * unselected tabs are icon-only. The last tab is the attendee's own avatar
 * rather than a glyph; v2 labels it "Profile" and puts the avatar inside the
 * pill when selected (Profile 34:1423).
 *
 * Geometry (every v2 frame): full width, 20px radius, active pill 10px from
 * the top, home indicator 70px from the top.
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
      <GlassPanel tone="raised" radius="rounded-nav" className="h-[87px] px-4 pt-2.5">
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
                className={`h-10 flex-row items-center justify-center gap-x-1.5 rounded-pill ${
                  focused ? 'bg-accent-soft px-3' : 'px-1'
                }`}
              >
                {isMe ? (
                  <Avatar uri={attendee?.photo_url} size={focused ? 28 : 32} />
                ) : (
                  <Ionicons
                    name={focused ? icon.on : icon.off}
                    size={24}
                    color={focused ? colors.snow : colors.indicator}
                  />
                )}
                {focused && <Text className="font-ui text-tab text-snow">{label}</Text>}
              </Pressable>
            );
          })}
        </View>

        {/* Home indicator */}
        <View className="mt-5 items-center">
          <View className="h-[5px] w-[135px] rounded-pill bg-indicator" />
        </View>
      </GlassPanel>
    </View>
  );
}

function Avatar({ uri, size }: { uri?: string | null; size: number }) {
  const box = { width: size, height: size };
  return uri ? (
    <Image source={{ uri }} style={box} className="rounded-pill" accessibilityIgnoresInvertColors />
  ) : (
    <View style={box} className="items-center justify-center rounded-pill bg-glass">
      <Ionicons name="person" size={size / 2} color={colors.snow} />
    </View>
  );
}
