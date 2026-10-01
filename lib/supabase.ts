import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { IS_DEMO } from './demo';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!IS_DEMO && (!url || !anonKey)) {
  // Surface this loudly in dev — the app will not work without these.
  // Production builds should fail CI without them set.
  console.warn('Supabase env vars missing. Set EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

// The demo build reads canned data (lib/demo.ts) and needs no project, so it
// can be hosted without any keys: placeholders keep createClient from throwing.
export const supabase = createClient<Database>(url || (IS_DEMO ? 'https://demo.invalid' : ''), anonKey || (IS_DEMO ? 'demo' : ''), {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
