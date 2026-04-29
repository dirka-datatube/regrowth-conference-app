import { useState } from 'react';
import { TextInput, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { T } from '@/components/Type';
import { Button } from '@/components/Button';
import { sendMagicLink } from '@/lib/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email.includes('@')) {
      Alert.alert("Let's try that again", 'Please enter the email you registered with.');
      return;
    }
    try {
      setLoading(true);
      await sendMagicLink(email);
      router.replace({ pathname: '/(auth)/check-email', params: { email } });
    } catch (e: any) {
      Alert.alert('Hmm, that didn\'t go through', e?.message ?? 'Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View className="pt-8">
        <T variant="caption">Sign in</T>
        <T variant="h1" className="mt-3">Let's get you in</T>
        <T variant="body" className="mt-3 text-cloud/80">
          Use the email you registered with. We'll send you a link to tap.
        </T>

        <View className="mt-8">
          <T variant="caption" className="mb-2">Email</T>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@regrowth.au"
            placeholderTextColor="#8A8DA6"
            className="bg-snow/5 border border-snow/15 rounded-card px-4 py-4 text-snow font-body text-body"
          />
        </View>

        <View className="mt-6">
          <Button label="Send magic link" loading={loading} onPress={submit} />
        </View>
      </View>
    </Screen>
  );
}
