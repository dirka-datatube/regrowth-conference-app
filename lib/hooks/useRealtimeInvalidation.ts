import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAppStore } from '../store';
import { IS_DEMO } from '../demo';

// Spec §10.7: an admin edit must appear on devices in under 30 seconds.
// One channel per app session invalidates the relevant query caches the
// moment content tables change.
const TABLE_KEYS: Record<string, string[][]> = {
  sessions: [['sessions'], ['happening-now'], ['up-next'], ['meals'], ['session']],
  speakers: [['speakers'], ['speaker']],
  partners: [['partners'], ['partners-solutions'], ['partner']],
  faqs: [['faqs']],
  auction_items: [['auction']],
};

export function useRealtimeInvalidation() {
  const qc = useQueryClient();
  const eventId = useAppStore((s) => s.attendee?.event_id);

  useEffect(() => {
    if (!eventId || IS_DEMO) return;

    let channel = supabase.channel(`content:${eventId}`);
    for (const table of Object.keys(TABLE_KEYS)) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          for (const key of TABLE_KEYS[table]) {
            qc.invalidateQueries({ queryKey: key });
          }
        },
      );
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, qc]);
}
