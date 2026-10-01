import { useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/lib/store';
import { IS_DEMO, DEMO_REGISTERED } from '@/lib/demo';
import { DEMO_CONNECTION_IDS, DEMO_EXTRA_PEOPLE, demoCardDetails } from '@/lib/demo-profile';
import { demoCommunityProfile, demoContact } from '@/lib/demo-connect';
import type { ListQuery } from '@/lib/hooks/useSavedSessions';
import type { ConnectionSource } from '@/types/database';

/**
 * Networking Connections (216:1028): the people the attendee has connected
 * with, and the business cards they have photographed but not yet matched to
 * an attendee (`pending_connections`, written by the business-card-ocr
 * function).
 *
 * Connecting itself happens elsewhere: a badge scanned on /scan, or opened by
 * a phone's camera, lands on /c/[token], which calls qr-connect and comes back
 * here; a profile's Connect button uses useCommunityConnect. So both lists
 * re-read whenever this screen mounts or comes back into view.
 */

export type ConnectionPerson = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  photo_url: string | null;
  email: string | null;
};

export type Connection = {
  id: string;
  source: ConnectionSource;
  created_at: string;
  /** Null when the other attendee has hidden their profile: RLS withholds the row. */
  person: ConnectionPerson | null;
};

/** What the business-card-ocr function reads off a card. */
export type CardDetails = { name?: string | null; company?: string | null; email?: string | null; phone?: string | null };

export type BusinessCard = {
  id: string;
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

/** The photo the card scanner sends — base64, as the function takes it. */
export type CardPhoto = { base64: string; mime: 'image/jpeg' | 'image/png' };

// The pre-v2 connections screen's key, so anything still invalidating it
// refreshes this list.
const connectionsKey = (attendeeId?: string) => ['my-connections', attendeeId] as const;
const cardsKey = (attendeeId?: string) => ['business-cards', attendeeId] as const;

type ConnectionRow = {
  id: string;
  source: ConnectionSource;
  created_at: string;
  attendee_a: string;
  a: ConnectionPerson | null;
  b: ConnectionPerson | null;
};

type PendingRow = {
  id: string;
  captured_name: string | null;
  captured_company: string | null;
  captured_email: string | null;
  captured_phone: string | null;
  created_at: string;
};

/**
 * The demo attendee's 24 connections: the Connect community's people where the
 * id is one of theirs (so the list and their profiles agree), then the extras.
 */
function demoConnectionList(): Connection[] {
  const day = 24 * 60 * 60 * 1000;
  return DEMO_CONNECTION_IDS.flatMap((id, i) => {
    const extra = DEMO_EXTRA_PEOPLE.find((p) => p.id === id);
    const person = demoCommunityProfile(id) ?? extra;
    if (!person) return [];
    const { name, role, company, photo_url } = person;
    return [
      {
        id: `demo-connection-${id}`,
        source: 'qr_scan' as const,
        created_at: new Date(Date.now() - (i + 1) * day).toISOString(),
        person: { id, name, role, company, photo_url, email: demoContact(id)?.email ?? extra?.email ?? null },
      },
    ];
  });
}

/**
 * Re-read when the screen comes back into view: people connect from /scan and
 * /c/[token] while this screen can stay mounted in the Profile stack. Demo data
 * never changes, and re-reading it would drop a demo card capture.
 */
function useRefetchOnReturn(refetch: () => Promise<unknown>) {
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      if (!IS_DEMO) void refetch();
    }, [refetch]),
  );
}

export function useConnections(): ListQuery<Connection> {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const query = useQuery({
    queryKey: connectionsKey(attendeeId),
    enabled: !!attendeeId,
    ...(IS_DEMO ? {} : { staleTime: 0 }),
    queryFn: async (): Promise<Connection[]> => {
      if (IS_DEMO) return DEMO_REGISTERED ? demoConnectionList() : [];
      const { data, error } = await supabase
        .from('connections')
        .select(
          `id, source, created_at, attendee_a,
           a:attendees!connections_attendee_a_fkey(id, name, role, company, photo_url, email),
           b:attendees!connections_attendee_b_fkey(id, name, role, company, photo_url, email)`,
        )
        .or(`attendee_a.eq.${attendeeId},attendee_b.eq.${attendeeId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as ConnectionRow[]).map((row) => ({
        id: row.id,
        source: row.source,
        created_at: row.created_at,
        person: row.attendee_a === attendeeId ? row.b : row.a,
      }));
    },
  });
  const refetch = query.refetch as () => Promise<unknown>;
  useRefetchOnReturn(refetch);
  return {
    data: query.data as Connection[] | undefined,
    isLoading: query.isLoading as boolean,
    isError: query.isError as boolean,
    refetch: () => void refetch(),
  };
}

/** Photographed cards still waiting to be matched to an attendee. */
export function useConnectionsCards(): ListQuery<BusinessCard> {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const query = useQuery({
    queryKey: cardsKey(attendeeId),
    enabled: !!attendeeId,
    // Demo cards exist only in the cache (captured on /me/card, see below), so
    // a demo refetch would lose them.
    staleTime: IS_DEMO ? Infinity : 0,
    queryFn: async (): Promise<BusinessCard[]> => {
      if (IS_DEMO) return [];
      const { data, error } = await supabase
        .from('pending_connections')
        .select('id, captured_name, captured_company, captured_email, captured_phone, created_at')
        .eq('initiator_id', attendeeId!)
        .is('resolved_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as PendingRow[]).map((r) => ({
        id: r.id,
        name: r.captured_name,
        company: r.captured_company,
        email: r.captured_email,
        phone: r.captured_phone,
        created_at: r.created_at,
      }));
    },
  });
  const refetch = query.refetch as () => Promise<unknown>;
  useRefetchOnReturn(refetch);
  return {
    data: query.data as BusinessCard[] | undefined,
    isLoading: query.isLoading as boolean,
    isError: query.isError as boolean,
    refetch: () => void refetch(),
  };
}

export type CardScan = {
  scan: (photo: CardPhoto) => void;
  /** What was read off the last card. */
  details: CardDetails | undefined;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
};

/**
 * Business card capture (/me/card): sends the photo to the business-card-ocr
 * function, which reads the details and files them as a pending connection.
 */
export function useConnectionsCardScan(): CardScan {
  const attendeeId = useAppStore((s) => s.attendee?.id);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (photo: CardPhoto): Promise<CardDetails> => {
      if (IS_DEMO) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return demoCardDetails;
      }
      if (!attendeeId) throw new Error('Your profile is still loading. Try again in a moment.');
      const { data, error } = await supabase.functions.invoke('business-card-ocr', {
        body: { initiator_id: attendeeId, image_base64: photo.base64, mime_type: photo.mime },
      });
      if (error) throw error;
      return (data as { extracted?: CardDetails } | null)?.extracted ?? {};
    },
    onSuccess: (details: CardDetails) => {
      if (!IS_DEMO) {
        qc.invalidateQueries({ queryKey: cardsKey(attendeeId) });
        return;
      }
      // Nothing is written in demo mode; show the capture on Connections anyway.
      const card: BusinessCard = {
        id: `demo-card-${Date.now()}`,
        name: details.name ?? null,
        company: details.company ?? null,
        email: details.email ?? null,
        phone: details.phone ?? null,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData(cardsKey(attendeeId), (old: BusinessCard[] | undefined) => [card, ...(old ?? [])]);
    },
  });
  return {
    scan: mutation.mutate as (photo: CardPhoto) => void,
    details: mutation.data as CardDetails | undefined,
    isPending: mutation.isPending as boolean,
    error: mutation.error as Error | null,
    reset: mutation.reset as () => void,
  };
}
