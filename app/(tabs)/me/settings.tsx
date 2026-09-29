import { Text } from 'react-native';
import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';

// Placeholder route so links resolve while the screen is built (Figma 220:2103 / 220:2409).
export default function AppSettings() {
  return (
    <SubScreen title="App Settings">
      <Section>
        <Text className="font-data text-[13px] text-quiet">Being built.</Text>
      </Section>
    </SubScreen>
  );
}
