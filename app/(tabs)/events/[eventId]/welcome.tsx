import { Text } from 'react-native';
import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';

// Placeholder route so links resolve while the screen is built (Figma Navigate Welcome 34:1421 / Study Tour Welcome 34:1422).
export default function EventWelcome() {
  return (
    <SubScreen title="Welcome">
      <Section>
        <Text className="font-data text-[13px] text-quiet">Being built.</Text>
      </Section>
    </SubScreen>
  );
}
