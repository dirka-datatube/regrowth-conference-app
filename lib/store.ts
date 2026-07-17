import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Attendee } from '@/types/database';

type AppState = {
  session: Session | null;
  setSession: (s: Session | null) => void;
  attendee: Attendee | null;
  setAttendee: (a: Attendee | null) => void;
  // Session-scoped: stops the onboarding redirect loop after skip/finish.
  onboardingSeen: boolean;
  setOnboardingSeen: (v: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  attendee: null,
  setAttendee: (attendee) => set({ attendee }),
  onboardingSeen: false,
  setOnboardingSeen: (onboardingSeen) => set({ onboardingSeen }),
}));
