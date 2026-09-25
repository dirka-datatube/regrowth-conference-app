import { useState } from 'react';
import { View, Switch, Platform } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TabScreen } from '@/components/TabScreen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AlertCard, AlertDialog, alertKind } from '@/components/AlertCard';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, demoAlerts } from '@/lib/demo';
import { NAVIGATE, eventEntryHref } from '@/lib/events';
import { colors } from '@/lib/theme';
import type { Attendee } from '@/types/database';

/**
 * Alerts — Figma v2 (71:540): typed, colour-coded cards, a master switch for
 * notifications, and the countdown dialog.
 */

type AlertNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: { event_id?: string } | null;
};

/** Where a card goes when tapped. Countdown opens the dialog instead. */
function alertHref(type: string): string | null {
  switch (type) {
    case 'registration_confirmed':
      return '/tickets';
    case 'action_required':
      return '/profile';
    case 'speaker_added':
      return '/speakers';
    case 'agenda_updated':
    case 'session_starting':
    case 'dont_miss':
      return '/agenda';
    case 'people_to_meet':
      return '/attendees';
    case 'partner_spotlight':
      return '/partners';
    case 'auction':
      return '/auction';
    default:
      return null;
  }
}

// react-native-web colours the thumb of a switched-on Switch from a web-only
// prop, and defaults it to teal.
const webThumb = (Platform.OS === 'web' ? { activeThumbColor: colors.snow } : {}) as object;

export default function Alerts() {
  const attendee = useAppStore((s) => s.attendee);
  const setAttendee = useAppStore((s) => s.setAttendee);
  const qc = useQueryClient();
  const attendeeId = attendee?.id;
  const [countdown, setCountdown] = useState<AlertNotification | null>(null);

  const { data } = useQuery<{ notification: AlertNotification }[]>({
    queryKey: ['my-alerts', attendeeId],
    enabled: !!attendeeId,
    queryFn: async () => {
      if (IS_DEMO) return demoAlerts;
      const { data, error } = await supabase
        .from('notification_recipients')
        .select(
          `delivered_at, opened_at,
           notification:notifications(id, title, body, type, sent_at, data)`,
        )
        .eq('attendee_id', attendeeId!)
        .order('delivered_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as { notification: AlertNotification }[];
    },
  });

  // Master switch. Stored as `enabled` beside the per-type preferences, so
  // turning alerts back on restores whatever the attendee had chosen before.
  const enabled = attendee?.notification_prefs?.enabled !== false;
  const toggle = useMutation({
    mutationFn: async (next: Attendee) => {
      if (IS_DEMO) return;
      const { error } = await supabase
        .from('attendees')
        // types/database.ts predates supabase-js's generic schema shape, which
        // types update() as `never` (the same error as lib/push.ts).
        .update({ notification_prefs: next.notification_prefs } as never)
        .eq('id', next.id);
      if (error) throw error;
    },
    onMutate: (next) => {
      const previous = attendee;
      setAttendee(next);
      return { previous };
    },
    onError: (_e, _next, ctx) => {
      if (ctx?.previous) setAttendee(ctx.previous);
    },
    onSuccess: () => {
      if (!IS_DEMO) qc.invalidateQueries({ queryKey: ['attendee'] });
    },
  });

  function setEnabled(on: boolean) {
    if (!attendee) return;
    toggle.mutate({ ...attendee, notification_prefs: { ...attendee.notification_prefs, enabled: on } });
  }

  function open(n: AlertNotification) {
    if (n.type === 'countdown') {
      setCountdown(n);
      return;
    }
    const href = alertHref(n.type);
    if (href) router.push(href as never);
  }

  const rows: { notification: AlertNotification }[] = data ?? [];

  return (
    <TabScreen
      supportChip={false}
      header={
        <ScreenHeader
          title="Alerts"
          subtitle="Stay Connected With REGROWTH"
          back={false}
          right={
            <Switch
              {...webThumb}
              value={enabled}
              onValueChange={setEnabled}
              disabled={!attendee}
              accessibilityLabel="Notifications"
              trackColor={{ false: colors.switchOff, true: colors.switchOn }}
              thumbColor={colors.snow}
              ios_backgroundColor={colors.switchOff}
            />
          }
        />
      }
    >
      <View className="gap-y-4 px-2.5">
        {rows.length ? (
          rows.map(({ notification: n }) => (
            <AlertCard
              key={n.id}
              kind={alertKind(n.type)}
              title={n.title}
              body={n.body}
              onPress={n.type === 'countdown' || alertHref(n.type) ? () => open(n) : undefined}
            />
          ))
        ) : (
          <EmptyState
            title="All quiet for now"
            description="We'll ping you here when there's something worth knowing."
          />
        )}
      </View>

      {countdown && (
        <AlertDialog
          title={countdown.title}
          body={countdown.body}
          primary="View Details"
          onPrimary={() => {
            const eventId = countdown.data?.event_id ?? NAVIGATE.id;
            setCountdown(null);
            router.push(eventEntryHref(eventId) as never);
          }}
          onDismiss={() => setCountdown(null)}
        />
      )}
    </TabScreen>
  );
}
