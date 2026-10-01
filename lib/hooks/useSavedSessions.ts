import { useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, DEMO_REGISTERED } from '@/lib/demo';
import { DEMO_SCHEDULE_PICKS, demoAgenda } from '@/lib/demo-event';
import { SESSION_COLUMNS, toGuideSession, type GuideSession, type SessionQueryRow } from '@/lib/eventContent';
import { PRODUCTS } from '@/lib/events';

/**
 * Saved Sessions (216:796): the attendee's `schedule_picks`, joined to the
 * sessions and their speakers, soonest first, across every event.
 *
 * The agenda's bookmark (useSchedulePicks, lib/hooks/useSessions.ts) owns the
 * list of picked ids; this adds the sessions behind them. Saving on the agenda
 * invalidates this query, and unsaving here updates the agenda's ids, so the
 * two screens always agree — in demo mode too, where the agenda's cached ids
 * are the only record.
 */

export type SavedSession = GuideSession & { event_id: string };

const savedKey = (attendeeId?: string) => ['saved-sessions', attendeeId] as const;
const picksKey = (attendeeId?: string) => ['schedule-picks', attendeeId] as const;

type PickRow = { session: (SessionQueryRow & { event_id: string }) | null };

const byStart = (a: SavedSession, b: SavedSession) => Date.parse(a.start_at) - Date.parse(b.start_at);

type ProfileCounts = { savedSessions: number; connections: number };

/** Keeps the Profile menu's "{n} Scheduled Events" in step (useProfileCounts). */
function bumpSavedCount(qc: QueryClient, attendeeId: string | undefined, by: number) {
  qc.setQueryData(['profile-counts', attendeeId], (old: ProfileCounts | undefined) =>
    old ? { ...old, savedSessions: Math.max(0, old.savedSessions + by) } : old,
  );
}

/**
 * React Query's result types need TypeScript 5.4 (`NoInfer`) and read as `any`
 * under this repo's 5.3, so the hooks state their shapes.
 */
export type ListQuery<T> = { data: T[] | undefined; isLoading: boolean; isError: boolean; refetch: () => void };

export function useSavedSessions(): ListQuery<SavedSession> {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: savedKey(attendeeId),
    enabled: !!attendeeId,
    // Cheap, and picks change on another screen: read again on every visit.
    staleTime: 0,
    queryFn: async (): Promise<SavedSession[]> => {
      if (IS_DEMO) {
        if (!DEMO_REGISTERED) return [];
        const ids = (qc.getQueryData(picksKey(attendeeId)) as string[] | undefined) ?? DEMO_SCHEDULE_PICKS;
        return PRODUCTS.flatMap((p) =>
          demoAgenda(p.id)
            .filter((s) => ids.includes(s.id))
            .map((s) => ({ ...s, event_id: p.id })),
        ).sort(byStart);
      }
      const { data, error } = await supabase
        .from('schedule_picks')
        .select(`session:sessions(event_id, ${SESSION_COLUMNS})`)
        .eq('attendee_id', attendeeId!);
      if (error) throw error;
      // A pick whose session was unpublished comes back without it (RLS).
      return ((data ?? []) as unknown as PickRow[])
        .flatMap(({ session }) => (session ? [{ ...toGuideSession(session), event_id: session.event_id }] : []))
        .sort(byStart);
    },
  });

  // The agenda sits in another tab while this screen stays mounted underneath,
  // so read again whenever it comes back into view.
  const refetch = query.refetch as () => Promise<unknown>;
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );

  return {
    data: query.data as SavedSession[] | undefined,
    isLoading: query.isLoading as boolean,
    isError: query.isError as boolean,
    refetch: () => void refetch(),
  };
}

/** Unsave — the filled bookmark on a saved session card. Optimistic. */
export function useSavedSessionsRemove(): (sessionId: string) => void {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const qc = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: async (sessionId: string) => {
      if (IS_DEMO) return;
      const { error } = await supabase
        .from('schedule_picks')
        .delete()
        .eq('attendee_id', attendeeId!)
        .eq('session_id', sessionId);
      if (error) throw error;
    },
    onMutate: async (sessionId: string) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: savedKey(attendeeId) }),
        qc.cancelQueries({ queryKey: picksKey(attendeeId) }),
      ]);
      const previous = qc.getQueryData(savedKey(attendeeId)) as SavedSession[] | undefined;
      const previousPicks = qc.getQueryData(picksKey(attendeeId)) as string[] | undefined;
      qc.setQueryData(savedKey(attendeeId), (old: SavedSession[] | undefined) =>
        old?.filter((s) => s.id !== sessionId),
      );
      // Demo mode has no other record of the picks, so seed the agenda's ids
      // even if the agenda has not loaded them yet.
      const picks = previousPicks ?? (IS_DEMO ? DEMO_SCHEDULE_PICKS : undefined);
      if (picks) qc.setQueryData(picksKey(attendeeId), picks.filter((id) => id !== sessionId));
      bumpSavedCount(qc, attendeeId, -1);
      return { previous, previousPicks };
    },
    onError: (_error: Error, _sessionId: string, context: { previous?: SavedSession[]; previousPicks?: string[] } | undefined) => {
      if (context?.previous) qc.setQueryData(savedKey(attendeeId), context.previous);
      if (context?.previousPicks) qc.setQueryData(picksKey(attendeeId), context.previousPicks);
      bumpSavedCount(qc, attendeeId, 1);
    },
    onSettled: () => {
      if (IS_DEMO) return;
      qc.invalidateQueries({ queryKey: picksKey(attendeeId) });
      qc.invalidateQueries({ queryKey: ['profile-counts', attendeeId] });
    },
  });
  return mutate as (sessionId: string) => void;
}
