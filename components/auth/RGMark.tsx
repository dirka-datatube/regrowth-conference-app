import { View, Text } from 'react-native';

/**
 * The circular "RG" monogram at the top of Welcome, Log in (25:260) and
 * Sign up (34:767) — a white ring around an R with a G overlapping it
 * down-right.
 *
 * Drawn with Views and Text: the logo artwork could not be exported (the
 * network policy blocks figma.com). The comp sets both letters in a condensed
 * high-contrast serif about half the ring's height; the stand-in condenses the
 * body serif (Butler, Georgia until it is licensed) to the same proportions.
 * Sizes and offsets are fractions of the ring, fitted to the comp at 84px.
 */

const LETTERS = [
  { char: 'R', size: 0.767, scaleX: 0.589, left: 0.239, top: 0.055 },
  { char: 'G', size: 0.726, scaleX: 0.97, left: 0.261, top: 0.178 },
] as const;

export function RGMark({ size = 84 }: { size?: number }) {
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="REGROWTH"
      style={{ width: size, height: size }}
    >
      <View className="absolute inset-0 rounded-pill border-snow" style={{ borderWidth: size * 0.03 }} />
      {LETTERS.map((l) => (
        <Text
          key={l.char}
          allowFontScaling={false}
          className="absolute font-body text-snow"
          style={{
            left: size * l.left,
            top: size * l.top,
            fontSize: size * l.size,
            lineHeight: size * l.size,
            transform: [{ scaleX: l.scaleX }],
            transformOrigin: 'left top',
          }}
        >
          {l.char}
        </Text>
      ))}
    </View>
  );
}
