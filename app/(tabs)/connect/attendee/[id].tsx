import { View, Text, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { Avatar } from '@/components/Avatar';
import { MenuRow } from '@/components/MenuRow';
import { CtaButton } from '@/components/connect/CtaButton';
import { Pills } from '@/components/connect/Pills';
import { NoticeCard, Loading } from '@/components/connect/NoticeCard';
import { useAppStore } from '@/lib/store';
import {
  roleLine,
  useCommunityConnect,
  useCommunityConnections,
  useCommunityContact,
  useCommunityProfile,
} from '@/lib/hooks/useCommunity';
import { productFor } from '@/lib/events';
import { colors } from '@/lib/theme';

/**
 * Attendee profile, opened from a community. The comps have no frame for it,
 * so it is built in the v2 language (profile card 145:1505, menu rows
 * 145:1518); re-check when Figma reads are available.
 *
 * Connect adds a mutual connection straight away, as the pre-v2 profile did;
 * scanning their badge (/scan → /c/<token>) is the in-person route to the same
 * place. Contact details appear only once connected.
 */
export default function AttendeeProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const meId = useAppStore((s) => s.attendee?.id);
  const { profile: person, isLoading, isError, refetch } = useCommunityProfile(id);
  const connectedIds = useCommunityConnections();
  const connected = !!id && connectedIds.includes(id);
  const contact = useCommunityContact(id, connected);
  const connect = useCommunityConnect();

  const product = person ? productFor(person.event_id) : undefined;
  const isMe = !!person && person.id === meId;
  const firstName = person?.name.split(' ')[0] ?? '';
  const line = person ? roleLine(person) : '';

  return (
    <SubScreen
      title="Attendee Profile"
      subtitle={product ? `${product.short} Community` : 'Connect with fellow attendees'}
    >
      {isLoading ? (
        <Section>
          <Loading label="Loading profile…" />
        </Section>
      ) : isError ? (
        <Section>
          <NoticeCard
            icon="cloud-offline-outline"
            title="Couldn’t load this profile"
            body="Check your connection and try again."
            action={{ label: 'Try again', onPress: refetch }}
          />
        </Section>
      ) : !person ? (
        <Section>
          <NoticeCard
            icon="person-outline"
            title="This profile isn’t available"
            body="They may keep their profile private, or be registered for a different event."
            action={{ label: 'Back to Connect', onPress: () => router.navigate('/connect') }}
          />
        </Section>
      ) : (
        <>
          <Section>
            <View className="items-center gap-y-3 rounded-card border border-card-line bg-well px-5 pb-6 pt-7">
              <Avatar name={person.name} uri={person.photo_url} size={96} />
              <View className="items-center gap-y-1">
                <Text accessibilityRole="header" className="text-center font-data text-[22px] font-bold text-snow">
                  {person.name}
                </Text>
                {!!line && <Text className="text-center font-data text-[14px] text-lede">{line}</Text>}
              </View>
              <Pills items={person.interests ?? []} center />
            </View>
          </Section>

          <Section className="gap-y-2">
            {isMe ? (
              <CtaButton wide icon="create-outline" label="Edit your profile" onPress={() => router.push('/me/edit')} />
            ) : connected ? (
              <View className="h-12 flex-row items-center justify-center gap-x-2 rounded-cta border border-card-line">
                <Ionicons name="checkmark-circle" size={18} color={colors.snow} />
                <Text className="font-data text-[13px] font-semibold text-snow">You’re connected</Text>
              </View>
            ) : (
              <CtaButton
                wide
                icon="person-add-outline"
                label={`Connect with ${firstName}`}
                busy={connect.isPending}
                onPress={() => connect.mutate(person)}
              />
            )}
            {connect.isError && (
              <Text className="text-center font-data text-[12px] text-quiet">
                That didn’t work. Try again, or scan their badge when you meet.
              </Text>
            )}
          </Section>

          {!!person.bio && (
            <Section className="gap-y-3">
              <SectionHeading title="About" />
              <Text className="font-body text-[14px] leading-[21px] text-lede">{person.bio}</Text>
            </Section>
          )}

          {!isMe && (
            <Section className="gap-y-3">
              <SectionHeading title="Contact" subtitle={connected ? 'Shared because you’re connected' : undefined} />
              {connected ? (
                <>
                  {!!contact?.email && (
                    <MenuRow
                      icon="mail-outline"
                      title="Email"
                      subtitle={contact.email}
                      onPress={() => Linking.openURL(`mailto:${contact.email}`)}
                    />
                  )}
                  {!!contact?.linkedin_url && (
                    <MenuRow
                      icon="logo-linkedin"
                      title="LinkedIn"
                      subtitle="View their profile"
                      onPress={() => Linking.openURL(contact.linkedin_url!)}
                    />
                  )}
                </>
              ) : (
                <Text className="font-data text-[13px] text-quiet">
                  Connect to see {firstName}’s contact details.
                </Text>
              )}
            </Section>
          )}

          {!isMe && !connected && (
            <Section>
              <MenuRow
                icon="scan-outline"
                title="Meeting in person?"
                subtitle="Scan their badge to connect"
                onPress={() => router.push('/scan')}
              />
            </Section>
          )}
        </>
      )}
    </SubScreen>
  );
}
