import { supabase } from './supabase';
import * as Linking from 'expo-linking';

// Magic-link login — attendees enter email, tap link in inbox, app opens
// already authenticated. No password ever (per spec §6).
//
// shouldCreateUser is true, but the DB trigger on auth.users
// (handle_new_auth_user, migration 20260101000200) rejects any email that
// isn't already in attendees/admin_users and links user_id on success —
// registration stays owned by the website + ActiveCampaign.
export class UnregisteredEmailError extends Error {
  constructor() {
    super('UNREGISTERED_EMAIL');
  }
}

export async function sendMagicLink(email: string) {
  const redirectTo = Linking.createURL('/auth-callback');
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });
  if (error) {
    // The linking trigger raises REGROWTH_UNREGISTERED_EMAIL, which GoTrue
    // surfaces as a generic "Database error saving new user".
    if (/database error|unregistered/i.test(error.message)) {
      throw new UnregisteredEmailError();
    }
    throw error;
  }
}

export async function signOut() {
  await supabase.auth.signOut();
}
