import { Platform, View } from 'react-native';

/**
 * Full-bleed backgrounds for the two photo screens — the Welcome screen's eDM
 * image (54:1935) and the Weather screen's sky (54:179).
 *
 * IMAGERY — both are photographs in the comp and could not be exported
 * (figma.com is network-blocked here), so brand-colour gradients stand in
 * until Sprint 12: midnight, ocean and earth for the welcome, the app's
 * accent blue for a day sky. CSS draws them on the web; native gets a flat
 * wash of the same hue, as GlassPanel drops its blur.
 */

type Tone = 'day' | 'night' | 'welcome';

// Stops are the brand palette (lib/theme.ts) as rgba: accent 83,157,243 ·
// ocean 17,103,109 · earth 209,127,93 · midnight 4,7,47.
const WEB: Record<Tone, string> = {
  day: 'linear-gradient(180deg, rgba(83,157,243,0.85) 0%, rgba(83,157,243,0.45) 38%, rgba(17,103,109,0.35) 62%, rgba(4,7,47,1) 92%)',
  night: 'linear-gradient(180deg, rgba(83,157,243,0.3) 0%, rgba(17,103,109,0.15) 40%, rgba(4,7,47,1) 80%)',
  welcome:
    'radial-gradient(circle at 88% 12%, rgba(209,127,93,0.55) 0%, rgba(209,127,93,0) 42%), linear-gradient(165deg, rgba(17,103,109,0.9) 0%, rgba(17,103,109,0.35) 45%, rgba(4,7,47,1) 85%)',
};

const NATIVE: Record<Tone, string> = {
  day: 'bg-accent/40',
  night: 'bg-accent/10',
  welcome: 'bg-ocean/40',
};

export function Backdrop({ tone }: { tone: Tone }) {
  if (Platform.OS === 'web') {
    return <View className="absolute inset-0" style={{ backgroundImage: WEB[tone] } as object} />;
  }
  return <View className={`absolute inset-0 ${NATIVE[tone]}`} />;
}
