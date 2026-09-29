import { View, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { ServiceCard, type Service } from '@/components/profile/ServiceCard';
import { CtaButton } from '@/components/profile/CtaButton';
import { openSupport } from '@/lib/content';
import { env } from '@/lib/env';
import { IS_DEMO } from '@/lib/demo';
import { demoServicesTestimonial } from '@/lib/demo-profile';
import { learningGradient, colors } from '@/lib/theme';

/**
 * REGROWTH Services — Figma v2 (217:1795). Built from the frame name, the
 * Profile menu copy and v2 patterns; re-check against 217:1795 when Figma reads
 * are available.
 *
 * An introduction, REGROWTH's five service lines — the programs Continue
 * Learning points to — a testimonial and a closing call to action. Every
 * Enquire opens the support chat with the question already written. Replaces
 * the pre-v2 partner-solutions list; partners have their own screen.
 *
 * The testimonial is demo-only until REGROWTH supplies a real one: a quote is
 * a claim about a real client.
 */

const SERVICES: Service[] = [
  {
    key: 'coaching',
    icon: 'people-circle-outline',
    title: 'Coaching',
    tagline: 'One-on-one and team coaching',
    body: 'Regular sessions with a REGROWTH coach to set clear goals, sharpen your systems and stay accountable to the numbers that matter.',
    includes: ['Individual and team programs', 'Goal setting and business planning', 'A regular rhythm of check-ins'],
  },
  {
    key: 'workshops',
    icon: 'easel-outline',
    title: 'Workshops',
    tagline: 'Hands-on sessions for your team',
    body: 'Practical, interactive workshops on prospecting, listing, negotiation and leadership — run in your office or as open sessions.',
    includes: ['In-office or open sessions', 'Built around real scenarios', 'Tools your team can use the next day'],
  },
  {
    key: 'online',
    icon: 'laptop-outline',
    title: 'Online Training',
    tagline: 'Learn at your own pace',
    body: 'On-demand courses your team can work through anywhere, at the pace that suits them, with templates to put each lesson to work.',
    includes: ['Watch anywhere, any time', 'Courses for every stage of a career', 'Templates and worksheets alongside'],
  },
  {
    key: 'leadership',
    icon: 'ribbon-outline',
    title: 'Leadership Development',
    tagline: 'For principals and team leaders',
    body: 'Programs for leaders building high-performing teams: recruiting well, leading culture and growing a business that runs without you.',
    includes: ['Recruitment and retention', 'Culture and team performance', 'Business growth strategy'],
  },
  {
    key: 'events',
    icon: 'airplane-outline',
    title: 'Events & Study Tours',
    tagline: 'Navigate and the REGROWTH Study Tour',
    body: 'Our annual Navigate conference and the REGROWTH Study Tour bring the industry together to learn, connect and see great businesses up close.',
    includes: ['Navigate — REGROWTH’s annual conference', 'Study Tour — a bespoke, world-class experience', 'Time with peers from across the industry'],
  },
];

const gradient = Platform.select({
  web: { backgroundImage: learningGradient.web },
  default: { backgroundColor: learningGradient.native },
}) as object;

/** Opens the support chat with the question written; an external support link wins when set. */
function enquire(topic: string) {
  if (env.supportUrl) {
    openSupport();
    return;
  }
  router.push({ pathname: '/support', params: { draft: `Hi REGROWTH team, I’d like to know more about ${topic}.` } });
}

export default function Services() {
  const testimonial = IS_DEMO ? demoServicesTestimonial : null;

  return (
    <SubScreen title="REGROWTH Services" subtitle="Discover how we can support your business">
      <Section>
        <View style={gradient} className="gap-y-2 rounded-card border border-hairline p-5">
          <Text className="font-data text-[20px] font-bold text-snow">Grow with REGROWTH</Text>
          <Text className="font-body text-[14px] leading-[21px] text-lede">
            REGROWTH partners with real estate agents, leaders and business owners to build stronger businesses —
            through coaching, training, leadership programs and the events that bring the industry together.
          </Text>
        </View>
      </Section>

      <Section className="gap-y-3">
        <SectionHeading title="Our Services" subtitle="Programs for agents, leaders and teams" />
        {SERVICES.map((s) => (
          <ServiceCard
            key={s.key}
            service={s}
            onEnquire={() => enquire(s.title)}
            secondary={s.key === 'events' ? { label: 'View Events', onPress: () => router.navigate('/events') } : undefined}
          />
        ))}
      </Section>

      {testimonial && (
        <Section>
          <View className="gap-y-3 rounded-card border border-hairline bg-well p-5">
            <Ionicons name="chatbox-ellipses-outline" size={26} color={colors.earth} />
            <Text className="font-body text-[16px] italic leading-[24px] text-snow">“{testimonial.quote}”</Text>
            <View>
              <Text className="font-data text-[14px] font-bold text-snow">{testimonial.name}</Text>
              <Text className="font-data text-[12px] text-quiet">{testimonial.role}</Text>
            </View>
          </View>
        </Section>
      )}

      <Section>
        <View style={gradient} className="items-start gap-y-3 rounded-card border border-hairline p-5">
          <Text className="font-data text-[18px] font-bold text-snow">Not sure where to start?</Text>
          <Text className="font-data text-[14px] font-medium leading-[20px] text-lede">
            Tell us about your business and where you want to take it, and we’ll point you to the right program.
          </Text>
          <CtaButton label="Talk to Our Team" icon="chatbubbles-outline" onPress={() => enquire('working with REGROWTH')} />
        </View>
      </Section>
    </SubScreen>
  );
}
