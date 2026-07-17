import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAppStore } from '../store';
import { IS_DEMO, demoSessions } from '../demo';

export function useSessions() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  return useQuery({
    queryKey: ['sessions', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      if (IS_DEMO) return demoSessions;
      const { data, error } = await supabase
        .from('sessions')
        .select(
          `id, title, abstract, start_at, end_at, room, type, tags,
           speakers:session_speakers(speaker:speakers(id, name, headshot_url, title))`,
        )
        .eq('event_id', eventId!)
        .eq('is_published', true)
        .order('start_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMySchedule() {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  return useQuery({
    queryKey: ['schedule_picks', attendeeId],
    enabled: !!attendeeId,
    queryFn: async () => {
      if (IS_DEMO) return new Set<string>(['sess1', 'sess2']);
      const { data, error } = await supabase
        .from('schedule_picks')
        .select('session_id')
        .eq('attendee_id', attendeeId!);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.session_id));
    },
  });
}

// The attendee's next picked sessions — Home's "your day at a glance" strip.
export function useMyUpcoming(limit = 3) {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  return useQuery({
    queryKey: ['my-upcoming', attendeeId],
    enabled: !!attendeeId,
    refetchInterval: 1000 * 60 * 5,
    queryFn: async () => {
      if (IS_DEMO) return demoSessions.slice(0, 2);
      const { data, error } = await supabase
        .from('schedule_picks')
        .select('session:sessions(id, title, room, start_at, end_at, type)')
        .eq('attendee_id', attendeeId!);
      if (error) throw error;
      const now = Date.now();
      return (data ?? [])
        .map((r: any) => r.session)
        .filter((s: any) => s && new Date(s.end_at).getTime() > now)
        .sort((a: any, b: any) => +new Date(a.start_at) - +new Date(b.start_at))
        .slice(0, limit);
    },
  });
}

export function useHappeningNow() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  return useQuery({
    queryKey: ['happening-now', eventId],
    enabled: !!eventId,
    refetchInterval: 1000 * 60,
    queryFn: async () => {
      if (IS_DEMO) return [demoSessions[0]];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, room, start_at, end_at, type')
        .eq('event_id', eventId!)
        .lte('start_at', now)
        .gte('end_at', now)
        .order('start_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpNext() {
  const eventId = useAppStore((s) => s.attendee?.event_id);
  return useQuery({
    queryKey: ['up-next', eventId],
    enabled: !!eventId,
    refetchInterval: 1000 * 60,
    queryFn: async () => {
      if (IS_DEMO) return [demoSessions[1]];
      const now = new Date();
      const in30 = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, room, start_at, end_at, type')
        .eq('event_id', eventId!)
        .gte('start_at', now.toISOString())
        .lte('start_at', in30)
        .order('start_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}
