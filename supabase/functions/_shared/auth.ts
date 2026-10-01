// Identity helpers: derive the caller from their JWT instead of trusting
// IDs in the request body (Sprint 3 security fix).
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

export async function requireUser(req: Request, supabase: SupabaseClient) {
  const header = req.headers.get('authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('UNAUTHENTICATED');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('UNAUTHENTICATED');
  return data.user;
}

export async function requireAttendee(req: Request, supabase: SupabaseClient) {
  const user = await requireUser(req, supabase);
  const { data } = await supabase
    .from('attendees')
    .select('id, event_id, email, name')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!data) throw new Error('NOT_AN_ATTENDEE');
  return { user, attendee: data };
}

export async function adminForUser(userId: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from('admin_users')
    .select('id, role, event_ids')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

// The service key and anon key are cron/internal callers; user JWTs carry
// role "authenticated". Jobs endpoints reject end-user tokens.
export function jwtRole(req: Request): string | null {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role ?? null;
  } catch {
    return null;
  }
}
