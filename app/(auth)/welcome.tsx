import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';
import { Monogram } from '@/components/Monogram';

// Moment screen — the one place the dramatic Midnight look leads.
export default function Welcome() {
  return (
    <Screen scroll={false} variant="moment">
      <View className="flex-1 justify-between py-12">
        <View className="items-center pt-10">
          <Monogram size={72} moment />
          <T variant="caption" className="text-moment-soft mt-6">REGROWTH®</T>
        </View>

        <View>
          <T variant="hero" className="text-moment-ink">
            Welcome,
          </T>
          <T variant="script" className="mt-1">
            we're glad you're here.
          </T>
          <T variant="body" className="mt-6 text-moment-soft">
            Your personal companion for the REGROWTH Annual Conference. Your
            schedule, your people, your moments — all in one place.
          </T>
        </View>

        <View>
          <Button label="Sign in with email" onPress={() => router.push('/(auth)/login')} />
          <T variant="caption" className="text-center mt-4 text-moment-soft">
            We'll send a magic link — no passwords, ever.
          </T>
        </View>
      </View>
    </Screen>
  );
}
