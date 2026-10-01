import { ReactNode } from 'react';
import { Pressable, View, Platform, ViewProps } from 'react-native';

/**
 * Glassmorphic surface — the core visual primitive of the event app design.
 *
 * Every card, panel and the tab bar in the Figma file is the same recipe:
 * a translucent fill over the midnight ground, a 2px 40%-white border, a
 * 2px backdrop blur, and a soft inner highlight along the top-left edge.
 *
 * `backdrop-filter` is web-only. We are PWA-first, so the blur lands in the
 * browser; on native it degrades to the flat translucent fill, which reads
 * correctly against the dark ground. If a native wrapper is added later,
 * swap the inner View for `expo-blur`'s BlurView — the API here won't change.
 */

type Tone = 'raised' | 'sunken';

const TONE: Record<Tone, string> = {
  raised: 'bg-glass',        // tab bar, floating panels
  sunken: 'bg-glass-sunken', // note cards — darker than the page ground
};

// The Figma inner shadow, expressed for each platform. RN doesn't support
// inset shadows, so native gets a hairline top highlight instead.
const innerHighlight = Platform.select({
  web: {
    boxShadow:
      'inset 2.146px 2px 9.24px 0px rgba(255,255,255,0.13), inset 1.217px 1.134px 4.62px 0px rgba(255,255,255,0.13)',
  },
  default: {},
}) as object;

export function GlassPanel({
  children,
  tone = 'sunken',
  radius = 'rounded-note',
  onPress,
  className,
  style,
  ...rest
}: {
  children?: ReactNode;
  tone?: Tone;
  radius?: string;
  onPress?: () => void;
  className?: string;
} & ViewProps) {
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={[innerHighlight, style]}
      className={`${TONE[tone]} ${radius} border-2 border-glass-line backdrop-blur-sm overflow-hidden ${className ?? ''}`}
      {...rest}
    >
      {children}
    </Wrap>
  );
}
