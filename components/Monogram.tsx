import { View } from 'react-native';
import { Text } from 'react-native';

// The circled RG monogram from the brand collateral, drawn with primitives
// until licensed vector assets land. Used as avatar/logo placeholder and
// loading identity.
export function Monogram({
  size = 48,
  moment = false,
}: {
  size?: number;
  moment?: boolean;
}) {
  const border = moment ? '#FFFFFF' : '#04072F';
  const ink = moment ? '#FFFFFF' : '#04072F';
  return (
    <View
      accessibilityElementsHidden
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(1.5, size / 32),
        borderColor: border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: 'Georgia',
          color: ink,
          fontSize: size * 0.38,
          letterSpacing: 1,
        }}
      >
        RG
      </Text>
    </View>
  );
}
