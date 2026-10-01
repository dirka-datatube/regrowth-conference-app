import { NAVIGATE } from '@/lib/events';

/**
 * Demo fixtures for the Profile sub-screens. All people and companies are
 * fictional; emails use the reserved .example domain.
 *
 * Saved Sessions has no fixture of its own: it shows the agenda's demo picks
 * (DEMO_SCHEDULE_PICKS in lib/demo-event.ts), so the bookmarks agree.
 *
 * This module imports no other demo module, so lib/demo-connect.ts can import
 * DEMO_EXTRA_PEOPLE from it without a cycle.
 */

// --- Networking Connections (216:1028) ----------------------------------------

/**
 * Kylie's 24 connections, most recent first — the Profile menu's
 * "24 Connections" (demoProfileCounts in lib/demo.ts). Twelve are the Connect
 * community's people (lib/demo-connect.ts) and twelve are DEMO_EXTRA_PEOPLE
 * below, which lib/demo-connect.ts adds to the community, so every card opens
 * a profile. James (a2, the person a scanned demo badge resolves to), Daniel
 * (a4) and Mia (a6) stay unconnected, so the demo still shows "Connect".
 */
export const DEMO_CONNECTION_IDS = [
  'a3', 'a7', 'a10', 'a9', 'a8', 'a5', 'a11',
  'st1', 'st2', 'st3', 'st4', 'st5',
  'a12', 'a13', 'a14', 'a15', 'a16', 'a17', 'a18', 'a19', 'a20', 'a21', 'a22', 'a23',
];

export type DemoPerson = {
  id: string;
  event_id: string;
  name: string;
  role: string | null;
  company: string | null;
  photo_url: string | null;
  interests: string[];
  bio: string | null;
  email: string | null;
  linkedin_url: string | null;
};

function extra(
  id: string,
  name: string,
  role: string,
  company: string,
  email: string,
  interests: string[],
  bio: string,
): DemoPerson {
  return { id, event_id: NAVIGATE.id, name, role, company, photo_url: null, interests, bio, email, linkedin_url: null };
}

/** Navigate attendees who are not in the Connect community fixture. */
export const DEMO_EXTRA_PEOPLE: DemoPerson[] = [
  extra('a12', 'Priya Sharma', 'Sales Director', 'Coastline Property', 'priya@coastlineproperty.example',
    ['sales', 'leadership'], 'Runs a sales floor of twenty and is always refining the weekly rhythm.'),
  extra('a13', 'Henry Lee', 'Buyer’s Agent', 'Lee Advisory', 'henry@leeadvisory.example',
    ['negotiation', 'investment'], 'Helps investors buy well, and swaps notes with listing agents on every campaign.'),
  extra('a14', 'Zoe Campbell', 'Team Leader', 'Campbell Estates', 'zoe@campbellestates.example',
    ['coaching', 'mindset'], 'Leads a team of six and coaches new agents through their first year.'),
  extra('a15', 'Samuel White', 'Director', 'Whitehall Realty', 'samuel@whitehallrealty.example',
    ['growth', 'recruitment'], 'Opened his second office this year and is hiring for both.'),
  extra('a16', 'Ella Davis', 'Head of Property Management', 'Davis Group', 'ella@davisgroup.example',
    ['systems', 'leadership'], 'Looks after a growing rent roll and the team behind it.'),
  extra('a17', 'Benjamin King', 'CEO', 'King Property Group', 'ben@kingproperty.example',
    ['leadership', 'culture'], 'Leads a group of five offices and cares most about the culture between them.'),
  extra('a18', 'Ruby Clarke', 'Marketing Coordinator', 'Bayside Property', 'ruby@baysideproperty.example',
    ['marketing', 'content'], 'Plans campaigns, shoots the listing reels and keeps the database warm.'),
  extra('a19', 'William Jones', 'Sales Agent', 'Jones Real Estate', 'will@jonesre.example',
    ['sales', 'prospecting'], 'Three years in and building a referral business one conversation at a time.'),
  extra('a20', 'Emily Brooks', 'Business Coach', 'Brooks Coaching', 'emily@brookscoaching.example',
    ['coaching', 'growth'], 'Coaches principals on planning, numbers and the habits that hold a year together.'),
  extra('a21', 'Oscar Nguyen', 'Property Manager', 'Northside Rentals', 'oscar@northsiderentals.example',
    ['systems', 'service'], 'Looks after two hundred doors and is rebuilding how his team handles maintenance.'),
  extra('a22', 'Grace Wilson', 'Operations Manager', 'Wilson & Partners', 'grace@wilsonpartners.example',
    ['operations', 'technology'], 'Keeps the office running and the tech stack honest.'),
  extra('a23', 'Lucas Martin', 'Auctioneer', 'Martin Auctions', 'lucas@martinauctions.example',
    ['auctions', 'negotiation'], 'Calls a dozen auctions a week and trains agents to run the room.'),
];

// --- Business card capture (/me/card) -----------------------------------------

/** What the demo "reads" off any photo. The details are illustrative. */
export const demoCardDetails = {
  name: 'Rachel Morgan',
  company: 'Morgan & Co Property',
  email: 'rachel@morganco.example',
  phone: null,
};

// --- REGROWTH Services (217:1795) ---------------------------------------------

/**
 * The comp's testimonial slot, in demo only: a quote is a claim about a real
 * client, so the live screen waits for one REGROWTH supplies.
 */
export const demoServicesTestimonial = {
  quote:
    'Navigate gave our whole team one plan for the year. We came home with systems we still use every week, and the numbers to prove it.',
  name: 'James Patel',
  role: 'Director, Patel Realty',
};
