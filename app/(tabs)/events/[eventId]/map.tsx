import { Text } from 'react-native';
import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';

// Placeholder route so links resolve while the screen is built (Figma 92:290 / 211:1341).
export default function VenueMap() {
  return (
    <SubScreen title="Venue Map">
      <Section>
        <Text className="font-data text-[13px] text-quiet">Being built.</Text>
      </Section>
    </SubScreen>
  );
}
