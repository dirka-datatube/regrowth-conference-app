import { View, Text, Image } from 'react-native';
import { initials } from '@/components/Avatar';

/**
 * A partner's logo on the cloud tile the comps use for brand marks, or their
 * initials until the admin panel has a logo — the stand-in for the comp's
 * logo artwork, which is a Sprint 12 export.
 */
export function PartnerLogo({ name, uri, size = 56 }: { name: string; uri?: string | null; size?: number }) {
  const box = { width: size, height: size };
  return (
    <View style={box} className="items-center justify-center overflow-hidden rounded-tile bg-cloud" accessibilityLabel={`${name} logo`}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size * 0.8, height: size * 0.8 }} resizeMode="contain" accessibilityIgnoresInvertColors />
      ) : (
        <Text style={{ fontSize: Math.round(size * 0.32) }} className="font-data font-bold text-midnight">
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
