import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { PillButton } from '@/components/auth/PillButton';
import { AuthLink } from '@/components/auth/AuthLink';
import { FormMessage } from '@/components/auth/FormMessage';
import { resendConfirmation, sendMagicLink, sendPasswordReset, toAuthFlowError } from '@/lib/auth';
import { IS_DEMO } from '@/lib/demo';

/**
 * Check your email — after Sign up (`confirm`), the email sign-in link
 * (`link`) and Forgot your password (`reset`). No frame in the file; restyled
 * in the auth language of Log in (25:260).
 *
 * Resend waits out Supabase's one-email-a-minute limit instead of running into
 * it. The demo sends nothing, so it offers to open the link instead, which
 * walks the same path the email would.
 */

type Mode = 'confirm' | 'link' | 'reset';

const COPY: Record<Mode, { title: string; body: string; linkType: string }> = {
  confirm: {
    title: 'Confirm your email',
    body: 'Open the link in the email to confirm your account, and you’re in.',
    linkType: 'signup',
  },
  link: {
    title: 'Check your email',
    body: 'Open the link in the email on this device to sign in. It works once and expires in an hour.',
    linkType: 'magiclink',
  },
  reset: {
    title: 'Check your email',
    body: 'If there’s an account for this address, the email has a link to choose a new password.',
    linkType: 'recovery',
  },
};

const RESEND_AFTER = 60;

export default function CheckEmail() {
  const params = useLocalSearchParams<{ email?: string; mode?: string }>();
  const mode: Mode = params.mode === 'link' || params.mode === 'reset' ? params.mode : 'confirm';
  const email = params.email ?? '';
  const copy = COPY[mode];
  const [wait, setWait] = useState(RESEND_AFTER);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const tick = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(tick);
  }, [wait]);

  async function resend() {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'confirm') await resendConfirmation(email);
      else if (mode === 'link') await sendMagicLink(email);
      else await sendPasswordReset(email);
      setMessage({ text: 'Sent again. It can take a minute to arrive — check your spam folder too.', tone: 'info' });
      setWait(RESEND_AFTER);
    } catch (e) {
      setMessage({ text: toAuthFlowError(e).message, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  const back = mode === 'confirm' ? '/(auth)/signup' : mode === 'link' ? '/(auth)/login' : '/(auth)/forgot';

  return (
    <AuthScreen title={copy.title} subtitle={email ? `We’ve sent a link to ${email}` : 'We’ve sent you a link'}>
      <Text className="text-center font-data text-[13px] leading-[19px] text-lede">{copy.body}</Text>

      {message ? (
        <View className="mt-6">
          <FormMessage message={message.text} tone={message.tone} />
        </View>
      ) : null}

      <View className="mt-10 items-center gap-y-4">
        <PillButton
          label="Back to log in"
          onPress={() => router.replace({ pathname: '/(auth)/login', params: email ? { email } : {} })}
        />
        <PillButton
          variant="outline"
          label={wait > 0 ? `Resend in 0:${String(wait).padStart(2, '0')}` : 'Resend email'}
          onPress={resend}
          loading={busy}
          disabled={wait > 0 || !email}
        />
      </View>

      <View className="mt-6 items-center gap-y-3">
        <AuthLink
          lead="Wrong email?"
          label="Change it"
          underline
          onPress={() => (router.canGoBack() ? router.back() : router.replace(back))}
        />
        {IS_DEMO ? (
          <AuthLink
            action
            underline
            label="Open the link (demo)"
            onPress={() => router.replace({ pathname: '/auth-callback', params: { type: copy.linkType } })}
          />
        ) : null}
      </View>
    </AuthScreen>
  );
}
