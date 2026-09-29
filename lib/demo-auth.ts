import type { Session } from '@supabase/supabase-js';
import { useAppStore, type AccountProfile } from '@/lib/store';
import { demoAttendee } from '@/lib/demo';

/**
 * Accounts in demo mode — no backend, one account: the demo attendee.
 *
 * Log in and Sign up accept any details and sign in as that account; Sign out
 * returns to Welcome. The demo opens signed in, except in a tab that has signed
 * out (so a reload stays on Welcome) and when a link opens one of the signed-out
 * screens directly, so every auth screen can be reached from a URL.
 */

const DEMO_USER_ID = demoAttendee.user_id ?? 'demo-user';
const [firstName, ...rest] = demoAttendee.name.split(' ');

export const demoProfile: AccountProfile = {
  id: DEMO_USER_ID,
  email: demoAttendee.email,
  first_name: firstName ?? null,
  last_name: rest.join(' ') || null,
  phone: null,
  photo_url: demoAttendee.photo_url,
  company: demoAttendee.company,
  role: demoAttendee.role,
};

// Only what the app reads from a session: the user's id, email and the name
// sign-up stores as user metadata.
const demoSession = {
  access_token: 'demo',
  refresh_token: 'demo',
  token_type: 'bearer',
  expires_in: 3600,
  user: {
    id: DEMO_USER_ID,
    email: demoAttendee.email,
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: { first_name: demoProfile.first_name, last_name: demoProfile.last_name },
    created_at: demoAttendee.created_at,
  },
} as Session;

const SIGNED_OUT_KEY = 'demo-signed-out';

/** The screens a link may open signed out (the (auth) group and the email-link landing). */
const SIGNED_OUT_PATHS = ['/welcome', '/login', '/signup', '/forgot', '/reset', '/check-email', '/auth-callback'];

function rememberSignedOut(signedOut: boolean) {
  try {
    if (signedOut) window.sessionStorage.setItem(SIGNED_OUT_KEY, '1');
    else window.sessionStorage.removeItem(SIGNED_OUT_KEY);
  } catch {
    // native, or storage blocked: the demo simply opens signed in next time
  }
}

/** Whether the demo should open signed in (see the note at the top). */
export function demoStartsSignedIn(): boolean {
  try {
    if (window.sessionStorage.getItem(SIGNED_OUT_KEY) === '1') return false;
    const path = window.location.pathname.replace(/\/+$/, '');
    return !SIGNED_OUT_PATHS.includes(path);
  } catch {
    return true;
  }
}

export function demoSignIn() {
  rememberSignedOut(false);
  const { setSession, setAttendee, setProfile } = useAppStore.getState();
  setSession(demoSession);
  setAttendee(demoAttendee);
  setProfile(demoProfile);
}

export function demoSignOut() {
  rememberSignedOut(true);
  useAppStore.getState().setSession(null);
}
