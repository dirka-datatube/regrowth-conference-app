import type { Partner, PodcastEpisode } from '@/types/database';
import type { CommunityContact, CommunityMember, CommunityProfile } from '@/lib/hooks/useCommunity';
import type { SupportMessage } from '@/lib/support';
import { demoOtherAttendees, demoPartners, demoPodcast } from '@/lib/demo';
import { NAVIGATE, STUDY_TOUR } from '@/lib/events';

/**
 * Demo fixtures for the Connect sub-screens, the scanner and support chat.
 * They extend the shared ones in lib/demo.ts, which stay untouched: James
 * Patel is still `a2`, the person a scanned demo badge resolves to.
 *
 * All people and companies here are fictional (CommBank is the comp's own
 * partner page, 185:550).
 */

type DemoPerson = CommunityProfile & CommunityContact;

function person(
  base: CommunityMember,
  eventId: string,
  bio: string,
  email: string,
): DemoPerson {
  return { ...base, event_id: eventId, bio, email, linkedin_url: null };
}

const shared = Object.fromEntries(demoOtherAttendees.map((a) => [a.id, a])) as Record<string, CommunityMember>;

const PEOPLE: DemoPerson[] = [
  person(shared.a2, NAVIGATE.id, 'Leads a growing sales team and is always hunting for better ways to put tech to work in the office.', 'james@patelrealty.example'),
  person(shared.a3, NAVIGATE.id, 'Principal and coach. Believes the best agencies are built one conversation at a time.', 'olivia@brownandco.example'),
  person(shared.a4, NAVIGATE.id, 'Top-performing agent turned sales lead. Always up for a good CRM debate.', 'daniel@kimgroup.example'),
  person(shared.a5, NAVIGATE.id, 'Runs marketing for a boutique agency — campaigns, content and the odd listing video that takes off.', 'hannah@liuproperty.example'),
  person(
    { id: 'a6', name: 'Mia Thompson', role: 'Principal', company: 'Thompson Estate Agents', photo_url: null, interests: ['leadership', 'recruitment'] },
    NAVIGATE.id,
    'Built her agency from a two-desk office. Interested in hiring well and keeping great people.',
    'mia@thompsonestate.example',
  ),
  person(
    { id: 'a7', name: 'Liam O’Connor', role: 'Head of Sales', company: 'Harbour Property Group', photo_url: null, interests: ['sales', 'coaching'] },
    NAVIGATE.id,
    'Coaches a team of twelve agents. Here for the sales sessions and the conversations in between.',
    'liam@harbourproperty.example',
  ),
  person(
    { id: 'a8', name: 'Grace Nguyen', role: 'Property Management Lead', company: 'Nguyen & Partners', photo_url: null, interests: ['systems', 'leadership'] },
    NAVIGATE.id,
    'Looks after a rent roll of 600 doors and loves a well-built process.',
    'grace@nguyenpartners.example',
  ),
  person(
    { id: 'a9', name: 'Ethan Walker', role: 'Auctioneer', company: 'Walker Auctions', photo_url: null, interests: ['auctions', 'sales'] },
    NAVIGATE.id,
    'Calls around 300 auctions a year and trains agents to run a confident campaign.',
    'ethan@walkerauctions.example',
  ),
  person(
    { id: 'a10', name: 'Chloe Martin', role: 'Director of Growth', company: 'Martin Realty Group', photo_url: null, interests: ['growth', 'marketing', 'leadership'] },
    NAVIGATE.id,
    'Opens new offices for a family-owned group. Keen to swap notes on expansion.',
    'chloe@martinrealty.example',
  ),
  person(
    { id: 'a11', name: 'Noah Williams', role: 'Buyer’s Agent', company: 'Northside Buyers', photo_url: null, interests: ['negotiation', 'mindset'] },
    NAVIGATE.id,
    'Represents buyers, so he sees every campaign from the other side of the table.',
    'noah@northsidebuyers.example',
  ),
  person(
    { id: 'st1', name: 'Sophie Anderson', role: 'Managing Director', company: 'Anderson Real Estate', photo_url: null, interests: ['leadership', 'culture'] },
    STUDY_TOUR.id,
    'Joining the Study Tour to see how the best offices build culture at scale.',
    'sophie@andersonre.example',
  ),
  person(
    { id: 'st2', name: 'Oliver Scott', role: 'Principal', company: 'Scott & Co Property', photo_url: null, interests: ['innovation', 'tech'] },
    STUDY_TOUR.id,
    'Early adopter of anything that saves his team an hour a week.',
    'oliver@scottco.example',
  ),
  person(
    { id: 'st3', name: 'Isla Robinson', role: 'Head of Operations', company: 'Robinson Residential', photo_url: null, interests: ['systems', 'people'] },
    STUDY_TOUR.id,
    'Runs operations for three offices. Happiest with a good checklist.',
    'isla@robinsonresidential.example',
  ),
  person(
    { id: 'st4', name: 'Jack Mitchell', role: 'Sales Director', company: 'Mitchell Partners', photo_url: null, interests: ['sales', 'leadership'] },
    STUDY_TOUR.id,
    'Leads sales across a growing network and is here to learn from the host offices.',
    'jack@mitchellpartners.example',
  ),
  person(
    { id: 'st5', name: 'Ava Harris', role: 'Business Development Manager', company: 'Harris Realty', photo_url: null, interests: ['growth', 'marketing'] },
    STUDY_TOUR.id,
    'Wins new listings and new landlords. Always keen to compare pipelines.',
    'ava@harrisrealty.example',
  ),
];

const byName = (a: CommunityMember, b: CommunityMember) => a.name.localeCompare(b.name);

export function demoCommunity(eventId: string): CommunityMember[] {
  return PEOPLE.filter((p) => p.event_id === eventId)
    .map(({ id, name, role, company, photo_url, interests }) => ({ id, name, role, company, photo_url, interests }))
    .sort(byName);
}

export function demoCommunityProfile(id: string): CommunityProfile | null {
  const p = PEOPLE.find((x) => x.id === id);
  if (!p) return null;
  const { email: _email, linkedin_url: _linkedin, ...profile } = p;
  return profile;
}

export function demoContact(id: string): CommunityContact | null {
  const p = PEOPLE.find((x) => x.id === id);
  return p ? { email: p.email, linkedin_url: p.linkedin_url } : null;
}

/** Kylie already knows Olivia, so the demo shows both profile states. */
export const demoConnectedIds = ['a3'];

// --- Partners --------------------------------------------------------------

const partnerBase = { event_id: NAVIGATE.id, logo_url: null, created_at: '', updated_at: '', is_featured: false };

export const demoPartnerList: Partner[] = [
  {
    ...demoPartners[0],
    // Copy from the pre-v2 CommBank page (app/commbank.tsx), which this
    // partner detail replaces.
    description:
      'We’ve partnered with CommBank to bring the real estate industry banking built for how we work. Speak with their real estate banking specialists on-site, or learn more online.',
    solutions_content:
      'Tailored finance solutions for real estate professionals. Find the CommBank lounge in the foyer for casual conversations, free coffee and a chat with their real estate banking specialists.',
  },
  ...demoPartners.slice(1),
  {
    ...partnerBase,
    id: 'p4', name: 'Harbourline Conveyancing', display_order: 3, tags: ['legal'],
    description: 'Fixed-fee conveyancing and settlement support for agencies and their clients.',
    solutions_content: 'Contract reviews within a day, settlement tracking your clients can follow, and a dedicated contact for your office.',
    contact_email: 'hello@harbourline.example', website_url: null,
  },
  {
    ...partnerBase,
    id: 'p5', name: 'Keystone Cover', display_order: 4, tags: ['insurance'],
    description: 'Professional indemnity and landlord insurance for property businesses.',
    solutions_content: 'Cover reviews for agencies, landlord policies your property managers can recommend with confidence, and claims help when it counts.',
    contact_email: 'agencies@keystonecover.example', website_url: null,
  },
  {
    ...partnerBase,
    id: 'p6', name: 'Lumen Insight', display_order: 5, tags: ['research'],
    description: 'Market data and suburb reports that sharpen your appraisals.',
    solutions_content: 'Suburb trend reports, comparable sales and branded market updates for your database.',
    contact_email: 'team@lumeninsight.example', website_url: null,
  },
  {
    ...partnerBase,
    id: 'p7', name: 'Frame & Field Media', display_order: 6, tags: ['marketing', 'media'],
    description: 'Property photography, video and floor plans, booked in minutes.',
    solutions_content: 'Same-week shoots, twilight and drone photography, and listing video cut for social.',
    contact_email: 'bookings@frameandfield.example', website_url: null,
  },
  {
    ...partnerBase,
    id: 'p8', name: 'BrightDoor Staging', display_order: 7, tags: ['styling'],
    description: 'Home staging and styling that helps listings present at their best.',
    solutions_content: 'Full and partial staging packages, styling consultations and furniture hire for campaigns of any length.',
    contact_email: 'studio@brightdoor.example', website_url: null,
  },
  {
    ...partnerBase,
    id: 'p9', name: 'Ledgerline Accounting', display_order: 8, tags: ['finance'],
    description: 'Trust accounting and advisory for real estate agencies.',
    solutions_content: 'Trust account audits, commission structures that scale, and quarterly advisory for principals.',
    contact_email: 'hello@ledgerline.example', website_url: null,
  },
  {
    ...partnerBase,
    id: 'p10', name: 'SignPoint', display_order: 9, tags: ['marketing'],
    description: 'Signboards, window cards and print, delivered to the office.',
    solutions_content: 'Board installs within 48 hours, window displays and brochure printing on one account.',
    contact_email: 'orders@signpoint.example', website_url: null,
  },
];

// --- Podcast ---------------------------------------------------------------

/**
 * Demo audio is a public sample track (SoundHelix) so play, pause and progress
 * can be tried in the prototype; it is music, not an interview. Real episodes
 * stream their own `audio_url` from `podcast_episodes`.
 */
const sample = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

const episodeBase = { event_id: NAVIGATE.id, episode_url: null };

export const demoEpisodes: PodcastEpisode[] = [
  // The shared fixture's episode page is a placeholder URL, so it is dropped.
  { ...demoPodcast[0], audio_url: sample(1), episode_url: null },
  {
    ...episodeBase, id: 'ep2', audio_url: sample(2), duration_seconds: 2280, published_at: daysAgo(21),
    title: 'Episode 41: Leading Through a Shifting Market',
    description: 'Kylie and Marcus Reid on keeping a team steady when the market turns — and what to stop doing first.',
  },
  {
    ...episodeBase, id: 'ep3', audio_url: sample(3), duration_seconds: 2640, published_at: daysAgo(35),
    title: 'Episode 40: Building a Referral Engine',
    description: 'Why the appraisal, not the settlement, is the moment to ask — and how to measure what follows.',
  },
  {
    ...episodeBase, id: 'ep4', audio_url: sample(4), duration_seconds: 1980, published_at: daysAgo(49),
    title: 'Episode 39: The First 90 Days of a New Team',
    description: 'Onboarding rhythms that stick: weekly one-on-ones, a Monday number and a follow-up habit.',
  },
  {
    ...episodeBase, id: 'ep5', audio_url: sample(5), duration_seconds: 2460, published_at: daysAgo(63),
    title: 'Episode 38: Pricing Conversations That Win Listings',
    description: 'How top performers talk price with vendors without losing the room.',
  },
  {
    ...episodeBase, id: 'ep6', audio_url: sample(6), duration_seconds: 2100, published_at: daysAgo(77),
    title: 'Episode 37: From Agent to Business Owner',
    description: 'The mindset shift from selling homes to building a business — with three principals who made it.',
  },
];

// --- Support chat ----------------------------------------------------------

/**
 * The comp's conversation (73:453): the greeting, a question, and an answer
 * carrying a map-pin action. Only the question is a row — the assistant's
 * lines are derived from it (lib/support.ts).
 */
export function demoSupportThread(): SupportMessage[] {
  return [
    {
      id: 'demo-1',
      body: 'Where is the registration desk?',
      from_staff: false,
      needs_human: false,
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
  ];
}

/** The canned team reply after Connect, so the demo shows the staff side. */
export function demoStaffReply(firstName?: string): SupportMessage {
  return {
    id: `demo-staff-${Date.now()}`,
    body: `Hi${firstName ? ` ${firstName}` : ''}, it’s the REGROWTH team. Thanks for reaching out — how can we help?`,
    from_staff: true,
    needs_human: false,
    created_at: new Date().toISOString(),
  };
}
