import { useState } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { StarRating } from '@/components/profile/StarRating';
import { SelectChip } from '@/components/profile/SelectChip';
import { FormField } from '@/components/profile/FormField';
import { StatePanel } from '@/components/profile/StatePanel';
import { CtaButton } from '@/components/profile/CtaButton';
import { useFeedbackSubmit } from '@/lib/hooks/useFeedback';

/**
 * Rate App — Figma v2 (227:2617) and its thank-you state (227:2741). Built
 * from the frame names and v2 patterns; re-check against both nodes when Figma
 * reads are available.
 *
 * Five stars, what the attendee enjoyed, and an optional comment, sent to
 * `app_feedback` (kind 'rating'). This is feedback on the app, not session
 * polling. Demo mode keeps nothing.
 */

const ENJOYED = [
  'Event information',
  'Agenda & sessions',
  'Networking',
  'Insights & notes',
  'Alerts',
  'Tickets & QR',
  'Easy to use',
  'Look & feel',
];

const LABELS = ['Tap a star to rate', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export default function RateApp() {
  const [stars, setStars] = useState(0);
  const [enjoyed, setEnjoyed] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const { submit, isPending, isSuccess, error } = useFeedbackSubmit();

  const toggle = (item: string) =>
    setEnjoyed((current) => (current.includes(item) ? current.filter((i) => i !== item) : [...current, item]));

  if (isSuccess) {
    return (
      <SubScreen title="Rate App" subtitle="Help us make the app better">
        <Section>
          <StatePanel
            size="large"
            tone="success"
            icon="checkmark"
            title="Thanks for your feedback!"
            body="Your rating helps the REGROWTH team decide what to improve next."
          >
            <CtaButton label="Back to Profile" icon="person-outline" block onPress={() => router.navigate('/me')} />
          </StatePanel>
        </Section>
      </SubScreen>
    );
  }

  return (
    <SubScreen title="Rate App" subtitle="Help us make the app better">
      <Section>
        <View className="items-center gap-y-4 rounded-card border border-hairline bg-tile px-5 py-6">
          <View className="items-center gap-y-1">
            <Text accessibilityRole="header" className="text-center font-data text-[18px] font-bold text-snow">
              How are you finding the app?
            </Text>
            <Text className="text-center font-data text-[13px] text-quiet">
              Your rating goes straight to the REGROWTH team.
            </Text>
          </View>
          <StarRating value={stars} onChange={setStars} />
          <Text accessibilityLiveRegion="polite" className="font-label text-[13px] font-bold uppercase tracking-[1px] text-snow/70">
            {LABELS[stars]}
          </Text>
        </View>
      </Section>

      <Section className="gap-y-3">
        <SectionHeading title="What did you enjoy?" subtitle="Choose as many as you like." />
        <View className="flex-row flex-wrap gap-2">
          {ENJOYED.map((item) => (
            <SelectChip key={item} label={item} selected={enjoyed.includes(item)} onPress={() => toggle(item)} />
          ))}
        </View>
      </Section>

      <Section className="gap-y-4">
        <FormField
          label="Anything else?"
          optional
          value={comment}
          onChangeText={setComment}
          placeholder="Tell us what you’d improve, or what you’d like to see next."
          multiline
          maxLength={2000}
        />
        <CtaButton
          label={isPending ? 'Sending…' : 'Submit Rating'}
          icon="send-outline"
          block
          loading={isPending}
          disabled={stars === 0}
          onPress={() => submit({ kind: 'rating', rating: stars, tags: enjoyed, message: comment })}
        />
        {stars === 0 ? (
          <Text className="text-center font-data text-[12px] text-quiet">Choose a star rating to send.</Text>
        ) : error ? (
          <Text accessibilityLiveRegion="polite" className="text-center font-data text-[13px] text-alert-action">
            We couldn’t send your rating. Check your connection and try again.
          </Text>
        ) : null}
      </Section>
    </SubScreen>
  );
}
