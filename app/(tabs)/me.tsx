import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TabScreen, Section } from '@/components/TabScreen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProfileSummaryCard } from '@/components/ProfileSummaryCard';
import { BadgeCard } from '@/components/BadgeCard';
import { MenuRow } from '@/components/MenuRow';
import { NeedHelp } from '@/components/NeedHelp';
import { InstallPrompt } from '@/components/InstallPrompt';
import { useAppStore } from '@/lib/store';
import { useRegistrations } from '@/lib/hooks/useRegistrations';
import { useProfileCounts } from '@/lib/hooks/useProfileCounts';
import { NAVIGATE, productFor } from '@/lib/events';
import { needsNativeApp, nativeAppLink } from '@/lib/capture';
import { signOut } from '@/lib/auth';
import { colors } from '@/lib/theme';

/**
 * Profile — Figma v2 (34:1423). The route stays `me`.
 *
 * Profile card, the entry badge for the attendee's first ticket, and the
 * seven-row menu. Rows whose screens are not built yet (Templates &
 * Resources — Sprint 11) stay in the list, dimmed. The comp moves capture into
 * the header: mic records a voice note, camera takes a photo note.
 *
 * Sign out has no place in the comp — it belongs to App Settings (220:2103),
 * built in Sprint 11 — so it sits quietly at the foot until then.
 */

function HeaderButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-[38px] w-[41px] items-center justify-center rounded-pill border border-glass-line bg-glass"
    >
      <Ionicons name={icon} size={20} color={colors.snow} />
    </Pressable>
  );
}

export default function Me() {
  const attendee = useAppStore((s) => s.attendee);
  const { tickets } = useRegistrations();
  const { data: counts } = useProfileCounts();

  const name = attendee?.name ?? 'Your profile';
  const primary = tickets[0];
  const primaryProduct = primary ? productFor(primary.eventId) : undefined;
  const eventLabel = primaryProduct?.short ?? 'Event';

  function capture(mode: 'voice' | 'photo') {
    // Recording needs the native app to survive a locked screen.
    if (mode === 'voice' && needsNativeApp()) {
      router.push(nativeAppLink() as never);
      return;
    }
    router.push(`/notes/new?capture=${mode}` as never);
  }

  const ticketLine =
    tickets.length === 0
      ? 'No active tickets'
      : tickets.length === 1
        ? `1 Active ${tickets[0].ticketTier ?? 'Ticket'}`
        : `${tickets.length} Active Tickets`;

  return (
    <TabScreen
      header={
        <ScreenHeader
          title="My Profile"
          subtitle="Welcome to REGROWTH"
          back={false}
          right={
            <>
              <HeaderButton icon="mic-outline" label="Record a voice note" onPress={() => capture('voice')} />
              <HeaderButton icon="camera-outline" label="Take a photo note" onPress={() => capture('photo')} />
            </>
          }
        />
      }
    >
      <Section>
        <ProfileSummaryCard
          name={name}
          line={[attendee?.role, attendee?.company].filter(Boolean).join(' | ')}
          photoUrl={attendee?.photo_url}
          chip={primaryProduct ? `${primaryProduct.short.toUpperCase()} ATTENDEE` : null}
          onPress={() => router.push('/profile')}
        />
      </Section>

      <Section className="px-[30px]">
        {primary ? (
          <BadgeCard name={name} eventLabel={eventLabel} tier={primary.ticketTier} qrToken={primary.qrToken} />
        ) : (
          <View className="items-center gap-y-3 rounded-badge bg-cloud px-6 py-6">
            <Text className="text-center font-data text-[18px] font-bold text-midnight">No active tickets</Text>
            <Text className="text-center font-label text-[13px] text-midnight/60">
              {NAVIGATE.short} registrations are now open. Your entry badge appears here once you are
              registered.
            </Text>
            <Pressable
              onPress={() => router.navigate('/events')}
              accessibilityRole="button"
              className="h-[52px] w-full items-center justify-center rounded-tile bg-midnight"
            >
              <Text className="font-label text-[14px] font-bold text-snow">View Events</Text>
            </Pressable>
          </View>
        )}
      </Section>

      <Section className="gap-y-3">
        <MenuRow icon="ticket-outline" title="My Tickets" subtitle={ticketLine} onPress={() => router.push('/tickets')} />
        <MenuRow
          icon="bookmark-outline"
          title="Saved Sessions"
          subtitle={counts ? `${counts.savedSessions} Scheduled Events` : 'Your planned sessions'}
          onPress={() => router.push('/agenda')}
        />
        <MenuRow
          icon="people-outline"
          title="Networking Connections"
          subtitle={counts ? `${counts.connections} Connections` : 'Everyone you have met'}
          onPress={() => router.push('/connections')}
        />
        <MenuRow
          icon="folder-open-outline"
          title="Templates & Resources"
          subtitle="Tools & resources to support your growth"
        />
        <MenuRow
          icon="briefcase-outline"
          title="REGROWTH Services"
          subtitle="Discover how we can support your business"
          onPress={() => router.push('/solutions')}
        />
        <MenuRow
          icon="business-outline"
          title="REGROWTH Partners"
          subtitle="Explore our trusted partners"
          onPress={() => router.push('/partners')}
        />
        <MenuRow
          icon="settings-outline"
          title="App Settings"
          subtitle="Notifications, Privacy & Sync"
          onPress={() => router.push('/profile')}
        />
        <InstallPrompt />
      </Section>

      <Section>
        <NeedHelp />
      </Section>

      <Section className="items-center">
        <Pressable onPress={() => signOut()} accessibilityRole="button" hitSlop={10} className="px-4 py-2">
          <Text className="font-data text-[13px] text-quiet">Sign out</Text>
        </Pressable>
      </Section>
    </TabScreen>
  );
}
