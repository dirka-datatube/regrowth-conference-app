import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO } from '@/lib/demo';
import { DEMO_SPEAKER_FOLLOWS, demoGuideSpeakers } from '@/lib/demo-event';
import { SPEAKER_COLUMNS, type GuideSpeaker } from '@/lib/eventContent';
import type { GuideQuery } from '@/lib/hooks/useEvent';

/** An event's speakers in running order — the Speakers screen and the event home row. */
export function useSpeakers(eventId: string | undefined): GuideQuery<GuideSpeaker[]> {
  const query = useQuery({
    queryKey: ['guide-speakers', eventId],
    enabled: !!eventId,
    queryFn: async (): Promise<GuideSpeaker[]> => {
      if (IS_DEMO) return demoGuideSpeakers(eventId!);
      const { data, error } = await supabase
        .from('speakers')
        .select(SPEAKER_COLUMNS)
        .eq('event_id', eventId!)
        .order('display_order')
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as GuideSpeaker[];
    },
  });
  return { data: query.data, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
}

export function useSpeaker(eventId: string | undefined, speakerId: string | undefined) {
  const { data, isLoading } = useSpeakers(eventId);
  const speaker = useMemo(() => data?.find((s) => s.id === speakerId), [data, speakerId]);
  return { speaker, isLoading };
}

type FollowChange = { speakerId: string; follow: boolean };

/**
 * Speakers the attendee follows (`speaker_followers`), with an optimistic
 * toggle. Demo toggles stay in this browser's cache, as with saved sessions.
 */
export function useSpeakerFollows(): {
  isFollowing: (speakerId: string) => boolean;
  toggle: (speakerId: string) => void;
  canFollow: boolean;
} {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const qc = useQueryClient();
  const key = useMemo(() => ['speaker-follows', attendeeId], [attendeeId]);

  const query = useQuery({
    queryKey: key,
    enabled: !!attendeeId,
    ...(IS_DEMO ? { staleTime: Infinity } : {}),
    queryFn: async (): Promise<string[]> => {
      if (IS_DEMO) return DEMO_SPEAKER_FOLLOWS;
      const { data, error } = await supabase.from('speaker_followers').select('speaker_id').eq('attendee_id', attendeeId!);
      if (error) throw error;
      return ((data ?? []) as { speaker_id: string }[]).map((r) => r.speaker_id);
    },
  });
  const data: string[] | undefined = query.data;
  const ids = useMemo(() => data ?? [], [data]);

  const { mutate } = useMutation<void, Error, FollowChange, { previous?: string[] }>({
    mutationFn: async ({ speakerId, follow }) => {
      if (IS_DEMO) return;
      if (!attendeeId) throw new Error('Sign in to follow speakers.');
      const { error } = follow
        ? await supabase
            .from('speaker_followers')
            // types/database.ts predates supabase-js's schema shape, which
            // types writes as `never` (as in app/(tabs)/alerts.tsx).
            .upsert({ speaker_id: speakerId, attendee_id: attendeeId } as never, { ignoreDuplicates: true })
        : await supabase.from('speaker_followers').delete().eq('speaker_id', speakerId).eq('attendee_id', attendeeId);
      if (error) throw error;
    },
    onMutate: async ({ speakerId, follow }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key) as string[] | undefined;
      qc.setQueryData(key, (current: string[] = []) =>
        follow ? (current.includes(speakerId) ? current : [...current, speakerId]) : current.filter((id) => id !== speakerId),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => qc.setQueryData(key, context?.previous),
    onSettled: () => {
      if (!IS_DEMO) qc.invalidateQueries({ queryKey: key });
    },
  });

  const isFollowing = useCallback((speakerId: string) => ids.includes(speakerId), [ids]);
  const toggle = useCallback(
    (speakerId: string) => mutate({ speakerId, follow: !ids.includes(speakerId) }),
    [ids, mutate],
  );

  return { isFollowing, toggle, canFollow: !!attendeeId };
}
