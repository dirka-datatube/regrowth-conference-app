import { useEffect, useReducer, useState } from 'react';
import { router } from 'expo-router';
import { useIsFetching } from '@tanstack/react-query';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { AlertDialog } from '@/components/AlertCard';
import { SettingsGroup, SettingsRow, SettingsSwitch, RadioMark } from '@/components/profile/SettingsList';
import { syncedAgo } from '@/components/profile/format';
import {
  useSettingsClearCache,
  useSettingsLastSynced,
  useSettingsSignOut,
  useSettingsUpdate,
} from '@/lib/hooks/useSettings';
import { useAppStore } from '@/lib/store';
import type { AttendeeVisibility, NotificationCategory } from '@/types/database';

/**
 * App Settings — Figma v2 (220:2103, and 220:2409, read here as the same
 * screen with notifications off). Built from the frame names, the Profile menu
 * copy ("Notifications, Privacy & Sync") and v2 patterns; re-check against both
 * nodes when Figma reads are available.
 *
 * Notifications: the master switch is the Alerts tab's (`notification_prefs.
 * enabled`), and the categories are the ones the push sender honours
 * (supabase/functions/_shared/eligibility.ts). Privacy: who can see the
 * profile (`attendees.visibility`, which RLS enforces). Data & Sync, Account
 * and About follow.
 */

const CATEGORIES: { key: NotificationCategory; label: string; description: string }[] = [
  { key: 'session_starting', label: 'Sessions starting', description: 'When something on your schedule is 15 minutes away.' },
  { key: 'dont_miss', label: 'Don’t miss this', description: 'When sessions run at the same time and you haven’t picked one.' },
  { key: 'people_to_meet', label: 'People to meet', description: 'A daily nudge about someone we think you’d enjoy meeting.' },
  { key: 'partner_spotlight', label: 'Partner spotlight', description: 'One or two a day, at most.' },
  { key: 'auction', label: 'Auction', description: 'Only when you’ve been outbid.' },
];

// What each setting means, as RLS enforces it (migration 20260101000000).
const VISIBILITY: { key: AttendeeVisibility; label: string; description: string }[] = [
  { key: 'public', label: 'Public', description: 'Listed in the attendee directory for your events.' },
  {
    key: 'connections_only',
    label: 'Connections only',
    description: 'Listed in the directory; only people you connect with see your contact details.',
  },
  { key: 'hidden', label: 'Hidden', description: 'Not listed anywhere. Only you and the REGROWTH team can see your profile.' },
];

function appVersion(): string {
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version;
  const build = Application.nativeBuildVersion;
  if (!version) return '—';
  return build ? `${version} (${build})` : version;
}

/** "Last synced …", ticking over while the screen is open. */
function LastSynced() {
  const at = useSettingsLastSynced();
  const syncing = useIsFetching() > 0;
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <SettingsRow
      icon="sync-outline"
      title="Last synced"
      subtitle={syncing ? 'Syncing…' : at ? syncedAgo(at) : 'Not yet'}
    />
  );
}

export default function AppSettings() {
  const attendee = useAppStore((s) => s.attendee);
  const { update } = useSettingsUpdate();
  const cache = useSettingsClearCache();
  const account = useSettingsSignOut();
  const [confirm, setConfirm] = useState<'clear' | 'sign-out' | null>(null);

  const prefs = attendee?.notification_prefs;
  const enabled = prefs?.enabled !== false;
  const visibility = attendee?.visibility ?? 'public';

  function setPref(key: string, on: boolean) {
    // The store, not this render: two switches can flip before it re-renders.
    const current = useAppStore.getState().attendee;
    if (!current) return;
    update({ notification_prefs: { ...current.notification_prefs, [key]: on } });
  }

  return (
    <SubScreen title="App Settings" subtitle="Notifications, Privacy & Sync">
      <Section>
        <SettingsGroup
          title="Notifications"
          footnote="Announcements from the REGROWTH team always come through — they’re how we tell you about room changes and surprises."
        >
          <SettingsRow
            icon="notifications-outline"
            title="Allow notifications"
            subtitle="The same switch as the Alerts tab."
            disabled={!attendee}
            right={
              <SettingsSwitch
                value={enabled}
                onValueChange={(on) => setPref('enabled', on)}
                disabled={!attendee}
                label="Allow notifications"
              />
            }
          />
          {CATEGORIES.map((c) => (
            <SettingsRow
              key={c.key}
              title={c.label}
              subtitle={c.description}
              // Off at the master switch: each choice is kept for when it comes back on.
              disabled={!attendee || !enabled}
              right={
                <SettingsSwitch
                  value={enabled && prefs?.[c.key] !== false}
                  onValueChange={(on) => setPref(c.key, on)}
                  disabled={!attendee || !enabled}
                  label={c.label}
                />
              }
            />
          ))}
        </SettingsGroup>
      </Section>

      <Section>
        <SettingsGroup
          title="Privacy"
          subtitle="Who can see your profile"
          footnote={attendee ? undefined : 'Visibility applies to your event registration, once you have one.'}
        >
          {VISIBILITY.map((v) => (
            <SettingsRow
              key={v.key}
              title={v.label}
              subtitle={v.description}
              accessibilityRole="radio"
              accessibilityState={{ checked: visibility === v.key }}
              disabled={!attendee}
              onPress={() => visibility !== v.key && update({ visibility: v.key })}
              right={<RadioMark checked={visibility === v.key} />}
            />
          ))}
        </SettingsGroup>
      </Section>

      <Section>
        <SettingsGroup title="Data & Sync">
          <LastSynced />
          <SettingsRow
            icon="trash-outline"
            title="Clear cached data"
            subtitle={cache.isPending ? 'Clearing…' : 'Downloads a fresh copy of the agenda, notes and everything else.'}
            onPress={() => setConfirm('clear')}
            disabled={cache.isPending}
          />
        </SettingsGroup>
      </Section>

      <Section>
        <SettingsGroup title="Account">
          <SettingsRow icon="person-outline" title="Edit profile" onPress={() => router.push('/me/edit')} />
          <SettingsRow icon="key-outline" title="Change password" onPress={() => router.push('/(auth)/reset')} />
          <SettingsRow
            icon="log-out-outline"
            title={account.isPending ? 'Signing out…' : 'Sign out'}
            tone="danger"
            disabled={account.isPending}
            onPress={() => setConfirm('sign-out')}
          />
        </SettingsGroup>
      </Section>

      <Section>
        <SettingsGroup title="About">
          <SettingsRow icon="information-circle-outline" title="Version" value={appVersion()} />
          <SettingsRow icon="document-text-outline" title="Terms & Conditions" onPress={() => router.push('/me/terms')} />
          <SettingsRow icon="shield-checkmark-outline" title="Privacy Policy" onPress={() => router.push('/me/privacy')} />
          <SettingsRow icon="star-outline" title="Rate the app" onPress={() => router.push('/me/rate')} />
          <SettingsRow icon="chatbubbles-outline" title="Contact us" onPress={() => router.push('/me/contact')} />
        </SettingsGroup>
      </Section>

      {confirm === 'clear' && (
        <AlertDialog
          title="Clear cached data?"
          body="Everything the app has saved on this device downloads again. Your account, notes and saved sessions are not affected."
          primary="Clear"
          onPrimary={() => {
            setConfirm(null);
            cache.clear();
          }}
          onDismiss={() => setConfirm(null)}
        />
      )}
      {confirm === 'sign-out' && (
        <AlertDialog
          title="Sign out?"
          body="You can sign back in at any time."
          primary="Sign Out"
          onPrimary={() => {
            setConfirm(null);
            account.signOut();
          }}
          onDismiss={() => setConfirm(null)}
        />
      )}
    </SubScreen>
  );
}
