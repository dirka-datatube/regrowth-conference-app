import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PillButton } from '@/components/auth/PillButton';

/**
 * Welcome — Figma "Welcome Screen" (1:3).
 *
 * Built from the frame name and the auth language of Log in (25:260) and Sign
 * up (34:767); re-check against 1:3 when Figma reads are available. The two
 * ways in, and a line for people the website has already registered: their
 * tickets appear once they use the same email.
 */
export default function Welcome() {
  return (
    <AuthScreen
      hero
      title={
        <>
          REGROWTH
          {/* Raised on the web; native text keeps it on the baseline. */}
          <Text className="text-[12px] leading-[12px] tracking-normal" style={{ verticalAlign: 'top' }}>
            ®
          </Text>
        </>
      }
      subtitle="Your event companion for Navigate and the REGROWTH Study Tour"
      footer={
        <Text className="text-center font-data text-[11px] leading-[15px] text-quiet">
          Registered on our website? Use the same email and your tickets will be waiting for you.
        </Text>
      }
    >
      <View className="items-center gap-y-4">
        <PillButton label="Log in" onPress={() => router.push('/(auth)/login')} />
        <PillButton label="Create account" variant="outline" onPress={() => router.push('/(auth)/signup')} />
      </View>
    </AuthScreen>
  );
}
