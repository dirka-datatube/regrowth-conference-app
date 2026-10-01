import { ReactNode } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * Empty, error and thank-you states for the Profile screens, on the v2 tile
 * card: an icon disc, a title, a line of copy and the actions under it.
 *
 * `badge` adds a small teal disc to the icon, which lets two glyphs stand in
 * for an illustration (No Connections, 217:1330). ICONS — Ionicons stand-ins
 * for the comps' illustrations, which could not be exported.
 */
export function StatePanel({
  icon,
  badge,
  size = 'regular',
  tone = 'default',
  title,
  body,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  badge?: keyof typeof Ionicons.glyphMap;
  /** `large` for a screen's whole content (empty lists, thank-you states). */
  size?: 'regular' | 'large';
  /** `success` fills the disc teal — sent, saved, done. */
  tone?: 'default' | 'success';
  title: string;
  body?: string;
  /** Actions, stacked under the copy. */
  children?: ReactNode;
}) {
  const large = size === 'large';
  const success = tone === 'success';
  return (
    <View className={`items-center rounded-card border border-hairline bg-tile px-6 ${large ? 'gap-y-4 py-10' : 'gap-y-3 py-8'}`}>
      <View>
        <View
          className={`items-center justify-center rounded-pill border ${
            success ? 'border-teal-line bg-ocean' : 'border-card-line bg-well'
          } ${large ? 'h-[120px] w-[120px]' : 'h-16 w-16'}`}
        >
          <Ionicons name={icon} size={large ? 52 : 28} color={large || success ? colors.snow : colors.quiet} />
        </View>
        {badge && (
          <View
            className={`absolute items-center justify-center rounded-pill border-2 border-midnight bg-ocean ${
              large ? '-bottom-1 -right-1 h-11 w-11' : '-bottom-1 -right-1 h-7 w-7'
            }`}
          >
            <Ionicons name={badge} size={large ? 20 : 14} color={colors.snow} />
          </View>
        )}
      </View>
      <View className="items-center gap-y-1.5">
        <Text accessibilityRole="header" className={`text-center font-data font-bold text-snow ${large ? 'text-[20px]' : 'text-[16px]'}`}>
          {title}
        </Text>
        {!!body && <Text className="text-center font-data text-[13px] leading-[19px] text-quiet">{body}</Text>}
      </View>
      {children ? <View className="mt-1 items-center gap-y-3 self-stretch">{children}</View> : null}
    </View>
  );
}

/** Quiet loading line for a list that is still arriving. */
export function LoadingLine({ label }: { label: string }) {
  return (
    <View className="flex-row items-center justify-center gap-x-2 py-8" accessibilityLabel={label}>
      <ActivityIndicator size="small" color={colors.quiet} />
      <Text className="font-data text-[13px] text-quiet">{label}</Text>
    </View>
  );
}
