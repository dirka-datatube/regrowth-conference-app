import { Text, TextProps } from 'react-native';

type Variant = 'hero' | 'h1' | 'h2' | 'h3' | 'sub' | 'body' | 'small' | 'caption' | 'script';

// Light-first defaults. On moment (dark) screens pass text-moment-ink /
// text-moment-soft overrides via className.
const styles: Record<Variant, string> = {
  hero: 'font-heading text-ink text-hero',
  h1: 'font-heading text-ink text-h1',
  h2: 'font-heading text-ink text-h2',
  h3: 'font-heading text-ink text-h3',
  sub: 'font-sub text-ink-faint text-caption uppercase tracking-widest',
  body: 'font-body text-ink-soft text-body',
  small: 'font-sans text-ink-soft text-small',
  caption: 'font-sub text-ink-faint text-caption uppercase tracking-widest',
  script: 'font-script text-cta text-h1',
};

export function T({
  variant = 'body',
  className,
  ...rest
}: TextProps & { variant?: Variant }) {
  return <Text {...rest} className={`${styles[variant]} ${className ?? ''}`} />;
}
