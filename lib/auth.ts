import { supabase } from './supabase';
import * as Linking from 'expo-linking';

// Magic-link login — attendees enter email, tap link in inbox, app opens
// already authenticated. No password ever (per spec §6).
export async function sendMagicLink(email: string) {
  const redirectTo = Linking.createURL('/auth-callback');
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: false, // attendees must exist already (synced from AC)
    },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
