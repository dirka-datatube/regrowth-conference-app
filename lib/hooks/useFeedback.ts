import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { IS_DEMO } from '@/lib/demo';

/**
 * Rate App (227:2617) and Contact (227:2914) both write one row to
 * `app_feedback` (migration 20260929000300). `user_id` defaults to the signed-in
 * account in the database, so it is never sent. Demo mode keeps nothing.
 */

export type FeedbackInput =
  | { kind: 'rating'; rating: number; tags: string[]; message?: string }
  | { kind: 'contact'; name: string; email: string; subject?: string; message: string };

export type FeedbackSubmit = {
  submit: (input: FeedbackInput) => void;
  isPending: boolean;
  /** True once sent — the screens swap to their thank-you state. */
  isSuccess: boolean;
  error: Error | null;
};

const orNull = (s: string | undefined) => s?.trim() || null;

export function useFeedbackSubmit(): FeedbackSubmit {
  const mutation = useMutation({
    mutationFn: async (input: FeedbackInput) => {
      if (IS_DEMO) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return;
      }
      const row =
        input.kind === 'rating'
          ? { kind: 'rating', rating: input.rating, tags: input.tags, message: orNull(input.message) }
          : {
              kind: 'contact',
              name: orNull(input.name),
              email: input.email.trim(),
              subject: orNull(input.subject),
              message: input.message.trim(),
            };
      const { error } = await supabase
        // app_feedback is newer than the hand-written types/database.ts, whose
        // shape types every write as `never` anyway (see app/(tabs)/alerts.tsx).
        .from('app_feedback' as never)
        .insert(row as never);
      if (error) throw error;
    },
  });
  return {
    submit: mutation.mutate as (input: FeedbackInput) => void,
    isPending: mutation.isPending as boolean,
    isSuccess: mutation.isSuccess as boolean,
    error: mutation.error as Error | null,
  };
}
