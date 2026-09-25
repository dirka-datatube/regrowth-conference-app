// Demo mode — set EXPO_PUBLIC_DEMO_MODE=true in .env to bypass Supabase + auth
// and view the app with canned data. Strictly for visual previews — none of
// the writes (bids, questions, notes, connections) actually persist.

import type {
  Attendee,
  Speaker,
  Session,
  Partner,
  Faq,
  AuctionItem,
  Note,
  Question,
  GalleryItem,
  PodcastEpisode,
} from '@/types/database';
import type { Registration } from '@/lib/registrations';

export const IS_DEMO = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

/**
 * Demo previews the registered state by default. Open any URL with
 * `?registered=0` for the not-registered one — Home and Events swap to GET
 * STARTED and the registrations-open banner, and Connect locks its
 * communities. The choice holds for the browser tab; `?registered=1` resets it.
 */
function readDemoRegistered(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('registered');
    if (param !== null) window.sessionStorage.setItem('demo-registered', param);
    return (param ?? window.sessionStorage.getItem('demo-registered')) !== '0';
  } catch {
    return true; // native, or storage blocked
  }
}

export const DEMO_REGISTERED = IS_DEMO && readDemoRegistered();

const EVENT_ID = '00000000-0000-0000-0000-000000000001';
const ME_ID = '11111111-1111-1111-1111-111111111111';
const STUDY_TOUR_ID = '00000000-0000-0000-0000-000000000002';

export const demoAttendee: Attendee = {
  id: ME_ID,
  event_id: EVENT_ID,
  user_id: 'demo-user',
  ac_contact_id: null,
  email: 'kylie@regrowth.au',
  name: 'Kylie Walsh',
  company: 'REGROWTH',
  role: 'Founder & Director',
  photo_url: null,
  bio: 'Founder of REGROWTH and host of the Impact & Influence Podcast.',
  interests: ['leadership', 'coaching', 'sales'],
  visibility: 'public',
  dietary: 'No nuts please',
  qr_token: 'demoqr12345678',
  push_token: null,
  notification_prefs: {
    session_starting: true,
    dont_miss: true,
    people_to_meet: true,
    partner_spotlight: true,
    auction: true,
    admin_announcement: true,
  } as Attendee['notification_prefs'],
  checked_in_at: null,
  last_seen_at: null,
  ticket_tier: 'VIP Pass',
  registration_status: 'confirmed',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Kylie holds both products, as on My Tickets (146:1906). A real account can
// hold only one until Sprint 08 — see lib/registrations.ts.
export const demoRegistrations: Registration[] = [
  { eventId: EVENT_ID, ticketTier: 'VIP Pass', status: 'confirmed', qrToken: 'demoqr12345678' },
  { eventId: STUDY_TOUR_ID, ticketTier: 'VIP Delegate', status: 'confirmed', qrToken: 'demoqr87654321' },
];

const today = new Date();
function at(dayOffset: number, hour: number, minute = 0) {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const demoSpeakers: Speaker[] = [
  {
    id: 's1', event_id: EVENT_ID, name: 'Kylie Walsh',
    title: 'Founder', company: 'REGROWTH',
    bio: 'Founder of REGROWTH and host of the Impact & Influence Podcast. Coach to top-performing real estate teams across Australia.',
    headshot_url: null, linkedin_url: 'https://linkedin.com',
    tags: ['leadership', 'keynote'], display_order: 0,
    created_at: '', updated_at: '',
  },
  {
    id: 's2', event_id: EVENT_ID, name: 'Sarah Chen',
    title: 'Head of Growth', company: 'Acme Realty',
    bio: 'Award-winning agent and coach, specialising in mindset and team performance.',
    headshot_url: null, linkedin_url: null,
    tags: ['sales', 'mindset'], display_order: 1,
    created_at: '', updated_at: '',
  },
  {
    id: 's3', event_id: EVENT_ID, name: 'Marcus Reid',
    title: 'CEO', company: 'PropTech AU',
    bio: 'Building the next generation of tools for top performers.',
    headshot_url: null, linkedin_url: null,
    tags: ['tech', 'innovation'], display_order: 2,
    created_at: '', updated_at: '',
  },
];

export const demoSessions = [
  {
    id: 'sess1', event_id: EVENT_ID,
    title: 'Welcome to Navigate 2027',
    abstract: 'Kylie opens the conference with a vision for what we can build together.',
    start_at: at(0, 9), end_at: at(0, 10),
    room: 'Main Stage', type: 'keynote' as const, tags: [],
    capacity: null, is_published: true,
    created_at: '', updated_at: '',
    speakers: [{ speaker: { id: 's1', name: 'Kylie Walsh', headshot_url: null, title: 'Founder' } }],
  },
  {
    id: 'sess2', event_id: EVENT_ID,
    title: 'The Mindset of Top Performers',
    abstract: 'A session on the inner game of high performance in real estate.',
    start_at: at(0, 10, 30), end_at: at(0, 11, 30),
    room: 'Studio A', type: 'panel' as const, tags: ['mindset'],
    capacity: null, is_published: true,
    created_at: '', updated_at: '',
    speakers: [{ speaker: { id: 's2', name: 'Sarah Chen', headshot_url: null, title: 'Head of Growth' } }],
  },
  {
    id: 'sess3', event_id: EVENT_ID,
    title: 'Lunch',
    abstract: 'Lunch in the foyer.',
    start_at: at(0, 12), end_at: at(0, 13, 30),
    room: 'Foyer', type: 'meal' as const, tags: [],
    capacity: null, is_published: true,
    created_at: '', updated_at: '',
    speakers: [],
  },
  {
    id: 'sess4', event_id: EVENT_ID,
    title: 'Building Your Tech Stack',
    abstract: 'How to choose tools that compound over time.',
    start_at: at(0, 14), end_at: at(0, 15),
    room: 'Studio B', type: 'workshop' as const, tags: ['tech'],
    capacity: null, is_published: true,
    created_at: '', updated_at: '',
    speakers: [{ speaker: { id: 's3', name: 'Marcus Reid', headshot_url: null, title: 'CEO' } }],
  },
  {
    id: 'sess5', event_id: EVENT_ID,
    title: 'Closing Keynote: What\'s next',
    abstract: 'We close out the day with a vision for the year ahead.',
    start_at: at(1, 16), end_at: at(1, 17),
    room: 'Main Stage', type: 'keynote' as const, tags: [],
    capacity: null, is_published: true,
    created_at: '', updated_at: '',
    speakers: [{ speaker: { id: 's1', name: 'Kylie Walsh', headshot_url: null, title: 'Founder' } }],
  },
];

export const demoPartners: Partner[] = [
  {
    id: 'p1', event_id: EVENT_ID, name: 'CommBank',
    logo_url: null,
    description: 'Banking partner of REGROWTH. Real estate banking specialists on-site all week.',
    solutions_content: 'Tailored finance solutions for real estate professionals.',
    tags: ['banking'], contact_email: 'partners@cba.example', website_url: 'https://commbank.com.au',
    display_order: 0, is_featured: true,
    created_at: '', updated_at: '',
  },
  {
    id: 'p2', event_id: EVENT_ID, name: 'PropTech AU',
    logo_url: null,
    description: 'CRM and automation built for top-performing agents.',
    solutions_content: 'AI-powered CRM tailored to real estate workflows.',
    tags: ['tech', 'marketing'], contact_email: 'hello@proptech.example', website_url: null,
    display_order: 1, is_featured: false,
    created_at: '', updated_at: '',
  },
  {
    id: 'p3', event_id: EVENT_ID, name: 'Recruit360',
    logo_url: null,
    description: 'Talent acquisition platform for growing real estate teams.',
    solutions_content: 'Source, screen, and onboard agents at scale.',
    tags: ['recruitment'], contact_email: 'hi@recruit360.example', website_url: null,
    display_order: 2, is_featured: false,
    created_at: '', updated_at: '',
  },
];

export const demoOtherAttendees = [
  { id: 'a2', name: 'James Patel', role: 'Director', company: 'Patel Realty', photo_url: null, interests: ['leadership', 'tech'] },
  { id: 'a3', name: 'Olivia Brown', role: 'Principal', company: 'Brown & Co', photo_url: null, interests: ['coaching', 'mindset'] },
  { id: 'a4', name: 'Daniel Kim', role: 'Sales Lead', company: 'Kim Group', photo_url: null, interests: ['sales', 'tech'] },
  { id: 'a5', name: 'Hannah Liu', role: 'Marketing Lead', company: 'Liu Property', photo_url: null, interests: ['marketing'] },
];

export const demoFaqs: Faq[] = [
  { id: 'f1', event_id: EVENT_ID, question: 'Where is the venue?', answer: 'Crown Towers, Perth.', order_index: 1, created_at: '' },
  { id: 'f2', event_id: EVENT_ID, question: 'What\'s the dress code?', answer: 'Smart casual unless noted otherwise per session.', order_index: 2, created_at: '' },
  { id: 'f3', event_id: EVENT_ID, question: 'Will sessions be recorded?', answer: 'Yes — recordings are released to attendees after the conference.', order_index: 3, created_at: '' },
];

export const demoAuction: AuctionItem[] = [
  {
    id: 'auc1', event_id: EVENT_ID, name: 'VIP Coaching Day with Kylie',
    description: 'A full day of 1:1 coaching with Kylie Walsh.',
    photo_url: null, starting_bid: 5000, current_bid: 7500,
    current_bidder_id: null, ends_at: at(2, 17), is_open: true,
    winner_id: null, created_at: '', updated_at: '',
  },
  {
    id: 'auc2', event_id: EVENT_ID, name: 'Margaret River Wine Experience',
    description: 'Two-night stay for two with private vineyard tours.',
    photo_url: null, starting_bid: 1500, current_bid: 2200,
    current_bidder_id: null, ends_at: at(2, 17), is_open: true,
    winner_id: null, created_at: '', updated_at: '',
  },
];

export const demoEvents = [
  {
    id: EVENT_ID,
    name: 'Navigate 2027',
    subtitle: 'REGROWTH Annual Conference',
    // The v2 comps date Navigate 15–17 March 2027 (Home, Agenda). Fixture
    // only — the admin panel owns the real dates.
    start_date: '2027-03-15',
    end_date: '2027-03-17',
    venue: 'Crown Towers, Perth',
    hero_url: null,
  },
  {
    id: STUDY_TOUR_ID,
    name: 'REGROWTH Study Tour 2027',
    subtitle: 'A bespoke world-class client experience',
    start_date: '2027-06-02',
    end_date: '2027-06-09',
    venue: 'Melbourne',
    hero_url: null,
  },
];

export const demoNotes: Array<Note & { session: { id: string; title: string; start_at: string } | null }> = [
  {
    id: 'n1', attendee_id: ME_ID, session_id: 'sess1', event_id: EVENT_ID,
    title: 'Consistency beats intensity',
    pinned: true, important: true, reminder_at: at(1, 9),
    body: 'Key idea: we win when we show up consistently for our team. The panel kept coming back to rhythm over heroics — weekly one-on-ones that never move, a Monday number everyone can recite, and a follow-up habit that survives a bad week.',
    ai_summary: 'A reflection on consistency, leadership, and building trust within real estate teams.',
    ai_summary_generated_at: new Date().toISOString(),
    follow_up_questions: ['How do we measure consistency?', 'What does showing up look like in practice?'],
    created_at: '', updated_at: new Date().toISOString(),
    session: { id: 'sess1', title: 'Welcome to Navigate 2027', start_at: at(0, 9) },
  },
  {
    id: 'n2', attendee_id: ME_ID, session_id: null, event_id: EVENT_ID,
    title: 'Referral loop worth stealing',
    pinned: false, important: true, reminder_at: null,
    body: 'Ask for the referral at the appraisal, not at settlement. By settlement the emotional peak has passed and the vendor has moved on. Worth testing across the office next quarter and measuring conversion either side.',
    ai_summary: null, ai_summary_generated_at: null, follow_up_questions: [],
    created_at: '', updated_at: at(0, 14),
    session: null,
  },
  {
    id: 'n3', attendee_id: ME_ID, session_id: null, event_id: STUDY_TOUR_ID,
    title: 'Melbourne office fit-out',
    pinned: false, important: false, reminder_at: at(2, 10),
    body: 'The open plan works because the meeting rooms are glass and bookable from a phone. No hot desking for agents — they keep a fixed desk, which is what kept retention up after the move.',
    ai_summary: null, ai_summary_generated_at: null, follow_up_questions: [],
    created_at: '', updated_at: at(-1, 16),
    session: null,
  },
  {
    id: 'n4', attendee_id: ME_ID, session_id: 'sess2', event_id: EVENT_ID,
    title: 'Question for the closing panel',
    pinned: false, important: false, reminder_at: null,
    body: 'What is the first thing you cut when the market turns, and what did cutting it cost you the following year?',
    ai_summary: null, ai_summary_generated_at: null, follow_up_questions: [],
    created_at: '', updated_at: at(-1, 11),
    session: { id: 'sess2', title: 'Closing panel', start_at: at(1, 16) },
  },
];

export const demoQuestions: Array<Question & { attendee: { name: string } | null }> = [
  {
    id: 'q1', event_id: EVENT_ID, session_id: null, speaker_id: null,
    attendee_id: 'a2', body: 'What\'s the one thing top performers are doing differently in 2027?',
    anonymous: false, status: 'approved', upvotes: 24,
    answered_at: null, moderation_note: null, created_at: '',
    attendee: { name: 'James Patel' },
  },
  {
    id: 'q2', event_id: EVENT_ID, session_id: null, speaker_id: null,
    attendee_id: 'a3', body: 'How do you balance personal coaching practice with running a brokerage?',
    anonymous: true, status: 'approved', upvotes: 18,
    answered_at: null, moderation_note: null, created_at: '',
    attendee: null,
  },
];

export const demoGallery: GalleryItem[] = [];
export const demoPodcast: PodcastEpisode[] = [
  {
    id: 'ep1', event_id: EVENT_ID, title: 'Episode 42: The Mindset of Growth',
    description: 'A conversation with Sarah Chen on building resilience in tough markets.',
    audio_url: 'https://example.com/ep42.mp3', episode_url: 'https://example.com/ep42',
    duration_seconds: 2400, published_at: at(-7, 9),
  },
];

// The seven cards on Alerts (71:540). The fourth sits under the countdown
// dialog in the comp; tapping it opens that dialog here.
export const demoAlerts = [
  {
    notification: {
      id: 'noti1', type: 'registration_confirmed',
      title: 'Registration Confirmed',
      body: 'Your registration for the Study Tour has been confirmed. We’re excited to have you join us.',
    },
  },
  {
    notification: {
      id: 'noti2', type: 'action_required',
      title: 'Action Required',
      body: 'Complete Your Profile - add your photo, company details and interests to help other attendees connect with you.',
    },
  },
  {
    notification: {
      id: 'noti3', type: 'welcome',
      title: 'Welcome To The Event App',
      body: 'Explore the agenda, speakers and attendee directory to get the most from your experience.',
    },
  },
  {
    notification: {
      id: 'noti4', type: 'countdown',
      title: 'Only 5 Days To Go!',
      body: 'Your Study Tour is almost here. Take a moment to review the agenda and event details before you arrive.',
      data: { event_id: STUDY_TOUR_ID },
    },
  },
  {
    notification: {
      id: 'noti5', type: 'speaker_added',
      title: 'New Speaker Added',
      body: 'A new keynote speaker has been added to the program. Check out their session and add it to your schedule.',
    },
  },
  {
    notification: {
      id: 'noti6', type: 'agenda_updated',
      title: 'Agenda Updated',
      body: 'The latest event agenda is now available. Review any changes and plan your sessions.',
    },
  },
  {
    notification: {
      id: 'noti7', type: 'people_to_meet',
      title: 'Networking Opportunity',
      body: 'Connect with fellow attendees before the event starts. Start building your network today.',
    },
  },
];

// Profile menu counts (34:1423).
export const demoProfileCounts = { savedSessions: 8, connections: 24 };

export const demoSuggestions = {
  attendees: demoOtherAttendees.slice(0, 3),
  partners: demoPartners.slice(0, 2),
  rationale: {
    a2: 'You both lead teams and care about tech.',
    a3: 'A coach like you — likely some great conversations there.',
    a4: 'Strong sales focus matches your interests.',
  } as Record<string, string>,
};
