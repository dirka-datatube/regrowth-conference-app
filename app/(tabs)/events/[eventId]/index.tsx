import { Text } from 'react-native';
import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';

// Placeholder route so links resolve while the screen is built (Figma Navigate Home 146:2498 / Study Tour Home 211:872).
export default function EventHome() {
  return (
    <SubScreen title="Event">
      <Section>
        <Text className="font-data text-[13px] text-quiet">Being built.</Text>
      </Section>
    </SubScreen>
  );
}
