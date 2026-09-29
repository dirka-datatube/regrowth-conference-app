import { demoEvents, demoSpeakers } from '@/lib/demo';
import { NAVIGATE, STUDY_TOUR } from '@/lib/events';
import type { EventRow, GuideSession, GuideSpeaker } from '@/lib/eventContent';
import type { WeatherReport } from '@/lib/eventWeather';
import type { SessionType } from '@/types/database';

/**
 * Demo fixtures for the event guide — Navigate (15–17 March 2027, the comps'
 * dates) and the Study Tour (2–9 June 2027, Melbourne), both from `demoEvents`.
 *
 * The Navigate agenda, update card, map directory and speaker names mirror the
 * comp copy (Home 146:2498, Agenda 92:288, Map 92:290) so the prototype matches
 * the design; the comps are placeholder copy, so none of it reaches a real
 * event. Venue content follows the demo venue (Crown Towers) rather than the
 * comps' Sydney and San Francisco hotels, so the demo agrees with itself.
 * Hotel phone numbers are in the ranges ACMA reserves for fiction.
 */

const PERTH = '+08:00';
const MELBOURNE = '+10:00'; // AEST — no daylight saving in June

function demoRow(id: string, index: number) {
  return demoEvents.find((e) => e.id === id) ?? demoEvents[index];
}

// --- Speakers ---------------------------------------------------------------

function speaker(base: Omit<GuideSpeaker, 'headshot_url'> & { headshot_url?: string | null }): GuideSpeaker {
  return { headshot_url: null, ...base };
}

const [kylie, sarahChen, marcusReid] = demoSpeakers;

const KYLIE = speaker({ ...kylie, title: 'Founder & Director', display_order: 0 });
const ARIS = speaker({
  id: 's4',
  name: 'Aris Thorne',
  title: 'Futurist',
  company: 'Thorne Advisory',
  bio: 'Aris helps agency leaders read the market two years out, and build teams that are ready for it when it arrives.',
  linkedin_url: null,
  display_order: 1,
});
const SARAH_KIM = speaker({
  id: 's5',
  name: 'Dr. Sarah Kim',
  title: 'Climate Lead',
  company: 'MIT',
  bio: 'Sarah researches how climate risk is reshaping property values, and how agents can lead that conversation with vendors instead of avoiding it.',
  linkedin_url: null,
  display_order: 2,
});
const MARCUS_VANCE = speaker({
  id: 's6',
  name: 'Marcus Vance',
  title: 'Lead Architect',
  company: 'EcoSystems',
  bio: 'Marcus designs the technology platforms behind some of the country’s fastest-growing property businesses, with an eye on what they cost to run.',
  linkedin_url: null,
  display_order: 3,
});
const SARAH_CHEN = speaker({ ...sarahChen, display_order: 4 });
const MARCUS_REID = speaker({ ...marcusReid, display_order: 5 });

const NAVIGATE_SPEAKERS = [KYLIE, ARIS, SARAH_KIM, MARCUS_VANCE, SARAH_CHEN, MARCUS_REID];

// Speakers belong to one event, so the tour has its own rows.
const TOUR_SPEAKERS: GuideSpeaker[] = [
  {
    ...KYLIE,
    id: 'st-s1',
    bio: 'Kylie leads every REGROWTH Study Tour, and has opened doors to the best-run agencies in the country for a decade.',
  },
  { ...SARAH_CHEN, id: 'st-s2', display_order: 1 },
  { ...MARCUS_REID, id: 'st-s3', display_order: 2 },
];

// --- Sessions ---------------------------------------------------------------

type Slot = {
  id: string;
  day: string;
  from: string;
  to: string;
  room: string;
  type: SessionType;
  title: string;
  abstract: string;
  speakers?: GuideSpeaker[];
};

function agenda(offset: string, slots: Slot[]): GuideSession[] {
  return slots.map((s) => ({
    id: s.id,
    title: s.title,
    abstract: s.abstract,
    start_at: `${s.day}T${s.from}:00${offset}`,
    end_at: `${s.day}T${s.to}:00${offset}`,
    room: s.room,
    type: s.type,
    speakers: (s.speakers ?? []).map(({ id, name, title, company, headshot_url }) => ({
      id,
      name,
      title,
      company,
      headshot_url,
    })),
  }));
}

// Ids sess1… keep the notes fixtures in lib/demo.ts pointing at real sessions.
const NAVIGATE_AGENDA = agenda(PERTH, [
  {
    id: 'sess1', day: '2027-03-15', from: '09:00', to: '10:00', room: 'Main Stage', type: 'keynote',
    title: 'Opening Keynote: Navigate 2027',
    abstract: 'Kylie opens Navigate 2027 with the year’s big shifts and what the best teams are already doing about them.',
    speakers: [KYLIE],
  },
  {
    id: 'sess2', day: '2027-03-15', from: '11:00', to: '12:00', room: 'Hall B', type: 'panel',
    title: 'Next-Gen AI Video Synthesis Models',
    abstract: 'What AI-generated video means for listings, and where it stops being an advantage and starts being a liability.',
    speakers: [SARAH_KIM],
  },
  {
    id: 'sess3', day: '2027-03-15', from: '12:00', to: '13:30', room: 'Foyer', type: 'meal',
    title: 'Networking Lunch',
    abstract: 'Lunch is served in the Foyer. A good time to find the people on your list.',
  },
  {
    id: 'sess4', day: '2027-03-15', from: '14:00', to: '15:30', room: 'Creative Room', type: 'workshop',
    title: 'Sustainable Tech Architecture Workshop',
    abstract: 'A hands-on session on choosing and connecting tools that stay affordable as your team grows. Bring a laptop.',
    speakers: [MARCUS_VANCE],
  },
  {
    id: 'sess5', day: '2027-03-15', from: '16:00', to: '17:00', room: 'Main Stage', type: 'panel',
    title: 'The Mindset of Top Performers',
    abstract: 'The inner game of high performance in real estate, from people who have played it for twenty years.',
    speakers: [SARAH_CHEN],
  },
  {
    id: 'sess6', day: '2027-03-15', from: '18:00', to: '20:00', room: 'Grand Ballroom', type: 'social',
    title: 'Welcome Drinks',
    abstract: 'Networking and refreshments in the Grand Ballroom to kick off NAVIGATE 2027.',
  },
  {
    id: 'sess7', day: '2027-03-16', from: '09:00', to: '10:00', room: 'Main Stage', type: 'keynote',
    title: 'Leading Through a Shifting Market',
    abstract: 'How to read the next two years, and build a team that is ready for them before they arrive.',
    speakers: [ARIS],
  },
  {
    id: 'sess8', day: '2027-03-16', from: '10:30', to: '12:00', room: 'Hall B', type: 'workshop',
    title: 'Building Your Tech Stack',
    abstract: 'How to choose tools that compound over time — and retire the ones that don’t.',
    speakers: [MARCUS_REID],
  },
  {
    id: 'sess9', day: '2027-03-16', from: '13:30', to: '14:30', room: 'Creative Room', type: 'breakout',
    title: 'Referral Systems That Compound',
    abstract: 'Ask at the appraisal, not at settlement: building a referral habit your whole office runs.',
    speakers: [SARAH_CHEN],
  },
  {
    id: 'sess10', day: '2027-03-16', from: '15:00', to: '16:00', room: 'Key Clients Forum', type: 'panel',
    title: 'Key Clients Forum: What Vendors Want in 2027',
    abstract: 'Vendors and agency leaders on what wins a listing now, and what quietly loses one.',
    speakers: [KYLIE, SARAH_KIM],
  },
  {
    id: 'sess11', day: '2027-03-16', from: '19:00', to: '23:00', room: 'Grand Ballroom', type: 'social',
    title: 'Gala Dinner & Charity Auction',
    abstract: 'Dinner, awards and the REGROWTH charity auction. Dress to impress.',
  },
  {
    id: 'sess12', day: '2027-03-17', from: '09:00', to: '10:00', room: 'Main Stage', type: 'panel',
    title: 'The Year Ahead: Market Outlook',
    abstract: 'Rates, stock and sentiment — the panel’s best read on the year ahead, and what to do on Monday.',
    speakers: [ARIS, MARCUS_VANCE],
  },
  {
    id: 'sess13', day: '2027-03-17', from: '10:30', to: '12:00', room: 'Hall B', type: 'workshop',
    title: 'Personal Brand Masterclass',
    abstract: 'Build a personal brand that wins listings without turning you into a full-time content creator.',
    speakers: [KYLIE],
  },
  {
    id: 'sess14', day: '2027-03-17', from: '14:00', to: '15:00', room: 'Main Stage', type: 'keynote',
    title: 'Closing Keynote: What’s Next',
    abstract: 'Kylie closes Navigate 2027 with the three commitments to take home.',
    speakers: [KYLIE],
  },
]);

const [TOUR_KYLIE, TOUR_SARAH, TOUR_MARCUS] = TOUR_SPEAKERS;

const TOUR_AGENDA = agenda(MELBOURNE, [
  {
    id: 'st1', day: '2027-06-02', from: '15:00', to: '17:00', room: 'Crown Towers Lobby', type: 'admin',
    title: 'Arrivals & Tour Registration',
    abstract: 'Collect your delegate pack and meet the REGROWTH team in the hotel lobby.',
  },
  {
    id: 'st2', day: '2027-06-02', from: '18:30', to: '21:00', room: 'Rooftop Terrace', type: 'social',
    title: 'Welcome Dinner',
    abstract: 'Meet your fellow delegates over dinner before the tour begins.',
    speakers: [TOUR_KYLIE],
  },
  {
    id: 'st3', day: '2027-06-03', from: '09:00', to: '10:00', room: 'Briefing Room', type: 'keynote',
    title: 'Study Tour Kick-off: What Great Offices Do Differently',
    abstract: 'What to look for at every office this week, and how to bring it home.',
    speakers: [TOUR_KYLIE],
  },
  {
    id: 'st4', day: '2027-06-03', from: '11:00', to: '13:00', room: 'Southbank', type: 'workshop',
    title: 'Office Visit: Acme Realty',
    abstract: 'Inside a high-growth agency: their weekly rhythm, their numbers, and the meeting they never cancel.',
    speakers: [TOUR_SARAH],
  },
  {
    id: 'st5', day: '2027-06-04', from: '09:30', to: '11:30', room: 'Richmond', type: 'workshop',
    title: 'Office Visit: PropTech AU',
    abstract: 'See the tools behind a top-performing team, and the ones they switched off.',
    speakers: [TOUR_MARCUS],
  },
  {
    id: 'st6', day: '2027-06-04', from: '14:00', to: '15:30', room: 'Briefing Room', type: 'panel',
    title: 'Growth Panel: Scaling a Team Without Losing Culture',
    abstract: 'Two of this week’s hosts on hiring, onboarding and keeping the culture that got them here.',
    speakers: [TOUR_SARAH, TOUR_MARCUS],
  },
  {
    id: 'st7', day: '2027-06-05', from: '10:00', to: '16:00', room: 'Yarra Valley', type: 'social',
    title: 'Yarra Valley Team Day',
    abstract: 'A day out of the city with the group. Coaches leave from the hotel entrance.',
  },
  {
    id: 'st8', day: '2027-06-06', from: '10:00', to: '12:00', room: 'Briefing Room', type: 'workshop',
    title: 'Mid-Tour Reflection Workshop',
    abstract: 'Turn the first four days into three changes you will make in your own office.',
    speakers: [TOUR_KYLIE],
  },
  {
    id: 'st9', day: '2027-06-07', from: '09:30', to: '11:30', room: 'Melbourne CBD', type: 'workshop',
    title: 'Office Visit: Inner-City Boutique Agency',
    abstract: 'How a twelve-person office outsells agencies three times its size.',
  },
  {
    id: 'st10', day: '2027-06-07', from: '13:00', to: '14:00', room: 'Key Clients Forum', type: 'panel',
    title: 'Key Clients Forum',
    abstract: 'An open conversation with the tour’s host agencies about their most valuable clients.',
    speakers: [TOUR_KYLIE],
  },
  {
    id: 'st11', day: '2027-06-08', from: '10:00', to: '12:00', room: 'Briefing Room', type: 'workshop',
    title: 'Building Your 90-Day Plan',
    abstract: 'Leave with a plan you can start on Monday, reviewed by the group.',
    speakers: [TOUR_KYLIE],
  },
  {
    id: 'st12', day: '2027-06-08', from: '19:00', to: '22:30', room: 'Dining Room', type: 'social',
    title: 'Farewell Dinner',
    abstract: 'The last night of the tour, together.',
  },
  {
    id: 'st13', day: '2027-06-09', from: '10:00', to: '11:00', room: 'Crown Towers Lobby', type: 'admin',
    title: 'Check-out & Departures',
    abstract: 'Airport transfers leave from the hotel entrance from 10:30 AM.',
  },
]);

// --- events.settings --------------------------------------------------------

function ago(minutes: number) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

const OPEN_ALL_DAY = 'Open 8:00 AM - 5:00 PM';

function navigateSettings() {
  return {
    city: 'Perth',
    timezone: 'Australia/Perth',
    welcome: {
      body: 'Three days of keynotes, workshops and connection with the people shaping Australian real estate.',
    },
    updates: [
      {
        id: 'u1',
        title: 'Welcome Drinks Tonight',
        body: 'Join us at 6:00 PM in the Grand Ballroom for networking and refreshments to kick off NAVIGATE 2027.',
        posted_at: ago(1),
        time: '6:00 PM',
        place: 'Grand Ballroom',
        session_id: 'sess6',
      },
      {
        id: 'u2',
        title: 'Agenda Updated',
        body: 'Day 2 workshops are now in Hall B and the Creative Room. Check the agenda before you head over.',
        posted_at: ago(180),
        screen: 'agenda',
      },
    ],
    hotel: {
      name: 'Crown Towers Perth',
      address: 'Great Eastern Highway, Burswood WA 6100',
      phone: '+61 8 5550 1234',
      website: 'https://www.crownperth.com.au',
      check_in: 'From 3:00 PM',
      check_out: 'By 11:00 AM',
      booking_code: 'REGROWTH27',
      booking_note: 'Quote this code when you book to receive the REGROWTH group rate.',
      amenities: ['Resort pool', 'Day spa', 'Gym', 'Restaurants & bars', 'Free Wi-Fi', 'Valet parking'],
      notes: [
        'Navigate runs on-site, so there are no transfers to arrange.',
        'Late check-out on 17 March is available on request.',
      ],
    },
    packing: [
      { title: 'Essentials', items: ['Phone & charger', 'Wallet & cards', 'Any medication you need', 'Refillable water bottle'] },
      {
        title: 'Documents',
        items: ['Photo ID', 'Your entry QR code (in this app)', 'Flight & hotel confirmations', 'Travel insurance details'],
      },
      {
        title: 'Clothing',
        items: [
          'Smart casual outfits for three days',
          { label: 'Evening wear', note: 'For the Gala Dinner on 16 March' },
          'Comfortable shoes',
          'A light jacket for air-conditioned rooms',
          'Swimwear',
        ],
      },
      { title: 'Tech', items: ['Laptop or tablet', 'Portable power bank'] },
      { title: 'Event extras', items: ['Business cards', 'Notebook & pen', 'Sunglasses & sunscreen'] },
    ],
    map: {
      title: 'Crown Towers Perth',
      levels: [
        {
          id: 'l1',
          label: 'Level 1',
          areas: [
            {
              id: 'main-hall', name: 'Main Hall A Stage', kind: 'stage', x: 4, y: 6, w: 50, h: 58,
              location: 'Level 1 Central', note: 'Currently Hosting “Sustainable Tech”', room: 'Main Stage',
            },
            { id: 'foyer', name: 'Foyer', kind: 'lounge', x: 4, y: 68, w: 24, h: 26, room: 'Foyer', directory: false },
            { id: 'registration', name: 'Registration', kind: 'entry', x: 30, y: 68, w: 24, h: 26, directory: false },
            {
              id: 'partners', name: 'Partners Booth', kind: 'booth', x: 58, y: 6, w: 38, h: 27,
              location: 'Level 1 West Gate', note: OPEN_ALL_DAY,
            },
            {
              id: 'key-clients', name: 'Key Clients Forum', kind: 'meeting', x: 58, y: 37, w: 38, h: 27,
              location: 'Level 1 West Gate', note: OPEN_ALL_DAY, room: 'Key Clients Forum',
            },
            {
              id: 'coffee', name: 'Coffee Block', kind: 'coffee', x: 58, y: 68, w: 38, h: 26,
              location: 'Level 1 West Gate', note: OPEN_ALL_DAY,
            },
          ],
        },
        {
          id: 'l2',
          label: 'Level 2',
          areas: [
            {
              id: 'hall-b', name: 'Hall B', kind: 'room', x: 4, y: 6, w: 44, h: 50,
              location: 'Level 2 North', note: 'Panels & workshops', room: 'Hall B',
            },
            {
              id: 'creative', name: 'Creative Room', kind: 'room', x: 52, y: 6, w: 44, h: 50,
              location: 'Level 2 South', note: 'Hands-on workshops', room: 'Creative Room',
            },
            {
              id: 'pods', name: 'Meeting Pods', kind: 'meeting', x: 4, y: 60, w: 44, h: 34,
              location: 'Level 2 North', note: 'Book at the concierge desk',
            },
            {
              id: 'speaker-lounge', name: 'Speaker Lounge', kind: 'lounge', x: 52, y: 60, w: 26, h: 34,
              location: 'Level 2 South', note: 'Speakers & VIP Pass holders',
            },
            { id: 'restrooms-2', name: 'Restrooms', kind: 'amenity', x: 80, y: 60, w: 16, h: 34, directory: false },
          ],
        },
        {
          id: 'l3',
          label: 'Level 3',
          areas: [
            {
              id: 'ballroom', name: 'Grand Ballroom', kind: 'stage', x: 4, y: 6, w: 62, h: 64,
              location: 'Level 3', note: 'Welcome Drinks & Gala Dinner', room: 'Grand Ballroom',
            },
            {
              id: 'terrace-bar', name: 'Terrace Bar', kind: 'food', x: 70, y: 6, w: 26, h: 64,
              location: 'Level 3 Terrace', note: 'Open from 5:00 PM',
            },
            {
              id: 'cloakroom', name: 'Cloakroom', kind: 'info', x: 4, y: 74, w: 30, h: 20,
              location: 'Level 3', note: 'Open during evening events',
            },
            { id: 'lifts-3', name: 'Lifts', kind: 'entry', x: 38, y: 74, w: 28, h: 20, directory: false },
          ],
        },
      ],
    },
  };
}

function studyTourSettings() {
  return {
    city: 'Melbourne',
    timezone: 'Australia/Melbourne',
    welcome: {
      body: 'Eight days inside Melbourne’s best-run agencies, with a small group of leaders who want to see how it is done.',
    },
    updates: [
      {
        id: 'tu1',
        title: 'Welcome Dinner Confirmed',
        body: 'Join the group at 6:30 PM on the Rooftop Terrace to meet your fellow delegates before the tour begins.',
        posted_at: ago(1),
        time: '6:30 PM',
        place: 'Rooftop Terrace',
        session_id: 'st2',
      },
      {
        id: 'tu2',
        title: 'Pack for Melbourne’s Winter',
        body: 'June mornings are cold in Melbourne. Bring layers and an umbrella for the office visits.',
        posted_at: ago(300),
        screen: 'pack',
      },
    ],
    hotel: {
      name: 'Crown Towers Melbourne',
      address: '8 Whiteman Street, Southbank VIC 3006',
      phone: '+61 3 5550 1234',
      website: 'https://www.crownmelbourne.com.au',
      check_in: 'From 3:00 PM, 2 June',
      check_out: 'By 11:00 AM, 9 June',
      booking_code: 'RGST-2027',
      booking_note: 'Your room is included in your Study Tour package. Quote this reference at check-in.',
      amenities: ['Indoor pool', 'Day spa', 'Gym', 'Restaurants & bars', 'Free Wi-Fi'],
      notes: ['Tour coaches leave from the hotel entrance each morning.'],
    },
    packing: [
      { title: 'Essentials', items: ['Phone & charger', 'Wallet & cards', 'Any medication you need', 'Compact umbrella'] },
      {
        title: 'Documents',
        items: ['Photo ID', 'Your entry QR code (in this app)', 'Flight confirmations', 'Travel insurance details'],
      },
      {
        title: 'Clothing',
        items: [
          { label: 'Business attire', note: 'For the office visits' },
          { label: 'A warm coat & layers', note: 'Melbourne averages 7–14° in June' },
          'Comfortable walking shoes',
          'A smart outfit for the Welcome Dinner',
        ],
      },
      { title: 'Tech', items: ['Laptop or tablet', 'Portable power bank'] },
      { title: 'Event extras', items: ['Business cards', 'Notebook & pen', 'Questions for each host office'] },
    ],
    map: {
      title: 'Crown Towers Melbourne',
      levels: [
        {
          id: 'l1',
          label: 'Level 1',
          areas: [
            {
              id: 'lobby', name: 'Lobby & Tour Desk', kind: 'entry', x: 4, y: 6, w: 56, h: 52,
              location: 'Level 1 Central', note: 'Tour desk open 7:30 AM - 6:00 PM', room: 'Crown Towers Lobby',
            },
            {
              id: 'coffee', name: 'Coffee Block', kind: 'coffee', x: 64, y: 6, w: 32, h: 52,
              location: 'Level 1 East', note: 'Open 6:30 AM - 4:00 PM',
            },
            {
              id: 'concierge', name: 'Concierge', kind: 'info', x: 4, y: 62, w: 40, h: 32,
              location: 'Level 1 Central', note: 'Luggage, taxis & dinner bookings',
            },
            {
              id: 'coach-bay', name: 'Coach Bay', kind: 'entry', x: 48, y: 62, w: 48, h: 32,
              location: 'Whiteman Street entrance', note: 'Tour coaches depart here',
            },
          ],
        },
        {
          id: 'l2',
          label: 'Level 2',
          areas: [
            {
              id: 'briefing', name: 'Briefing Room', kind: 'stage', x: 4, y: 6, w: 56, h: 60,
              location: 'Level 2 Central', note: 'Kick-off, panels & workshops', room: 'Briefing Room',
            },
            {
              id: 'partners', name: 'Partners Lounge', kind: 'booth', x: 64, y: 6, w: 32, h: 60,
              location: 'Level 2 East', note: OPEN_ALL_DAY,
            },
            {
              id: 'key-clients', name: 'Key Clients Forum', kind: 'meeting', x: 4, y: 70, w: 92, h: 24,
              location: 'Level 2 West', note: 'By invitation', room: 'Key Clients Forum',
            },
          ],
        },
        {
          id: 'l3',
          label: 'Level 3',
          areas: [
            {
              id: 'terrace', name: 'Rooftop Terrace', kind: 'lounge', x: 4, y: 6, w: 92, h: 44,
              location: 'Level 3 Rooftop', note: 'Welcome Dinner', room: 'Rooftop Terrace',
            },
            {
              id: 'dining', name: 'Dining Room', kind: 'food', x: 4, y: 54, w: 60, h: 40,
              location: 'Level 3 West', note: 'Farewell Dinner', room: 'Dining Room',
            },
            { id: 'lifts-3', name: 'Lifts', kind: 'entry', x: 68, y: 54, w: 28, h: 40, directory: false },
          ],
        },
      ],
    },
  };
}

// --- Public fixtures --------------------------------------------------------

export function demoEventRow(eventId: string): EventRow | null {
  if (eventId === NAVIGATE.id) {
    const e = demoRow(NAVIGATE.id, 0);
    return { ...pickRow(e), venue_lat: -31.9614, venue_lng: 115.8617, settings: navigateSettings() };
  }
  if (eventId === STUDY_TOUR.id) {
    const e = demoRow(STUDY_TOUR.id, 1);
    return { ...pickRow(e), venue_lat: -37.8136, venue_lng: 144.9631, settings: studyTourSettings() };
  }
  return null;
}

function pickRow(e: (typeof demoEvents)[number]) {
  return { id: e.id, name: e.name, start_date: e.start_date, end_date: e.end_date, venue: e.venue };
}

export function demoAgenda(eventId: string): GuideSession[] {
  if (eventId === NAVIGATE.id) return NAVIGATE_AGENDA;
  if (eventId === STUDY_TOUR.id) return TOUR_AGENDA;
  return [];
}

export function demoGuideSpeakers(eventId: string): GuideSpeaker[] {
  if (eventId === NAVIGATE.id) return NAVIGATE_SPEAKERS;
  if (eventId === STUDY_TOUR.id) return TOUR_SPEAKERS;
  return [];
}

/** Sessions the demo attendee has already saved; toggles stay in this browser. */
export const DEMO_SCHEDULE_PICKS = ['sess1', 'sess2', 'st3'];

export const DEMO_SPEAKER_FOLLOWS = ['s1'];

// --- Weather ----------------------------------------------------------------

type Climate = { high: number; low: number; dayCode: number; nightCode: number; week: [number, number, number][] };

// Perth in March and Melbourne in June: [high, low, WMO code] per day.
const CLIMATE: Record<string, Climate> = {
  [NAVIGATE.id]: {
    high: 24, low: 18, dayCode: 1, nightCode: 0,
    week: [[24, 18, 1], [27, 19, 0], [29, 20, 0], [26, 19, 2], [23, 17, 3], [24, 17, 1], [27, 18, 0]],
  },
  [STUDY_TOUR.id]: {
    high: 14, low: 8, dayCode: 2, nightCode: 3,
    week: [[14, 8, 2], [13, 7, 61], [12, 6, 3], [14, 8, 2], [15, 9, 1], [13, 8, 61], [12, 6, 3]],
  },
};

function localStamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00`;
}

/**
 * A forecast shaped like Open-Meteo's, from the attendee's current hour, so
 * the demo's "Now" card always agrees with the big temperature. Never fetched.
 */
export function demoWeather(eventId: string): WeatherReport | null {
  const c = CLIMATE[eventId];
  if (!c) return null;
  const start = new Date();
  start.setMinutes(0, 0, 0);

  const hourly = Array.from({ length: 24 }, (_, i) => {
    const at = new Date(start.getTime() + i * 3600000);
    const hour = at.getHours();
    // Warmest at 3 PM, coolest at 3 AM.
    const warmth = (1 + Math.cos(((hour - 15) / 24) * 2 * Math.PI)) / 2;
    const isDay = hour >= 6 && hour < 19;
    return {
      time: localStamp(at),
      temp: Math.round(c.low + (c.high - c.low) * warmth),
      code: isDay ? c.dayCode : c.nightCode,
      isDay,
    };
  });

  const daily = c.week.map(([high, low, code], i) => {
    const d = new Date(start.getTime() + i * 86400000);
    return { date: localStamp(d).slice(0, 10), high, low, code };
  });

  return {
    current: { temp: hourly[0].temp, code: hourly[0].code, isDay: hourly[0].isDay },
    today: { high: c.high, low: c.low },
    hourly,
    daily,
  };
}
