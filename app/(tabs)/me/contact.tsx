import { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { FormField } from '@/components/profile/FormField';
import { StatePanel } from '@/components/profile/StatePanel';
import { CtaButton } from '@/components/profile/CtaButton';
import { useFeedbackSubmit } from '@/lib/hooks/useFeedback';
import { displayName } from '@/lib/hooks/useProfile';
import { openSupport } from '@/lib/content';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';

/**
 * Contact — Figma v2 (227:2914). Built from the frame name and v2 patterns;
 * re-check against 227:2914 when Figma reads are available.
 *
 * Two ways to reach the team: the in-app chat (Customer Support, 73:453) for
 * anything quick, and a short form that lands in `app_feedback` (kind
 * 'contact') for the rest. No phone numbers or addresses until REGROWTH
 * supplies them.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function ContactForm({ defaults }: { defaults: { name: string; email: string } }) {
  const [name, setName] = useState(defaults.name);
  const [email, setEmail] = useState(defaults.email);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tried, setTried] = useState(false);
  const { submit, isPending, isSuccess, error } = useFeedbackSubmit();

  const problems = {
    email: !email.trim() ? 'Enter your email so we can reply' : EMAIL.test(email.trim()) ? null : 'Enter a valid email address',
    message: message.trim() ? null : 'Write a message',
  };

  function send() {
    setTried(true);
    if (problems.email || problems.message) return;
    submit({ kind: 'contact', name, email, subject, message });
  }

  if (isSuccess) {
    const first = name.trim().split(/\s+/)[0];
    return (
      <StatePanel
        size="large"
        tone="success"
        icon="checkmark"
        title="Message sent"
        body={`Thanks${first ? `, ${first}` : ''}. The REGROWTH team will reply to ${email.trim()}.`}
      >
        <CtaButton label="Back to Profile" icon="person-outline" block onPress={() => router.navigate('/me')} />
      </StatePanel>
    );
  }

  return (
    <View className="gap-y-4">
      <SectionHeading title="Send us a message" subtitle="For anything that needs more than a quick chat." />
      <FormField label="Name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" maxLength={200} />
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={320}
        error={tried ? problems.email : null}
        hint="We’ll reply here."
      />
      <FormField
        label="Subject"
        optional
        value={subject}
        onChangeText={setSubject}
        placeholder="What’s it about?"
        maxLength={200}
      />
      <FormField
        label="Message"
        value={message}
        onChangeText={setMessage}
        placeholder="How can we help?"
        multiline
        maxLength={5000}
        error={tried ? problems.message : null}
      />
      <CtaButton label={isPending ? 'Sending…' : 'Send Message'} icon="send-outline" block loading={isPending} onPress={send} />
      {!!error && (
        <Text accessibilityLiveRegion="polite" className="text-center font-data text-[13px] text-alert-action">
          We couldn’t send your message. Check your connection and try again.
        </Text>
      )}
    </View>
  );
}

export default function Contact() {
  const attendee = useAppStore((s) => s.attendee);
  const profile = useAppStore((s) => s.profile);
  const session = useAppStore((s) => s.session);
  const defaults = {
    name: displayName(profile, attendee),
    email: attendee?.email ?? profile?.email ?? session?.user.email ?? '',
  };

  return (
    <SubScreen title="Contact" subtitle="Get in touch with the REGROWTH team">
      <Section>
        <View className="gap-y-3 rounded-card border border-hairline bg-tile p-4">
          <View className="flex-row items-center gap-x-3">
            <View className="h-11 w-11 items-center justify-center rounded-pill bg-ocean">
              <Ionicons name="chatbubbles-outline" size={21} color={colors.snow} />
            </View>
            <View className="flex-1 gap-y-0.5">
              <Text className="font-data text-[15px] font-bold text-snow">Chat with us</Text>
              <Text className="font-data text-[12px] leading-[17px] text-quiet">
                Quick questions answered in the app, with the team on hand.
              </Text>
            </View>
          </View>
          <CtaButton label="Start a Chat" icon="chatbox-outline" block onPress={openSupport} />
        </View>
      </Section>

      <Section>
        {/* Keyed so the prefill arrives if the account loads after the screen. */}
        <ContactForm key={`${defaults.name}|${defaults.email}`} defaults={defaults} />
      </Section>
    </SubScreen>
  );
}
