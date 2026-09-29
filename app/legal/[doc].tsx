import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder route: the Terms and Privacy Policy, readable before sign-in
// (sign-up links here). Replaced by the Profile build.
export default function Legal() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-midnight">
      <Text className="font-data text-[20px] text-snow">Legal</Text>
    </SafeAreaView>
  );
}
