import { useCallback, useSyncExternalStore } from 'react';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAppStore, type AccountProfile } from '@/lib/store';
import { queryPersister } from '@/lib/queryClient';
import { signOut } from '@/lib/auth';
import { IS_DEMO } from '@/lib/demo';
import type { Attendee } from '@/types/database';

/**
 * App Settings (220:2103 / 220:2409) and Edit Profile: the attendee's own row,
 * the account's profile, the headshot, the local cache, and signing out.
 *
 * React Query's result types need TypeScript 5.4 (`NoInfer`) and read as `any`
 * under this repo's 5.3, so each hook states its shape.
 */

/**
 * The attendee columns an attendee may change themselves. Everything about the
 * registration — event, email, QR token, ticket, check-in — is REGROWTH's, and
 * a trigger rejects any change to it (migration 20260925000000).
 */
export type AttendeePatch = Partial<
  Pick<
    Attendee,
    'name' | 'role' | 'company' | 'bio' | 'interests' | 'dietary' | 'photo_url' | 'visibility' | 'notification_prefs'
  >
>;

/** The profile columns a person may change; the account owns `id` and `email`. */
export type ProfilePatch = Partial<
  Pick<AccountProfile, 'first_name' | 'last_name' | 'phone' | 'photo_url' | 'company' | 'role'>
>;

async function writeAttendee(id: string, patch: AttendeePatch) {
  const { error } = await supabase
    .from('attendees')
    // types/database.ts predates supabase-js's schema shape, which types
    // update() as `never` (as in app/(tabs)/alerts.tsx). `.single()` turns an
    // update that matched no row into an error rather than a silent no-op.
    .update(patch as never)
    .eq('id', id)
    .select('id')
    .single();
  if (error) throw error;
}

/** Optimistically applies `patch` to the store's attendee; returns the undo. */
function applyToAttendee(patch: AttendeePatch): () => void {
  const { attendee: previous, setAttendee } = useAppStore.getState();
  if (!previous) return () => undefined;
  setAttendee({ ...previous, ...patch });
  return () => {
    // Put back only what this write changed; a later write may have landed.
    const current = useAppStore.getState().attendee;
    if (!current) return;
    const keys = Object.keys(patch) as (keyof AttendeePatch)[];
    setAttendee({ ...current, ...Object.fromEntries(keys.map((k) => [k, previous[k]])) });
  };
}

export type SettingsUpdate = {
  update: (patch: AttendeePatch) => void;
  isPending: boolean;
  error: Error | null;
};

/**
 * Updates the signed-in attendee — App Settings' switches and visibility.
 * Optimistic: the store changes at once, so every screen reading the attendee
 * (the Alerts tab's switch among them) follows, and reverts if the write
 * fails. Demo mode keeps the change in memory only.
 */
export function useSettingsUpdate(): SettingsUpdate {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (patch: AttendeePatch) => {
      if (IS_DEMO) return;
      const id = useAppStore.getState().attendee?.id;
      if (!id) throw new Error('Your profile is still loading. Try again in a moment.');
      await writeAttendee(id, patch);
    },
    // Read the store, not a render's snapshot: switches can flip faster than
    // the screen re-renders.
    onMutate: (patch: AttendeePatch) => ({ undo: applyToAttendee(patch) }),
    onError: (_error: Error, _patch: AttendeePatch, context: { undo: () => void } | undefined) => context?.undo(),
    onSuccess: () => {
      if (!IS_DEMO) qc.invalidateQueries({ queryKey: ['attendee'] });
    },
  });
  return {
    update: mutation.mutate as (patch: AttendeePatch) => void,
    isPending: mutation.isPending as boolean,
    error: mutation.error as Error | null,
  };
}

// The profiles table (migration 20260929000100) may not be deployed yet, and
// accounts older than it may have no row. Either way, when the attendee row
// was written the edit has landed where attendees see it.
const PROFILE_NOT_THERE = ['PGRST205', '42P01', 'PGRST116'];

/**
 * Edit Profile's save. The person's details live in two rows: the attendee
 * row other attendees see (name, role, company, photo, bio, interests,
 * dietary), and the account's profile (first and last name, phone, role,
 * company, photo), which the app reads for an account without a registration.
 * Both are written so neither goes stale; either may be absent.
 *
 * The profile's query (useProfile, ['profile', userId]) is updated in place and
 * then re-read, as useProfile asks.
 */
export function useSettingsSaveProfile(): {
  saveAsync: (patch: { attendee: AttendeePatch | null; profile: ProfilePatch }) => Promise<void>;
  isPending: boolean;
  error: Error | null;
} {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ attendee, profile }: { attendee: AttendeePatch | null; profile: ProfilePatch }) => {
      const { attendee: row, session } = useAppStore.getState();
      const undo = attendee ? applyToAttendee(attendee) : () => undefined;
      const profileKey = ['profile', session?.user.id];
      const previousProfile = qc.getQueryData(profileKey) as AccountProfile | null | undefined;
      if (previousProfile) qc.setQueryData(profileKey, { ...previousProfile, ...profile });
      if (IS_DEMO) return;

      let wroteAttendee = false;
      try {
        if (attendee && row) {
          await writeAttendee(row.id, attendee);
          wroteAttendee = true;
        }
        if (session) {
          const { error } = await supabase
            .from('profiles')
            // Typed `never` by the hand-written types, as above.
            .update(profile as never)
            .eq('id', session.user.id)
            .select('id')
            .single();
          if (error && !(wroteAttendee && PROFILE_NOT_THERE.includes(error.code))) throw error;
        }
      } catch (error) {
        undo();
        if (previousProfile) qc.setQueryData(profileKey, previousProfile);
        // Half saved: read the attendee row back rather than guess.
        if (wroteAttendee) qc.invalidateQueries({ queryKey: ['attendee'] });
        throw error;
      }
      qc.invalidateQueries({ queryKey: ['attendee'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
  return {
    saveAsync: mutation.mutateAsync as (patch: { attendee: AttendeePatch | null; profile: ProfilePatch }) => Promise<void>,
    isPending: mutation.isPending as boolean,
    error: mutation.error as Error | null,
  };
}

export type HeadshotPhoto = { uri: string; base64: string; mime: 'image/jpeg' | 'image/png' };

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Uploads a new headshot and resolves to the URL to store in `photo_url`.
 *
 * `headshots` is a public bucket that attendees may write to under a folder
 * named for their attendee id (migration 20260101000100), so a photo needs a
 * registration. There is no update policy, so every photo gets a new path
 * rather than overwriting the last. Demo mode keeps the picked image's URI.
 */
export function useSettingsPhotoUpload(): {
  uploadAsync: (photo: HeadshotPhoto) => Promise<string>;
  isPending: boolean;
  error: Error | null;
} {
  const mutation = useMutation({
    mutationFn: async (photo: HeadshotPhoto): Promise<string> => {
      if (IS_DEMO) return photo.uri;
      const id = useAppStore.getState().attendee?.id;
      if (!id) throw new Error('A profile photo needs an event registration.');
      const path = `${id}/${Date.now()}.${photo.mime === 'image/png' ? 'png' : 'jpg'}`;
      const bucket = supabase.storage.from('headshots');
      const { error } = await bucket.upload(path, base64ToBytes(photo.base64), {
        contentType: photo.mime,
        upsert: false,
      });
      if (error) throw error;
      return bucket.getPublicUrl(path).data.publicUrl;
    },
  });
  return {
    uploadAsync: mutation.mutateAsync as (photo: HeadshotPhoto) => Promise<string>,
    isPending: mutation.isPending as boolean,
    error: mutation.error as Error | null,
  };
}

function lastFetch(qc: QueryClient): number {
  return qc
    .getQueryCache()
    .getAll()
    .reduce((latest, q) => Math.max(latest, q.state.dataUpdatedAt), 0);
}

/** When anything in the local cache last arrived from the server, or null. */
export function useSettingsLastSynced(): number | null {
  const qc = useQueryClient();
  const subscribe = useCallback((onChange: () => void) => qc.getQueryCache().subscribe(onChange), [qc]);
  const at = useSyncExternalStore(subscribe, () => lastFetch(qc), () => lastFetch(qc));
  return at > 0 ? at : null;
}

/**
 * Clears cached data: the copy persisted on the device and everything held in
 * memory, then downloads what is on screen again. The account's own rows are
 * refreshed rather than dropped, so the app does not blink signed-out.
 */
export function useSettingsClearCache(): { clear: () => void; isPending: boolean } {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const own = ['attendee', 'profile'];
      await queryPersister.removeClient();
      await qc.resetQueries({ predicate: (q) => !own.includes(String(q.queryKey[0])) });
      await Promise.all(own.map((key) => qc.invalidateQueries({ queryKey: [key] })));
    },
  });
  return { clear: () => mutation.mutate(), isPending: mutation.isPending as boolean };
}

/**
 * Sign out — lib/auth's signOut(), which also forgets the account's cached
 * data. The tabs layout's session guard then lands on Welcome, in demo mode too.
 */
export function useSettingsSignOut(): { signOut: () => void; isPending: boolean } {
  const mutation = useMutation({ mutationFn: signOut });
  return { signOut: () => mutation.mutate(), isPending: mutation.isPending as boolean };
}
