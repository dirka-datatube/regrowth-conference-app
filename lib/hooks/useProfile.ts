import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { useAppStore, type AccountProfile } from '../store';
import { IS_DEMO } from '../demo';
import { demoProfile } from '../demo-auth';
import type { Attendee } from '@/types/database';

const COLUMNS = 'id, email, first_name, last_name, phone, photo_url, company, role';

/**
 * The signed-in person's profile (profiles, migration 20260929000100): the
 * name, phone and photo that belong to the account, registered or not.
 *
 * Called once, by the tabs layout, which keeps it in the store — screens read
 * `useAppStore((s) => s.profile)`. Until the row can be read (the migration not
 * yet applied, say) the profile is assembled from what sign-up stored on the
 * account and from the registration, so there is always a name to show.
 * After editing a profile, invalidate `['profile']`.
 */
export function useProfile() {
  const session = useAppStore((s) => s.session);
  const attendee = useAppStore((s) => s.attendee);
  const setProfile = useAppStore((s) => s.setProfile);
  const userId = session?.user.id;

  const query = useQuery<AccountProfile | null>({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (IS_DEMO) return demoProfile;
      const { data, error } = await supabase.from('profiles').select(COLUMNS).eq('id', userId ?? '').maybeSingle();
      if (error) throw error;
      return data as AccountProfile | null;
    },
  });

  const profile = useMemo(
    () => (session ? (query.data ?? profileFromAccount(session.user, attendee)) : null),
    [session, query.data, attendee],
  );

  useEffect(() => {
    setProfile(profile);
  }, [profile, setProfile]);

  return { profile, isLoading: query.isLoading, error: query.error, refetch: query.refetch };
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** "Kylie Anne Walsh" → ["Kylie", "Anne Walsh"]. */
function splitName(name: string | null | undefined): [string | null, string | null] {
  const [first, ...rest] = (name ?? '').trim().split(/\s+/);
  return [first || null, rest.join(' ') || null];
}

function profileFromAccount(user: User, attendee: Attendee | null): AccountProfile {
  const meta = user.user_metadata ?? {};
  const [first, last] = splitName(attendee?.name);
  return {
    id: user.id,
    email: user.email ?? attendee?.email ?? '',
    first_name: text(meta.first_name) ?? first,
    last_name: text(meta.last_name) ?? last,
    phone: text(meta.phone),
    photo_url: attendee?.photo_url ?? null,
    company: attendee?.company ?? null,
    role: attendee?.role ?? null,
  };
}

type Named = Pick<AccountProfile, 'first_name' | 'last_name'> | null | undefined;

/**
 * The person's full name: the account's own, else the registration's, else
 * an empty string (callers choose their placeholder).
 */
export function displayName(profile: Named, attendee?: Pick<Attendee, 'name'> | null): string {
  const own = [profile?.first_name, profile?.last_name].map((part) => part?.trim()).filter(Boolean).join(' ');
  return own || attendee?.name?.trim() || '';
}

/** First name for greetings ("Hello, Kylie"), from the same sources as displayName. */
export function firstName(profile: Named, attendee?: Pick<Attendee, 'name'> | null): string {
  return profile?.first_name?.trim() || splitName(attendee?.name)[0] || '';
}
