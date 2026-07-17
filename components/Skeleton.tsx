import { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

// Lightweight shimmer used while queries load. Keep counts small — the
// cached shell usually renders instantly anyway.
export function Skeleton({ className, style }: { className?: string; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-surface-alt rounded-card ${className ?? ''}`}
      style={[{ opacity }, style]}
    />
  );
}

export function CardSkeleton() {
  return <Skeleton className="h-24 w-full mb-3" />;
}
