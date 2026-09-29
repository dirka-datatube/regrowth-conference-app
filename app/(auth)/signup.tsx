import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder route so links resolve while the screen is built (Figma 34:767).
export default function SignUp() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-midnight">
      <Text className="font-data text-[20px] text-snow">Create your account</Text>
    </SafeAreaView>
  );
}
