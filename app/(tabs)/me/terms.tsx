import { Text } from 'react-native';
import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';

// Placeholder route so links resolve while the screen is built (Figma 227:2863).
export default function Terms() {
  return (
    <SubScreen title="Terms & Conditions">
      <Section>
        <Text className="font-data text-[13px] text-quiet">Being built.</Text>
      </Section>
    </SubScreen>
  );
}
