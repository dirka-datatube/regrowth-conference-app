import { Text, TextProps } from 'react-native';

type Variant = 'hero' | 'h1' | 'h2' | 'h3' | 'sub' | 'body' | 'small' | 'caption' | 'script';

const styles: Record<Variant, string> = {
  hero: 'font-heading text-snow text-hero',
  h1: 'font-heading text-snow text-h1',
  h2: 'font-heading text-snow text-h2',
  h3: 'font-heading text-snow text-h3',
  sub: 'font-sub text-cloud text-small uppercase tracking-widest',
  body: 'font-body text-snow text-body',
  small: 'font-sans text-cloud text-small',
  caption: 'font-sub text-muted text-caption uppercase tracking-widest',
  script: 'font-script text-earth text-h1',
};

export function T({
  variant = 'body',
  className,
  ...rest
}: TextProps & { variant?: Variant }) {
  return <Text {...rest} className={`${styles[variant]} ${className ?? ''}`} />;
}
