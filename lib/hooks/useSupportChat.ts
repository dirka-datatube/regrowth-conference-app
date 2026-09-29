import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO } from '@/lib/demo';
import { demoStaffReply, demoSupportThread } from '@/lib/demo-connect';
import {
  TEAM_REQUEST,
  buildThread,
  teamStatus,
  type AssistantContext,
  type SupportMessage,
} from '@/lib/support';

/**
 * The support thread behind /support.
 *
 * - live: signed in — every message is a `support_messages` row, and staff
 *   replies arrive by polling while the chat is open.
 * - demo: canned and local; Connect gets a canned team reply.
 * - signed-out (either build): the assistant still answers, locally; reaching
 *   the team needs an account, so the escalation card asks them to sign in.
 */
export type SupportMode = 'live' | 'demo' | 'signed-out';

const COLUMNS = 'id, body, from_staff, needs_human, created_at';
const POLL_MS = 15_000;
const DEMO_REPLY_MS = 2500;
const NO_ROWS: SupportMessage[] = [];

export function useSupportChat(ctx: AssistantContext) {
  const userId = useAppStore((s) => s.session?.user.id);
  const mode: SupportMode = !userId ? 'signed-out' : IS_DEMO ? 'demo' : 'live';
  const qc = useQueryClient();
  const key = useMemo(() => ['support-thread', userId], [userId]);

  const [startedAt] = useState(() => new Date().toISOString());
  const [localRows, setLocalRows] = useState<SupportMessage[]>(() => (mode === 'demo' ? demoSupportThread() : []));
  const counter = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const thread = useQuery<SupportMessage[]>({
    queryKey: key,
    enabled: mode === 'live',
    refetchInterval: POLL_MS,
    queryFn: async () => {
      // Filtered to the viewer even though RLS already is: staff can read
      // every thread, and their own chat should still be their own.
      const { data, error } = await supabase
        .from('support_messages')
        .select(COLUMNS)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data ?? []) as unknown as SupportMessage[]).reverse();
    },
  });

  const post = useMutation({
    mutationFn: async (msg: Pick<SupportMessage, 'body' | 'needs_human'>) => {
      const { data, error } = await supabase
        .from('support_messages')
        // user_id defaults to auth.uid(); insert() is typed `never` by the
        // hand-written schema (see app/(tabs)/alerts.tsx).
        .insert(msg as never)
        .select(COLUMNS)
        .single();
      if (error) throw error;
      return data as unknown as SupportMessage;
    },
    onMutate: async (msg) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<SupportMessage[]>(key);
      const optimistic: SupportMessage = {
        ...msg,
        id: `local-${++counter.current}`,
        from_staff: false,
        created_at: new Date().toISOString(),
        pending: true,
      };
      qc.setQueryData<SupportMessage[]>(key, (rows: SupportMessage[] | undefined) => [...(rows ?? []), optimistic]);
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_error, _msg, context) => qc.setQueryData(key, context?.previous),
    onSuccess: (row, _msg, context) =>
      qc.setQueryData<SupportMessage[]>(key, (rows: SupportMessage[] | undefined) =>
        (rows ?? []).map((r) => (r.id === context?.optimisticId ? row : r)),
      ),
  });

  // React Query's result types resolve to `any` under TypeScript 5.3.
  const rows = mode === 'live' ? ((thread.data as SupportMessage[] | undefined) ?? NO_ROWS) : localRows;
  const items = useMemo(() => buildThread(rows, ctx, startedAt), [rows, ctx, startedAt]);

  /** Resolves false when the message could not be sent, so the draft is kept. */
  async function send(body: string, needsHuman = false): Promise<boolean> {
    const text = body.trim();
    if (!text) return false;
    if (mode === 'live') {
      try {
        await post.mutateAsync({ body: text, needs_human: needsHuman });
        return true;
      } catch {
        return false;
      }
    }
    setLocalRows((r) => [
      ...r,
      {
        id: `local-${++counter.current}`,
        body: text,
        from_staff: false,
        needs_human: needsHuman,
        created_at: new Date().toISOString(),
      },
    ]);
    if (mode === 'demo' && needsHuman) {
      timers.current.push(setTimeout(() => setLocalRows((r) => [...r, demoStaffReply(ctx.firstName)]), DEMO_REPLY_MS));
    }
    return true;
  }

  return {
    mode,
    items,
    team: teamStatus(rows),
    loading: mode === 'live' && thread.isLoading,
    loadFailed: mode === 'live' && thread.isError,
    sendFailed: post.isError,
    send: (text: string) => send(text),
    requestTeam: () => send(TEAM_REQUEST, true),
  };
}
