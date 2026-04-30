import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';

export default function Welcome() {
  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-between py-12">
        <View>
          <T variant="caption">REGROWTH®</T>
          <T variant="hero" className="mt-3">
            Welcome,
          </T>
          <T variant="script" className="mt-1">
            we're glad you're here.
          </T>
          <T variant="body" className="mt-6 text-cloud/80">
            Your personal companion for the REGROWTH Annual Conference. Your
            schedule, your people, your moments — all in one place.
          </T>
        </View>

        <View>
          <Button label="Sign in with email" onPress={() => router.push('/(auth)/login')} />
          <T variant="caption" className="text-center mt-4">
            We'll send a magic link — no passwords, ever.
          </T>
        </View>
      </View>
    </Screen>
  );
}
