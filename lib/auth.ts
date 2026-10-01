import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { queryClient, queryPersister } from './queryClient';
import { useAppStore } from './store';
import { IS_DEMO } from './demo';
import { demoSignIn, demoSignOut } from './demo-auth';

/**
 * Accounts: email and password, open to anyone (client decision, 2026-09 —
 * "make it easy for people to sign up and log in"). Most people use their
 * company email.
 *
 * An account is a person. Registering for an event (paid on the website) is
 * what unlocks that event; an account without a registration sees the app in
 * its "not registered" state. Creating an account runs the auth.users trigger
 * (handle_new_auth_user, migration 20260929000100), which writes the profile
 * and links a registration already made with that email; one made later is
 * linked when it arrives.
 *
 * The email sign-in link the app launched with stays as the fallback ("Email
 * me a sign-in link instead"). It is also the way in for accounts from before
 * passwords, which have none until they reset one. Every email link lands on
 * /auth-callback, which completeAuthRedirect() finishes.
 *
 * Screens never see Supabase's errors: everything here throws an
 * AuthFlowError whose message is written for the person.
 *
 * Demo mode never reaches Supabase: any details sign in as the demo account
 * (lib/demo-auth.ts).
 */

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type AuthProblem =
  | 'wrong-credentials'
  | 'unconfirmed'
  | 'account-exists'
  | 'weak-password'
  | 'same-password'
  | 'bad-email'
  | 'undeliverable'
  | 'rate-limited'
  | 'signups-closed'
  | 'link-expired'
  | 'offline'
  | 'unknown';

const MESSAGES: Record<AuthProblem, string> = {
  'wrong-credentials':
    'That email and password don’t match. Try again, or use “Forgot your password?” to set a new one.',
  unconfirmed: 'Please confirm your email first. Open the link we sent you, or we can send it again.',
  'account-exists': 'There’s already an account with this email. Log in instead, or reset your password.',
  'weak-password': 'Choose a stronger password: at least 8 characters, mixing letters, numbers and symbols.',
  'same-password': 'That’s your current password. Choose a new one.',
  'bad-email': 'That email address doesn’t look right. Check it and try again.',
  undeliverable: 'We couldn’t send an email to that address. Check it, or contact the REGROWTH team.',
  'rate-limited': 'Too many attempts. Please wait a minute, then try again.',
  'signups-closed': 'New accounts are paused right now. Please contact the REGROWTH team.',
  'link-expired': 'This link has expired or has already been used. Request a new one.',
  offline: 'We can’t reach REGROWTH right now. Check your connection and try again.',
  unknown: 'Something went wrong on our side. Please try again in a moment.',
};

export class AuthFlowError extends Error {
  constructor(
    readonly problem: AuthProblem,
    message: string = MESSAGES[problem],
  ) {
    super(message);
    this.name = 'AuthFlowError';
  }
}

/** Any thrown value as an AuthFlowError, for a screen's catch block. */
export function toAuthFlowError(error: unknown): AuthFlowError {
  return error instanceof AuthFlowError ? error : new AuthFlowError(classify(error));
}

const LINK_CODES = [
  'otp_expired',
  'flow_state_expired',
  'flow_state_not_found',
  'bad_code_verifier',
  'session_not_found',
  'session_expired',
  'refresh_token_not_found',
  'refresh_token_already_used',
];

// Supabase auth errors carry a stable `code`; the message is checked as well
// for servers and failure paths that send none.
function classify(error: unknown): AuthProblem {
  const e = (error ?? {}) as { code?: unknown; status?: unknown; name?: unknown; message?: unknown };
  const code = typeof e.code === 'string' ? e.code : '';
  const status = typeof e.status === 'number' ? e.status : 0;
  const name = typeof e.name === 'string' ? e.name : '';
  const message = typeof e.message === 'string' ? e.message.toLowerCase() : '';

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) return 'wrong-credentials';
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) return 'unconfirmed';
  if (code === 'user_already_exists' || code === 'email_exists' || message.includes('already registered')) {
    return 'account-exists';
  }
  if (code === 'weak_password' || name === 'AuthWeakPasswordError') return 'weak-password';
  if (code === 'same_password') return 'same-password';
  if (code.startsWith('over_') || status === 429 || message.includes('rate limit') || message.includes('security purposes')) {
    return 'rate-limited';
  }
  if (code === 'email_address_invalid' || (code === 'validation_failed' && message.includes('email'))) return 'bad-email';
  if (code === 'email_address_not_authorized') return 'undeliverable';
  if (code === 'signup_disabled' || code === 'email_provider_disabled' || message.includes('signups not allowed')) {
    return 'signups-closed';
  }
  if (LINK_CODES.includes(code) || name === 'AuthSessionMissingError' || message.includes('expired')) return 'link-expired';
  if (name === 'AuthRetryableFetchError' || /network|failed to fetch|load failed/.test(message)) return 'offline';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Validation — the same rules in demo and real mode
// ---------------------------------------------------------------------------

/** Must match Supabase Auth → Providers → Email → minimum password length. */
export const PASSWORD_MIN_LENGTH = 8;
// Supabase hashes with bcrypt, which rejects passwords over 72 bytes.
const PASSWORD_MAX_LENGTH = 72;

export type FieldProblems<K extends string> = Partial<Record<K, string>>;

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase();
}

export function emailProblem(email: string): string | undefined {
  if (!email.trim()) return 'Enter your email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return 'Enter a valid email address';
  return undefined;
}

function newPasswordProblem(password: string): string | undefined {
  if (!password) return 'Choose a password';
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Use ${PASSWORD_MAX_LENGTH} characters or fewer`;
  return undefined;
}

function confirmProblem(password: string, confirm: string): string | undefined {
  if (!confirm) return 'Confirm your password';
  if (confirm !== password) return 'Passwords don’t match';
  return undefined;
}

// Loose on purpose: people type numbers every which way. 8–15 digits covers
// Australian and international numbers (E.164 allows 15).
function phoneProblem(phone: string): string | undefined {
  if (!phone.trim()) return undefined;
  const digits = phone.replace(/\D/g, '').length;
  if (!/^\+?[\d\s().-]+$/.test(phone.trim()) || digits < 8 || digits > 15) return 'Enter a valid phone number';
  return undefined;
}

/** Drops the keys whose value is undefined, so `Object.keys(problems).length` counts real problems. */
function onlyProblems<K extends string>(problems: Record<K, string | undefined>): FieldProblems<K> {
  return Object.fromEntries(Object.entries(problems).filter(([, v]) => v)) as FieldProblems<K>;
}

export function logInProblems(email: string, password: string) {
  return onlyProblems({ email: emailProblem(email), password: password ? undefined : 'Enter your password' });
}

export type SignUpDetails = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/** Phone is optional: the comp asks for it, but nothing needs it to sign someone up. */
export function signUpProblems(d: SignUpDetails) {
  return onlyProblems<keyof SignUpDetails>({
    firstName: d.firstName.trim() ? undefined : 'Enter your first name',
    lastName: d.lastName.trim() ? undefined : 'Enter your last name',
    phone: phoneProblem(d.phone),
    email: emailProblem(d.email),
    password: newPasswordProblem(d.password),
    confirmPassword: confirmProblem(d.password, d.confirmPassword),
  });
}

export function newPasswordProblems(password: string, confirmPassword: string) {
  return onlyProblems({
    password: newPasswordProblem(password),
    confirmPassword: confirmProblem(password, confirmPassword),
  });
}

// ---------------------------------------------------------------------------
// Remember me
// ---------------------------------------------------------------------------

const REMEMBER_KEY = 'regrowth.remember-me';
const STARTED_COOKIE = 'regrowth_started';
let startedThisLaunch = false;

/** The Log in checkbox. Remembers unless the person unticked it last time. */
export async function getRememberMe(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(REMEMBER_KEY)) !== '0';
  } catch {
    return true;
  }
}

async function setRememberMe(remember: boolean) {
  try {
    await AsyncStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  } catch {
    // Storage unavailable: the choice falls back to remembering.
  }
}

// A session cookie on the web: the browser drops it when it quits, so its
// absence means this is the first start since the browser opened. Natively, the
// JS runtime is the session. With cookies blocked every start counts as first.
function browserSessionStarted() {
  if (Platform.OS !== 'web') return startedThisLaunch;
  try {
    return document.cookie.split('; ').includes(`${STARTED_COOKIE}=1`);
  } catch {
    return true;
  }
}

function markBrowserSessionStarted() {
  startedThisLaunch = true;
  if (Platform.OS !== 'web') return;
  try {
    document.cookie = `${STARTED_COOKIE}=1; path=/; SameSite=Lax`;
  } catch {
    // cookies blocked
  }
}

/**
 * "Remember me". Supabase always keeps the session on the device
 * (lib/supabase.ts persists it), so an unticked box is enforced at start-up:
 * the first start of a browser session (natively, of the app) drops the stored
 * session before anything uses it. Reloads and new tabs keep it.
 *
 * Call once, at start-up. True when this start drops the stored session.
 */
export async function startupForgetsSession(): Promise<boolean> {
  const firstStart = !browserSessionStarted();
  markBrowserSessionStarted();
  return firstStart && !(await getRememberMe());
}

/** Start-up for real accounts: applies Remember me. True when it signed the stored session out. */
export async function applyRememberMe(): Promise<boolean> {
  if (!(await startupForgetsSession())) return false;
  await endSupabaseSession();
  await forgetAccountData();
  return true;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// This device only — the default ('global') would also sign the person out on
// their other devices. The call tells the server first, so a slow network must
// not hold up whoever is waiting: the app treats the person as signed out at
// once and the stored session goes when the call settles.
async function endSupabaseSession() {
  await Promise.race([supabase.auth.signOut({ scope: 'local' }), wait(3000)]);
}

// React Query's cache is persisted to storage: cleared, or the next person to
// sign in on this device would briefly see the last one's data.
async function clearCachedData() {
  queryClient.clear();
  try {
    await queryPersister.removeClient();
  } catch {
    // Storage unavailable: nothing was persisted.
  }
}

/** Drops the account's data from this device: the store and the query cache. */
export async function forgetAccountData() {
  useAppStore.getState().setSession(null);
  await clearCachedData();
}

/** Where every auth email sends people back to. Must be in Supabase Auth's redirect allow-list. */
export function authRedirectUrl() {
  return Linking.createURL('/auth-callback');
}

export async function signIn({ email, password, remember }: { email: string; password: string; remember: boolean }) {
  await setRememberMe(remember);
  if (IS_DEMO) return demoSignIn();
  const { data, error } = await supabase.auth.signInWithPassword({ email: normaliseEmail(email), password });
  if (error) throw toAuthFlowError(error);
  useAppStore.getState().setSession(data.session);
}

/**
 * Creates the account. `confirmEmail` is true when Supabase is waiting for the
 * address to be confirmed ("Confirm email", which must stay on: registrations
 * are linked by email). Otherwise the person is signed in.
 */
export async function signUp(details: SignUpDetails): Promise<{ confirmEmail: boolean }> {
  await setRememberMe(true);
  if (IS_DEMO) {
    demoSignIn();
    return { confirmEmail: false };
  }
  const { data, error } = await supabase.auth.signUp({
    email: normaliseEmail(details.email),
    password: details.password,
    options: {
      // Read by handle_new_auth_user() into the new profile.
      data: {
        first_name: details.firstName.trim(),
        last_name: details.lastName.trim(),
        phone: details.phone.trim() || null,
      },
      emailRedirectTo: authRedirectUrl(),
    },
  });
  if (error) throw toAuthFlowError(error);
  // With confirmations on, Supabase answers a sign-up for an address that
  // already has an account with an identity-less user instead of an error, so
  // outsiders can't probe addresses. The form says so plainly instead: the
  // person needs to know to log in.
  if (data.user && data.user.identities?.length === 0) throw new AuthFlowError('account-exists');
  if (data.session) useAppStore.getState().setSession(data.session);
  return { confirmEmail: !data.session };
}

/** The email sign-in link. It can open an account too, so someone the website registered gets in without a password. */
export async function sendMagicLink(email: string) {
  if (IS_DEMO) return;
  const { error } = await supabase.auth.signInWithOtp({
    email: normaliseEmail(email),
    options: { emailRedirectTo: authRedirectUrl(), shouldCreateUser: true },
  });
  if (error) throw toAuthFlowError(error);
}

/** Supabase answers the same whether or not the address has an account, and so does the app. */
export async function sendPasswordReset(email: string) {
  if (IS_DEMO) return;
  const { error } = await supabase.auth.resetPasswordForEmail(normaliseEmail(email), {
    redirectTo: authRedirectUrl(),
  });
  if (error) throw toAuthFlowError(error);
}

export async function resendConfirmation(email: string) {
  if (IS_DEMO) return;
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normaliseEmail(email),
    options: { emailRedirectTo: authRedirectUrl() },
  });
  if (error) throw toAuthFlowError(error);
}

/** Sets a new password for the signed-in account (after a recovery or invite link). */
export async function updatePassword(password: string) {
  if (IS_DEMO) return demoSignIn();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw toAuthFlowError(error);
}

/**
 * Signs out on this device and forgets what the app held for the account. The
 * layouts' session guards then land on Welcome.
 */
export async function signOut() {
  if (IS_DEMO) demoSignOut();
  else await endSupabaseSession();
  await forgetAccountData();
}

// ---------------------------------------------------------------------------
// Email links
// ---------------------------------------------------------------------------

function currentWebUrl() {
  return Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : null;
}

// An email link's tokens arrive in the URL fragment. On the web the address is
// also captured as the app loads, before routing can rewrite it. Natively the
// router keeps only a deep link's path and query, so the whole URL is kept
// here: the latest link to arrive while the app is open, else the launch URL.
const STARTUP_URL = currentWebUrl();
let latestNativeLink: string | null = null;
if (Platform.OS !== 'web') {
  Linking.addEventListener('url', ({ url }) => {
    latestNativeLink = url;
  });
}

async function nativeLinkUrl() {
  if (Platform.OS === 'web') return null;
  return latestNativeLink ?? (await Linking.getInitialURL());
}

/** Query and fragment parameters of the given URLs; earlier URLs win. */
function linkParams(urls: (string | null | undefined)[]): Record<string, string> {
  const params: Record<string, string> = {};
  for (const url of urls) {
    if (!url) continue;
    const hashAt = url.indexOf('#');
    const beforeHash = hashAt === -1 ? url : url.slice(0, hashAt);
    const fragment = hashAt === -1 ? '' : url.slice(hashAt + 1);
    const queryAt = beforeHash.indexOf('?');
    const query = queryAt === -1 ? '' : beforeHash.slice(queryAt + 1);
    for (const part of [query, fragment]) {
      new URLSearchParams(part).forEach((value, key) => {
        if (!(key in params)) params[key] = value;
      });
    }
  }
  return params;
}

/**
 * Finishes an email link on /auth-callback — sign-up confirmation, the sign-in
 * link, password recovery, an invitation — and signs the person in. Reads the
 * link in whichever form it arrived: tokens in the fragment (this client's
 * implicit flow), a PKCE `code`, or a `token_hash` from a customised email
 * template. `routeParams` are the screen's; the full link URL is read here.
 *
 * Resolves 'set-password' for recovery and invite links, which go on to choose
 * a password (the PASSWORD_RECOVERY auth event or `type=recovery`), else 'app'.
 */
export async function completeAuthRedirect(
  routeParams: Record<string, string | string[] | undefined>,
): Promise<'app' | 'set-password'> {
  const flat = Object.fromEntries(
    Object.entries(routeParams).flatMap(([key, value]) => {
      const first = Array.isArray(value) ? value[0] : value;
      return first ? [[key, first]] : [];
    }),
  ) as Record<string, string>;
  const { '#': fragment, ...query } = flat;
  const params = linkParams([
    `?${new URLSearchParams(query)}${fragment ? `#${fragment}` : ''}`,
    await nativeLinkUrl(),
    currentWebUrl(),
    STARTUP_URL?.includes('/auth-callback') ? STARTUP_URL : null,
  ]);
  let setPassword = params.type === 'recovery' || params.type === 'invite';

  if (IS_DEMO) {
    demoSignIn();
    return setPassword ? 'set-password' : 'app';
  }

  const previousUserId = useAppStore.getState().session?.user.id;

  if (params.error || params.error_code || params.error_description) {
    // A link opened twice in one browser: the first visit signed the person in.
    const { data } = await supabase.auth.getSession();
    if (data.session && !setPassword) {
      useAppStore.getState().setSession(data.session);
      return 'app';
    }
    throw toAuthFlowError({ code: params.error_code, message: params.error_description ?? params.error });
  }

  const { data: listener } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') setPassword = true;
  });

  try {
    let session: Session | null;
    if (params.code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (error) throw error;
      session = data.session;
    } else if (params.token_hash && params.type) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: params.token_hash,
        type: params.type as EmailOtpType,
      });
      if (error) throw error;
      session = data.session;
    } else if (params.access_token && params.refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (error) throw error;
      session = data.session;
    } else {
      // Nothing left in the link — opened a second time, say. Carry on if it
      // already signed the person in.
      session = (await supabase.auth.getSession()).data.session;
    }
    if (!session) throw new AuthFlowError('link-expired');
    // Someone else's link opened where another account was signed in.
    if (previousUserId && previousUserId !== session.user.id) await clearCachedData();
    useAppStore.getState().setSession(session);
    return setPassword ? 'set-password' : 'app';
  } catch (error) {
    throw toAuthFlowError(error);
  } finally {
    listener.subscription.unsubscribe();
  }
}
