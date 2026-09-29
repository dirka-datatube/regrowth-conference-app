import { Children, Fragment, ReactNode, isValidElement } from 'react';
import { View, Text, Pressable, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeading } from '@/components/SectionHeading';
import { colors } from '@/lib/theme';

/**
 * App Settings (220:2103 / 220:2409): titled groups of rows on the v2 tile
 * card, split by hairlines. A row carries a switch, a radio mark, a value or a
 * chevron.
 */

export function SettingsGroup({
  title,
  subtitle,
  footnote,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Small print under the card. */
  footnote?: string;
  children: ReactNode;
}) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View className="gap-y-3">
      <SectionHeading title={title} subtitle={subtitle} />
      <View className="overflow-hidden rounded-card border border-hairline bg-tile">
        {rows.map((row, i) => (
          <Fragment key={row.key ?? i}>
            {i > 0 && <View className="ml-4 h-px bg-hairline" />}
            {row}
          </Fragment>
        ))}
      </View>
      {!!footnote && <Text className="px-1 font-data text-[12px] leading-[17px] text-quiet">{footnote}</Text>}
    </View>
  );
}

export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  right,
  onPress,
  tone = 'default',
  disabled,
  accessibilityRole,
  accessibilityState,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  /** Right-hand text, e.g. the version. */
  value?: string;
  /** Right-hand control, e.g. a switch. */
  right?: ReactNode;
  /** Makes the row pressable, with a chevron unless `right` is given. */
  onPress?: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  accessibilityRole?: 'button' | 'radio' | 'link';
  accessibilityState?: { checked?: boolean; selected?: boolean; disabled?: boolean };
}) {
  const danger = tone === 'danger';
  const body = (
    <>
      {icon && (
        <View className="h-8 w-8 items-center justify-center rounded-pill bg-well">
          <Ionicons name={icon} size={17} color={danger ? colors.alertAction : colors.snow} />
        </View>
      )}
      <View className="flex-1 gap-y-0.5">
        <Text className={`font-data text-[14px] font-medium ${danger ? 'text-alert-action' : 'text-snow'}`}>{title}</Text>
        {!!subtitle && <Text className="font-data text-[12px] leading-[17px] text-quiet">{subtitle}</Text>}
      </View>
      {!!value && <Text className="font-data text-[13px] text-quiet">{value}</Text>}
      {right}
      {onPress && !right && !danger && <Ionicons name="chevron-forward" size={16} color={colors.quiet} />}
    </>
  );
  const box = `min-h-[56px] flex-row items-center gap-x-3 px-4 py-3 ${disabled ? 'opacity-50' : ''}`;

  if (!onPress) {
    return <View className={box}>{body}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityState={{ disabled: !!disabled, ...accessibilityState }}
      className={box}
    >
      {body}
    </Pressable>
  );
}

// react-native-web colours the thumb of a switched-on Switch from a web-only
// prop, and defaults it to teal (as on the Alerts tab).
const webThumb = (Platform.OS === 'web' ? { activeThumbColor: colors.snow } : {}) as object;

/** The Alerts tab's switch: system green on, grey off, white thumb. */
export function SettingsSwitch({
  value,
  onValueChange,
  label,
  disabled,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <Switch
      {...webThumb}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={label}
      trackColor={{ false: colors.switchOff, true: colors.switchOn }}
      thumbColor={colors.snow}
      ios_backgroundColor={colors.switchOff}
    />
  );
}

/** The selected mark on a radio row. */
export function RadioMark({ checked }: { checked: boolean }) {
  return (
    <Ionicons
      name={checked ? 'radio-button-on' : 'radio-button-off'}
      size={22}
      color={checked ? colors.accent : colors.quiet}
    />
  );
}
