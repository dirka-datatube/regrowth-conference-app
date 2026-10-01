import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO } from '@/lib/demo';
import { demoCommunity, demoCommunityProfile, demoConnectedIds, demoContact } from '@/lib/demo-connect';

/**
 * An event's attendee community (Connect → Attendees, 189:540 / 211:660) and
 * the attendee profile it opens.
 *
 * RLS already limits the directory to the viewer's own event and hides
 * `hidden` profiles; `connections_only` profiles are listed but keep their
 * contact details back until the two people are connected.
 */

export type CommunityMember = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  photo_url: string | null;
  interests: string[];
};

export type CommunityProfile = CommunityMember & {
  event_id: string;
  bio: string | null;
};

/**
 * Shown only once connected. `attendees` has no LinkedIn column yet, so the
 * real path always returns null for it and the profile leaves the row out.
 */
export type CommunityContact = { email: string | null; linkedin_url: string | null };

/** "Director | Patel Realty" — the v2 role line. */
export function roleLine(p: Pick<CommunityMember, 'role' | 'company'>) {
  return [p.role, p.company].filter(Boolean).join(' | ');
}

export function matchesMember(m: CommunityMember, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [m.name, m.role, m.company, ...(m.interests ?? [])].some((f) => f?.toLowerCase().includes(needle));
}

const NO_MEMBERS: CommunityMember[] = [];
const NO_IDS: string[] = [];

/**
 * Everyone else in the event's community, by name. The whole directory is one
 * request (a few hundred rows at most) so search filters on the device and
 * costs nothing per keystroke.
 */
export function useCommunityMembers(eventId: string | undefined, enabled: boolean) {
  const meId = useAppStore((s) => s.attendee?.id);
  const query = useQuery({
    queryKey: ['community-members', eventId],
    enabled: enabled && !!eventId,
    queryFn: async (): Promise<CommunityMember[]> => {
      if (IS_DEMO) return demoCommunity(eventId!);
      const { data, error } = await supabase
        .from('attendees')
        .select('id, name, role, company, photo_url, interests')
        .eq('event_id', eventId!)
        .neq('visibility', 'hidden')
        .order('name')
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as CommunityMember[];
    },
  });
  // React Query's result types resolve to `any` under this TypeScript (5.3),
  // so each hook states the shape it returns.
  const rows = query.data as CommunityMember[] | undefined;
  const members = useMemo(() => (rows ?? NO_MEMBERS).filter((m) => m.id !== meId), [rows, meId]);
  return {
    members,
    isLoading: query.isLoading as boolean,
    isError: query.isError as boolean,
    isRefetching: query.isRefetching as boolean,
    refetch: () => void query.refetch(),
  };
}

export function useCommunityProfile(id: string | undefined) {
  const query = useQuery({
    queryKey: ['community-profile', id],
    enabled: !!id,
    queryFn: async (): Promise<CommunityProfile | null> => {
      if (IS_DEMO) return demoCommunityProfile(id!);
      // No row back means hidden, or at another event — RLS decides.
      const { data, error } = await supabase
        .from('attendees')
        .select('id, event_id, name, role, company, photo_url, bio, interests')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as CommunityProfile | null;
    },
  });
  return {
    profile: query.data as CommunityProfile | null | undefined,
    isLoading: query.isLoading as boolean,
    isError: query.isError as boolean,
    refetch: () => void query.refetch(),
  };
}

/** Ids of the people the signed-in attendee is connected with. */
export function useCommunityConnections(): string[] {
  const meId = useAppStore((s) => s.attendee?.id);
  const query = useQuery({
    // An array, not a Set: the query cache is persisted as JSON.
    queryKey: ['community-connections', meId],
    enabled: !!meId,
    queryFn: async (): Promise<string[]> => {
      if (IS_DEMO) return demoConnectedIds;
      const { data, error } = await supabase
        .from('connections')
        .select('attendee_a, attendee_b')
        .or(`attendee_a.eq.${meId},attendee_b.eq.${meId}`);
      if (error) throw error;
      return ((data ?? []) as unknown as { attendee_a: string; attendee_b: string }[]).map((c) =>
        c.attendee_a === meId ? c.attendee_b : c.attendee_a,
      );
    },
  });
  return (query.data as string[] | undefined) ?? NO_IDS;
}

/** Contact details, fetched only once connected. */
export function useCommunityContact(id: string | undefined, connected: boolean) {
  const query = useQuery({
    queryKey: ['community-contact', id],
    enabled: !!id && connected,
    queryFn: async (): Promise<CommunityContact | null> => {
      if (IS_DEMO) return demoContact(id!);
      const { data, error } = await supabase.from('attendees').select('email').eq('id', id!).maybeSingle();
      if (error) throw error;
      const row = data as unknown as { email: string | null } | null;
      return row ? { email: row.email, linkedin_url: null } : null;
    },
  });
  return query.data as CommunityContact | null | undefined;
}

/**
 * Connect from a profile — the manual path, beside a badge scan (qr-connect).
 * Connections are mutual and stored smaller-uuid first, as qr-connect does.
 */
export function useCommunityConnect() {
  const me = useAppStore((s) => s.attendee);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (other: CommunityProfile) => {
      if (IS_DEMO) return;
      if (!me) throw new Error('Sign in to connect.');
      const [a, b] = [me.id, other.id].sort();
      const { error } = await supabase
        .from('connections')
        // types/database.ts predates supabase-js's schema shape, which types
        // insert() as `never` (see app/(tabs)/alerts.tsx).
        .insert({ event_id: me.event_id, attendee_a: a, attendee_b: b, source: 'manual' } as never);
      // 23505: the pair is already connected, which is the outcome we wanted.
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: (_data, other) => {
      qc.setQueryData<string[]>(['community-connections', me?.id], (ids: string[] | undefined) =>
        ids?.includes(other.id) ? ids : [...(ids ?? []), other.id],
      );
      if (IS_DEMO) return;
      qc.invalidateQueries({ queryKey: ['community-connections'] });
      qc.invalidateQueries({ queryKey: ['profile-counts'] });
      qc.invalidateQueries({ queryKey: ['my-connections'] });
    },
  });
}
