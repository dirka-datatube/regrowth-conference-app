import { View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';

export default function CheckEmail() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  return (
    <Screen>
      <View className="pt-12">
        <T variant="script">Check your inbox</T>
        <T variant="h2" className="mt-4">We've sent a link to</T>
        <T variant="h3" className="mt-2 text-earth">{email ?? 'your email'}</T>
        <T variant="body" className="mt-6 text-cloud/80">
          Tap the link from your phone and the app will sign you in. The link
          expires in an hour, so we'd open it sooner rather than later.
        </T>
        <View className="mt-10">
          <Button
            label="Use a different email"
            variant="ghost"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </View>
    </Screen>
  );
}
