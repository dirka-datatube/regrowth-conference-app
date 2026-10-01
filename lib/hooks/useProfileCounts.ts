import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, DEMO_REGISTERED, demoProfileCounts } from '@/lib/demo';

/** The counts on the Profile menu: saved sessions and connections. */
export function useProfileCounts() {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  return useQuery({
    queryKey: ['profile-counts', attendeeId],
    enabled: !!attendeeId || IS_DEMO,
    queryFn: async () => {
      if (IS_DEMO) return DEMO_REGISTERED ? demoProfileCounts : { savedSessions: 0, connections: 0 };
      const [picks, connections] = await Promise.all([
        supabase
          .from('schedule_picks')
          .select('*', { count: 'exact', head: true })
          .eq('attendee_id', attendeeId!),
        supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .or(`attendee_a.eq.${attendeeId},attendee_b.eq.${attendeeId}`),
      ]);
      if (picks.error) throw picks.error;
      if (connections.error) throw connections.error;
      return { savedSessions: picks.count ?? 0, connections: connections.count ?? 0 };
    },
  });
}
