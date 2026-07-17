import { ReactNode } from 'react';
import { Pressable, View, ViewProps } from 'react-native';

// Light card on the warm canvas. variant="feature" is the Earth-tinted
// highlight card; variant="moment" is the dark hero card.
export function Card({
  children,
  onPress,
  variant = 'light',
  className,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: 'light' | 'feature' | 'moment';
  className?: string;
  accessibilityLabel?: string;
} & ViewProps) {
  const bg = {
    light: 'bg-surface border border-line',
    feature: 'bg-cta/10 border border-cta/30',
    moment: 'bg-moment',
  }[variant];

  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      className={`rounded-card p-5 ${bg} ${onPress ? 'active:opacity-90 active:scale-[0.995]' : ''} ${className ?? ''}`}
      style={{ shadowColor: '#04072F', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 }}
    >
      {children}
    </Wrap>
  );
}
