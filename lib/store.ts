import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Attendee, Profile } from '@/types/database';

/**
 * The signed-in person (profiles, migration 20260929000100). Every account has
 * one, registered or not, so an account without a registration still has a
 * name. Loaded by useProfile() in the tabs layout.
 */
export type AccountProfile = Pick<
  Profile,
  'id' | 'email' | 'first_name' | 'last_name' | 'phone' | 'photo_url' | 'company' | 'role'
>;

type AppState = {
  session: Session | null;
  /**
   * A different account, or none, also drops the previous account's attendee
   * and profile, so the next person to sign in on this device never sees them.
   */
  setSession: (s: Session | null) => void;
  attendee: Attendee | null;
  setAttendee: (a: Attendee | null) => void;
  profile: AccountProfile | null;
  setProfile: (p: AccountProfile | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  session: null,
  setSession: (session) =>
    set((state) =>
      session && session.user.id === state.session?.user.id
        ? { session }
        : { session, attendee: null, profile: null },
    ),
  attendee: null,
  setAttendee: (attendee) => set({ attendee }),
  profile: null,
  setProfile: (profile) => set({ profile }),
}));
