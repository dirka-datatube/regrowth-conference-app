import { ReactNode } from 'react';
import { Pressable, View, ViewProps } from 'react-native';

export function Card({
  children,
  onPress,
  variant = 'dark',
  className,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'dark' | 'light' | 'earth';
  className?: string;
} & ViewProps) {
  const bg = {
    dark: 'bg-snow/5 border border-snow/10',
    light: 'bg-cloud',
    earth: 'bg-earth/20 border border-earth/40',
  }[variant];

  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap onPress={onPress} className={`rounded-card p-5 ${bg} ${className ?? ''}`}>
      {children}
    </Wrap>
  );
}
