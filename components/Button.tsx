import { Pressable, View, ActivityIndicator, PressableProps } from 'react-native';
import { T } from './Type';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const bg: Record<Variant, string> = {
  primary: 'bg-earth',
  secondary: 'bg-ocean',
  ghost: 'bg-transparent border border-cloud/30',
  danger: 'bg-danger',
};

const fg: Record<Variant, string> = {
  primary: 'text-snow',
  secondary: 'text-snow',
  ghost: 'text-snow',
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
      className={`${bg[variant]} ${fullWidth ? 'w-full' : ''} rounded-pill py-4 px-6 items-center justify-center ${isDisabled ? 'opacity-50' : ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <View>
          <T variant="body" className={`${fg[variant]} font-sub uppercase tracking-widest text-small`}>
            {label}
          </T>
        </View>
      )}
    </Pressable>
  );
}
