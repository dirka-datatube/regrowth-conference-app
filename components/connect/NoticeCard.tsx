import { ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CtaButton } from './CtaButton';
import { colors } from '@/lib/theme';

/**
 * A centred state card — locked community, nothing found, coming soon. Same
 * shape as the "No active tickets" card on My Tickets (146:1906).
 */
export function NoticeCard({
  icon,
  title,
  body,
  action,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void };
  children?: ReactNode;
}) {
  return (
    <View className="items-center gap-y-3 rounded-card border border-card-line bg-well p-6">
      <View className="h-14 w-14 items-center justify-center rounded-pill border border-teal-line bg-teal-wash">
        <Ionicons name={icon} size={26} color={colors.snow} />
      </View>
      <Text className="text-center font-data text-[18px] font-bold text-snow">{title}</Text>
      {!!body && <Text className="text-center font-data text-[13px] leading-[19px] text-quiet">{body}</Text>}
      {children}
      {action && <CtaButton label={action.label} icon={action.icon} onPress={action.onPress} />}
    </View>
  );
}

/** Quiet loading line for lists. */
export function Loading({ label }: { label: string }) {
  return (
    <View className="flex-row items-center justify-center gap-x-2 py-6">
      <ActivityIndicator size="small" color={colors.quiet} />
      <Text className="font-data text-[13px] text-quiet">{label}</Text>
    </View>
  );
}
