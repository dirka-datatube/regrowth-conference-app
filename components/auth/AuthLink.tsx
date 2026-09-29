import { Pressable, Text } from 'react-native';

/**
 * A text action on the auth screens: "Forgot your password?", "New here?
 * Create an account". `lead` is the quiet question before the action; `action`
 * marks one that does something (sends an email) rather than goes somewhere.
 */
export function AuthLink({
  label,
  onPress,
  lead,
  action = false,
  underline = false,
  disabled = false,
  size = 12,
}: {
  label: string;
  onPress: () => void;
  lead?: string;
  action?: boolean;
  underline?: boolean;
  disabled?: boolean;
  size?: 11 | 12;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole={action ? 'button' : 'link'}
      accessibilityLabel={lead ? `${lead} ${label}` : label}
      accessibilityState={{ disabled }}
      className={disabled ? 'opacity-50' : ''}
    >
      <Text className={`text-center font-data text-snow ${size === 11 ? 'text-[11px] leading-[14px]' : 'text-[12px] leading-[16px]'}`}>
        {lead ? <Text className="text-quiet">{lead} </Text> : null}
        <Text className={underline ? 'underline' : ''}>{label}</Text>
      </Text>
    </Pressable>
  );
}
