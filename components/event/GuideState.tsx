import { ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * Empty and loading states for the event guide, on the v2 tile card — the
 * guide shows these wherever an event has not published that content yet.
 */
export function GuideEmpty({
  icon,
  title,
  body,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  /** An action under the copy. */
  children?: ReactNode;
}) {
  return (
    <View className="items-center gap-y-2 rounded-card border border-hairline bg-tile px-6 py-8">
      <Ionicons name={icon} size={28} color={colors.quiet} />
      <Text className="text-center font-data text-[16px] font-bold text-snow">{title}</Text>
      {!!body && <Text className="text-center font-data text-[13px] leading-[18px] text-quiet">{body}</Text>}
      {children ? <View className="mt-2">{children}</View> : null}
    </View>
  );
}

export function GuideLoading({ label }: { label: string }) {
  return (
    <View className="items-center gap-y-3 py-10" accessibilityLabel={label}>
      <ActivityIndicator color={colors.quiet} />
      <Text className="font-data text-[13px] text-quiet">{label}</Text>
    </View>
  );
}
