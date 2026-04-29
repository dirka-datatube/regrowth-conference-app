import { View, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

// CommBank sponsor showcase. Final content + brand sign-off pending —
// see "Things to clarify" in the project brief. This page is a layout
// stub the admin panel can override via partner row + featured slot.
export default function CommBank() {
  return (
    <Screen>
      <View className="flex-row items-center pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </Pressable>
        <T variant="caption" className="ml-2">CommBank</T>
      </View>

      <View className="mt-4">
        <T variant="caption" className="text-earth normal-case tracking-normal">Banking partner</T>
        <T variant="h1" className="mt-2">CommBank × REGROWTH®</T>
        <T variant="body" className="mt-3 text-cloud/80">
          We've partnered with CommBank to bring the real estate industry tools
          built for how we work. Speak with the team on-site or learn more here.
        </T>
      </View>

      <Card className="mt-6">
        <T variant="sub">On-site at the conference</T>
        <T variant="body" className="mt-2 text-cloud/90">
          Find the CommBank lounge in the foyer for casual conversations, free coffee,
          and a chat with their real estate banking specialists.
        </T>
      </Card>

      <View className="mt-6">
        <Button
          label="Learn more"
          variant="primary"
          onPress={() => Linking.openURL('https://www.commbank.com.au')}
        />
      </View>
    </Screen>
  );
}
