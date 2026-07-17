import { Pressable, ActivityIndicator, PressableProps, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const bg: Record<Variant, string> = {
  primary: 'bg-cta',
  secondary: 'bg-accent',
  ghost: 'bg-transparent border border-line',
  danger: 'bg-danger',
};

const fg: Record<Variant, string> = {
  primary: 'text-snow',
  secondary: 'text-snow',
  ghost: 'text-ink',
  danger: 'text-snow',
};

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  onPress,
  fullWidth = true,
  ...rest
}: {
  label: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
} & PressableProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      className={`${bg[variant]} ${fullWidth ? 'w-full' : ''} rounded-pill py-4 px-6 items-center justify-center ${isDisabled ? 'opacity-50' : 'active:opacity-80 active:scale-[0.99]'}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#04072F' : '#FFFFFF'} />
      ) : (
        <Text className={`${fg[variant]} font-sub uppercase tracking-widest text-small`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
