import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAppStore } from '../store';

// Daily Claude-generated suggestions (3 attendees, 2 partners). Cached
// per-day in daily_suggestions and re-resolved on the client to fetch the
// full attendee/partner rows.
export function useSuggestions() {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  return useQuery({
    queryKey: ['suggestions', attendeeId],
    enabled: !!attendeeId,
    queryFn: async () => {
      if (!attendeeId) return null;
      const today = new Date().toISOString().slice(0, 10);

      const { data: row } = await supabase
        .from('daily_suggestions')
        .select('*')
        .eq('attendee_id', attendeeId)
        .eq('for_date', today)
        .maybeSingle();

      let suggestions = row;
      if (!suggestions) {
        const { data: fresh, error } = await supabase.functions.invoke('claude-suggestions', {
          body: { attendee_id: attendeeId },
        });
        if (error) throw error;
        suggestions = fresh;
      }

      const attendeeIds = suggestions?.suggested_attendee_ids ?? [];
      const partnerIds = suggestions?.suggested_partner_ids ?? [];

      const [attendeesRes, partnersRes] = await Promise.all([
        attendeeIds.length
          ? supabase.from('attendees').select('id, name, role, company, photo_url, interests').in('id', attendeeIds)
          : Promise.resolve({ data: [] as any[] }),
        partnerIds.length
          ? supabase.from('partners').select('id, name, logo_url, description, tags').in('id', partnerIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      return {
        attendees: attendeesRes.data ?? [],
        partners: partnersRes.data ?? [],
        rationale: (suggestions?.rationale ?? {}) as Record<string, string>,
      };
    },
  });
}
