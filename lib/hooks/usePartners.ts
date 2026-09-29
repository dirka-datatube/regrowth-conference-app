import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO } from '@/lib/demo';
import { demoPartnerList } from '@/lib/demo-connect';
import type { Partner } from '@/types/database';

/**
 * REGROWTH Partners (173:720) and a partner's page (185:550). RLS scopes
 * `partners` to the viewer's event; featured partners lead, then the admin
 * panel's display order.
 */

export type PartnerSummary = Pick<Partner, 'id' | 'name' | 'logo_url' | 'description' | 'tags' | 'is_featured'>;

/** "banking" → "Banking" — tags are stored lower-case. */
export function tagLabel(tag: string) {
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export function matchesPartner(p: PartnerSummary, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [p.name, p.description, ...(p.tags ?? [])].some((f) => f?.toLowerCase().includes(needle));
}

const NO_PARTNERS: PartnerSummary[] = [];

export function usePartners() {
  const query = useQuery({
    queryKey: ['connect-partners'],
    queryFn: async (): Promise<PartnerSummary[]> => {
      if (IS_DEMO) return demoPartnerList;
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, logo_url, description, tags, is_featured')
        .order('is_featured', { ascending: false })
        .order('display_order')
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as PartnerSummary[];
    },
  });
  // React Query's result types resolve to `any` under TypeScript 5.3, so the
  // hooks state their shapes.
  return {
    partners: (query.data as PartnerSummary[] | undefined) ?? NO_PARTNERS,
    isLoading: query.isLoading as boolean,
    isError: query.isError as boolean,
    isRefetching: query.isRefetching as boolean,
    refetch: () => void query.refetch(),
  };
}

export function usePartner(id: string | undefined) {
  const query = useQuery({
    queryKey: ['connect-partner', id],
    enabled: !!id,
    queryFn: async (): Promise<Partner | null> => {
      if (IS_DEMO) return demoPartnerList.find((p) => p.id === id) ?? null;
      const { data, error } = await supabase.from('partners').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Partner | null;
    },
  });
  return { partner: query.data as Partner | null | undefined, isLoading: query.isLoading as boolean };
}

/**
 * "Register interest": records the lead, then tells ActiveCampaign so the
 * partner's automation follows up. The demo keeps it local.
 */
export function usePartnerInterest(partner: Pick<Partner, 'id' | 'name'> | null | undefined) {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const qc = useQueryClient();
  const key = ['connect-partner-interest', partner?.id, attendeeId];

  const status = useQuery({
    queryKey: key,
    enabled: !!partner && !!attendeeId,
    queryFn: async (): Promise<boolean> => {
      if (IS_DEMO) return false;
      const { count, error } = await supabase
        .from('partner_interest')
        .select('id', { count: 'exact', head: true })
        .eq('partner_id', partner!.id)
        .eq('attendee_id', attendeeId!);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
  });

  const register = useMutation({
    mutationFn: async () => {
      if (IS_DEMO) return;
      if (!partner || !attendeeId) throw new Error('Register for an event to contact partners.');
      const { error } = await supabase
        .from('partner_interest')
        // insert() is typed `never` by the hand-written schema (see alerts.tsx).
        .insert({ partner_id: partner.id, attendee_id: attendeeId } as never);
      // 23505: already registered — one row per attendee and partner.
      if (error && error.code !== '23505') throw error;
      // The row is the record of the lead; if the ActiveCampaign emit fails the
      // admin panel still lists it, so that error is not the attendee's to see.
      await supabase.functions.invoke('ac-event-emit', {
        body: {
          attendee_id: attendeeId,
          event_name: 'partner_interest',
          event_data: { partner_id: partner.id, partner_name: partner.name },
        },
      });
    },
    onSuccess: () => qc.setQueryData(key, true),
  });

  return { registered: status.data === true, register };
}
