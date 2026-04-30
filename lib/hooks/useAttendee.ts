import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAppStore } from '../store';
import { IS_DEMO, demoAttendee } from '../demo';
import type { Attendee } from '@/types/database';

export function useAttendee() {
  const session = useAppStore((s) => s.session);
  const setAttendee = useAppStore((s) => s.setAttendee);

  const query = useQuery<Attendee | null>({
    queryKey: ['attendee', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      if (IS_DEMO) return demoAttendee;
      if (!session) return null;
      const { data, error } = await supabase
        .from('attendees')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setAttendee(query.data ?? null);
  }, [query.data, setAttendee]);

  return query;
}
