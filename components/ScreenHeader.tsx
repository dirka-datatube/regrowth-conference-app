import { ReactNode } from 'react';
import { View, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Screen header — title + one-line purpose, over a full-bleed rule.
 * Shared by Insights and Events in the Figma file; the back chevron is
 * omitted on tab roots that have nothing to pop back to. `right` holds the
 * v2 header controls — the Alerts switch, Profile's mic and camera.
 */
export function ScreenHeader({
  title,
  subtitle,
  back = true,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  return (
    <View className="border-b border-snow/15 pb-4">
      <View className="flex-row items-start">
        {back && (
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityLabel="Go back"
            className="pr-4 pt-1"
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
        )}
        <View className="flex-1">
          <Text className="font-data text-screen-title text-snow">{title}</Text>
          {subtitle && (
            <Text className="mt-1.5 font-body text-screen-sub text-snow/90">{subtitle}</Text>
          )}
        </View>
        {right && <View className="ml-3 flex-row items-center gap-x-2">{right}</View>}
      </View>
    </View>
  );
}
