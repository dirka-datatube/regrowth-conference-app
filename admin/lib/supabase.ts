'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}

export const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? '00000000-0000-0000-0000-000000000001';

// Every admin mutation writes an audit row. Best-effort — failures don't
// block the underlying change.
export async function audit(action: string, entity: string, entityId?: string, payload?: unknown) {
  try {
    const sb = supabase();
    const { data: userRes } = await sb.auth.getUser();
    const { data: admin } = await sb
      .from('admin_users')
      .select('id')
      .eq('user_id', userRes.user?.id ?? '')
      .maybeSingle();
    await sb.from('audit_log').insert({
      admin_user_id: admin?.id ?? null,
      action,
      entity,
      entity_id: entityId ?? null,
      payload: (payload as object) ?? {},
    });
  } catch {
    // best effort
  }
}
