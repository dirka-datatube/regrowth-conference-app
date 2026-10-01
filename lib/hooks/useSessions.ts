import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO } from '@/lib/demo';
import { DEMO_SCHEDULE_PICKS, demoAgenda } from '@/lib/demo-event';
import { SESSION_COLUMNS, toGuideSession, type GuideSession, type SessionQueryRow } from '@/lib/eventContent';
import type { GuideQuery } from '@/lib/hooks/useEvent';

/**
 * An event's published programme, in start order. The agenda, session detail,
 * speaker profiles and the What's Coming feed all read this one query — a
 * three-day programme is small, and it keeps them consistent.
 */
export function useSessions(eventId: string | undefined): GuideQuery<GuideSession[]> {
  const query = useQuery({
    queryKey: ['guide-sessions', eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<GuideSession[]> => {
      if (IS_DEMO) return demoAgenda(eventId!);
      const { data, error } = await supabase
        .from('sessions')
        .select(SESSION_COLUMNS)
        .eq('event_id', eventId!)
        .eq('is_published', true)
        .order('start_at');
      if (error) throw error;
      return ((data ?? []) as unknown as SessionQueryRow[]).map(toGuideSession);
    },
  });
  return { data: query.data, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
}

export function useSession(eventId: string | undefined, sessionId: string | undefined) {
  const { data, isLoading } = useSessions(eventId);
  const session = useMemo(() => data?.find((s) => s.id === sessionId), [data, sessionId]);
  return { session, isLoading };
}

type PickChange = { sessionId: string; save: boolean };

/**
 * The attendee's saved sessions (`schedule_picks`), across events, with an
 * optimistic toggle. Ids, not a Set: the query cache is persisted as JSON.
 *
 * In demo mode the toggle only writes the cache, which the persister keeps, so
 * saves survive a reload in that browser and nothing else sees them.
 */
export function useSchedulePicks(): {
  ids: string[];
  isSaved: (sessionId: string) => boolean;
  toggle: (sessionId: string) => void;
  canSave: boolean;
} {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const qc = useQueryClient();
  const key = useMemo(() => ['schedule-picks', attendeeId], [attendeeId]);

  const query = useQuery({
    queryKey: key,
    enabled: !!attendeeId,
    // A demo refetch would reset the attendee's toggles to the fixture.
    ...(IS_DEMO ? { staleTime: Infinity } : {}),
    queryFn: async (): Promise<string[]> => {
      if (IS_DEMO) return DEMO_SCHEDULE_PICKS;
      const { data, error } = await supabase.from('schedule_picks').select('session_id').eq('attendee_id', attendeeId!);
      if (error) throw error;
      return ((data ?? []) as { session_id: string }[]).map((r) => r.session_id);
    },
  });
  const data: string[] | undefined = query.data;
  const ids = useMemo(() => data ?? [], [data]);

  const { mutate } = useMutation<void, Error, PickChange, { previous?: string[]; bumped: number }>({
    mutationFn: async ({ sessionId, save }) => {
      if (IS_DEMO) return;
      if (!attendeeId) throw new Error('Sign in to save sessions.');
      const { error } = save
        ? await supabase
            .from('schedule_picks')
            // types/database.ts predates supabase-js's schema shape, which
            // types writes as `never` (as in app/(tabs)/alerts.tsx).
            .upsert({ attendee_id: attendeeId, session_id: sessionId } as never, { ignoreDuplicates: true })
        : await supabase.from('schedule_picks').delete().eq('attendee_id', attendeeId).eq('session_id', sessionId);
      if (error) throw error;
    },
    onMutate: async ({ sessionId, save }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key) as string[] | undefined;
      const had = (previous ?? []).includes(sessionId);
      qc.setQueryData(key, (current: string[] = []) =>
        save ? (current.includes(sessionId) ? current : [...current, sessionId]) : current.filter((id) => id !== sessionId),
      );
      if (had !== save) bumpSavedCount(save ? 1 : -1);
      return { previous, bumped: had !== save ? (save ? 1 : -1) : 0 };
    },
    onError: (_error, _vars, context) => {
      qc.setQueryData(key, context?.previous);
      if (context?.bumped) bumpSavedCount(-context.bumped);
    },
    onSettled: () => {
      // Saved Sessions re-reads its list; in demo mode it reads these ids.
      qc.invalidateQueries({ queryKey: ['saved-sessions'] });
      // A demo refetch of the ids would reset them to the fixture.
      if (IS_DEMO) return;
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['profile-counts'] });
    },
  });

  /** Profile's "{n} Scheduled Events", kept in step until it refetches. */
  function bumpSavedCount(by: number) {
    qc.setQueryData(['profile-counts', attendeeId], (old: { savedSessions: number } | undefined) =>
      old ? { ...old, savedSessions: Math.max(0, old.savedSessions + by) } : old,
    );
  }

  const isSaved = useCallback((sessionId: string) => ids.includes(sessionId), [ids]);
  const toggle = useCallback(
    (sessionId: string) => mutate({ sessionId, save: !ids.includes(sessionId) }),
    [ids, mutate],
  );

  return { ids, isSaved, toggle, canSave: !!attendeeId };
}
