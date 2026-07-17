import { useState } from 'react';
import { View, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

// Corporate mail often strips magic links — the 6-digit code is the
// reliable fallback. (The Supabase email template must include {{ .Token }}.)
export default function CheckEmail() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  async function verifyCode() {
    if (!email || code.trim().length < 6) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: String(email).toLowerCase(),
        token: code.trim(),
        type: 'email',
      });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert("That code didn't match", e?.message ?? 'Check the latest email and try again.');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Screen>
      <View className="pt-12">
        <T variant="script">Check your inbox</T>
        <T variant="h2" className="mt-4">We've sent a link to</T>
        <T variant="h3" className="mt-2 text-cta-deep">{email ?? 'your email'}</T>
        <T variant="body" className="mt-4 text-ink-soft">
          Tap the link from your phone and you're in. Or enter the 6-digit
          code from the same email below.
        </T>

        <View className="mt-8">
          <T variant="caption" className="mb-2">6-digit code</T>
          <TextInput
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="••••••"
            placeholderTextColor="#8B8EA6"
            accessibilityLabel="Six digit sign-in code"
            className="bg-surface border border-line rounded-card px-4 py-4 text-ink font-sans text-h2 tracking-widest text-center"
          />
          <View className="mt-4">
            <Button
              label="Verify code"
              loading={verifying}
              disabled={code.trim().length < 6}
              onPress={verifyCode}
            />
          </View>
        </View>

        <View className="mt-8">
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
