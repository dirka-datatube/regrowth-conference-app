import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder route so links resolve while the screen is built (Figma 73:453).
export default function CustomerSupport() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-midnight">
      <Text className="font-data text-[20px] text-snow">Customer Support</Text>
    </SafeAreaView>
  );
}
