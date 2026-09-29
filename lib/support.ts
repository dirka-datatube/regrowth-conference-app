import { Platform } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';
import { eventHref, productFor } from '@/lib/events';

/**
 * Customer Support (73:453) — the REGROWTH Assistant.
 *
 * The assistant is automated and says so: it answers common questions from the
 * keyword table below, on the device, and points to the screen that holds the
 * facts (agenda, map, hotel…) rather than stating them itself. Anything it
 * cannot answer goes to the team: every message the attendee sends is stored
 * in `support_messages` (migration 20260929000200), where staff reply.
 *
 * Replies are a pure function of the thread, so they are never stored — only
 * the attendee's messages and the team's replies are.
 */

type Icon = keyof typeof Ionicons.glyphMap;

export type SupportMessage = {
  id: string;
  body: string;
  from_staff: boolean;
  needs_human: boolean;
  created_at: string;
  /** Optimistic row, not yet saved. */
  pending?: boolean;
};

/** The tappable row under an answer — "map-pin + Open Venue Map" in the comp. */
export type ActionHint = { label: string; icon: Icon; href: string };

export type ChatItem =
  | { kind: 'assistant'; id: string; text: string; at: string; action?: ActionHint }
  | { kind: 'user'; id: string; text: string; at: string; pending?: boolean }
  | { kind: 'staff'; id: string; text: string; at: string };

export type AssistantContext = {
  /** The event answers point into — the attendee's first ticket, else Navigate. */
  eventId: string;
  firstName?: string;
};

/** Sent when the attendee taps Connect on the escalation card. */
export const TEAM_REQUEST = 'Please connect me with the REGROWTH team.';

/** Suggestion chips: the label, and the question it sends. */
export const SUGGESTIONS = [
  { label: 'Agenda', question: 'Where can I see the agenda?' },
  { label: 'Venue map', question: 'Where is everything at the venue?' },
  { label: 'My ticket', question: 'Where is my ticket?' },
  { label: 'Hotel', question: 'Where are the hotel details?' },
  { label: 'Weather', question: "What's the weather going to be like?" },
  { label: 'Wi-Fi', question: 'What is the Wi-Fi password?' },
  { label: 'Parking', question: 'Where can I park?' },
];

type Reply = { text: string; action?: ActionHint };
type Topic = {
  words: RegExp[];
  /** A generic question word ("where", "when") that decides only when no topic matched. */
  fallback?: RegExp;
  reply: (c: { eventId: string; event: string }) => Reply;
};

// Scored by how many of a topic's patterns match; ties go to the earlier topic.
const TOPICS: Topic[] = [
  {
    words: [/\b(human|person|someone|somebody|staff|team|organi[sz]er)\b/, /\b(talk|speak|chat) (to|with)\b/, /\bcontact\b/, /\b(call|phone|email)\b/],
    reply: () => ({ text: 'I’ll get you a person — tap Connect below and the REGROWTH team will reply in this chat.' }),
  },
  {
    words: [/\bwi-?fi\b/, /\binternet\b/, /\bhotspot\b/, /\bwireless\b/],
    reply: () => ({ text: 'I don’t have the venue Wi-Fi details. Tap Connect below and the team will send them to you.' }),
  },
  {
    words: [/\bscan(ner|ning)?\b/],
    reply: () => ({
      text: 'Scan an attendee’s badge to swap details — or upload a photo of a QR code from your gallery.',
      action: { label: 'Scan a QR code', icon: 'scan-outline', href: '/scan' },
    }),
  },
  {
    words: [/\bnetwork(ing)?\b/, /\battendees?\b/, /\bcommunity\b/, /\bmeet\b/, /\bconnect(ions?)?\b/],
    reply: () => ({
      text: 'Meet fellow attendees in your event’s community under Connect.',
      action: { label: 'Open Connect', icon: 'people-outline', href: '/connect' },
    }),
  },
  {
    words: [/\btickets?\b/, /\bbadges?\b/, /\bqr\b/, /\bentry\b/, /\bcheck[- ]?in\b/, /\bpass\b/],
    reply: () => ({
      text: 'Your entry badge is in My Tickets. Show its QR code at the registration desk when you arrive.',
      action: { label: 'Open My Tickets', icon: 'qr-code-outline', href: '/me/tickets' },
    }),
  },
  {
    words: [/\bagenda\b/, /\bschedule\b/, /\bsessions?\b/, /\bprogramm?e?\b/, /\btimetable\b/, /\bkeynotes?\b/],
    fallback: /\b(when|what time|starts?)\b/,
    reply: ({ eventId, event }) => ({
      text: `The ${event} agenda has every session, time and room. Save the ones you want and they appear in Saved Sessions.`,
      action: { label: 'Open the agenda', icon: 'calendar-outline', href: eventHref(eventId, 'agenda') },
    }),
  },
  {
    words: [/\bspeakers?\b/, /\bpresenters?\b/, /\bpanel(lists?|ists?)?\b/, /\bwho('s| is) (speaking|presenting|talking)\b/],
    reply: ({ eventId, event }) => ({
      text: `Every ${event} speaker has a profile with their sessions on the Speakers screen.`,
      action: { label: 'Meet the speakers', icon: 'mic-outline', href: eventHref(eventId, 'speakers') },
    }),
  },
  {
    words: [/\bvenue\b/, /\bmap\b/, /\brooms?\b/, /\bstage\b/, /\b(level|floor)\b/, /\bdesk\b/, /\b(toilets?|bathrooms?|restrooms?)\b/, /\bdirections?\b/, /\baddress\b/, /\blocation\b/],
    fallback: /\bwhere\b/,
    reply: ({ eventId, event }) => ({
      text: `Rooms, stages and the registration desk are all on the ${event} Venue Map.`,
      action: { label: 'Open Venue Map', icon: 'location-outline', href: eventHref(eventId, 'map') },
    }),
  },
  {
    words: [/\bpark(ing)?\b/, /\bcar\b/, /\b(taxi|uber|rideshare)\b/, /\b(train|bus|tram|transport)\b/, /\bairport\b/, /\bget there\b/],
    reply: ({ eventId }) => ({
      text: 'Getting there and parking depend on the venue — the Venue Map has the address. For anything specific, tap Connect and the team will help.',
      action: { label: 'Open Venue Map', icon: 'location-outline', href: eventHref(eventId, 'map') },
    }),
  },
  {
    words: [/\bhotels?\b/, /\baccommodation\b/, /\bstay(ing)?\b/, /\bcheck[- ]?(in|out)\b/, /\bbooking\b/],
    reply: ({ eventId, event }) => ({
      text: `Accommodation for ${event} is on the Hotel screen.`,
      action: { label: 'Open hotel details', icon: 'bed-outline', href: eventHref(eventId, 'hotel') },
    }),
  },
  {
    words: [/\bweather\b/, /\brain(ing|y)?\b/, /\btemperature\b/, /\bforecast\b/, /\bumbrella\b/, /\b(hot|cold|warm|sunny)\b/],
    reply: ({ eventId, event }) => ({
      text: `The Weather screen has the forecast for ${event}.`,
      action: { label: 'Check the weather', icon: 'partly-sunny-outline', href: eventHref(eventId, 'weather') },
    }),
  },
  {
    words: [/\bpack(ing)?\b/, /\bbring\b/, /\bwear\b/, /\bdress( code)?\b/, /\battire\b/],
    reply: ({ eventId, event }) => ({
      text: `The What to Pack list for ${event} covers what to bring and wear.`,
      action: { label: 'What to pack', icon: 'bag-handle-outline', href: eventHref(eventId, 'pack') },
    }),
  },
  {
    words: [/\bnotes?\b/, /\binsights?\b/, /\brecord(ing)?\b/],
    reply: () => ({
      text: 'Your notes live in Insights — write, record or photograph them during sessions.',
      action: { label: 'Open Insights', icon: 'bulb-outline', href: '/insights' },
    }),
  },
  {
    words: [/\bpartners?\b/, /\bsponsors?\b/, /\bexhibitors?\b/, /\bbooths?\b/],
    reply: () => ({
      text: 'Our partners, what they offer and how to reach them are under REGROWTH Partners.',
      action: { label: 'Meet our partners', icon: 'business-outline', href: '/connect/partners' },
    }),
  },
  {
    words: [/\bpodcasts?\b/, /\bepisodes?\b/, /\blisten\b/],
    reply: () => ({
      text: 'Every Impact & Influence episode is in the app, ready to play.',
      action: { label: 'Open the podcast', icon: 'headset-outline', href: '/connect/podcast' },
    }),
  },
];

const GREETING = /^(hi|hello|hey|g'?day|good (morning|afternoon|evening))\b/;
const THANKS = /\b(thanks|thank you|cheers)\b/;

const HANDOFF =
  'Thanks — I’ve asked the REGROWTH team to join this chat. A person will reply here, so check back in a little while.';
const FALLBACK =
  'I’m an automated assistant, so I can only answer common questions. Tap Connect below and a person from the REGROWTH team will pick this up here.';
const WITH_TEAM = 'The team has your message and will reply here.';

/** Once a person has replied, the assistant stays quiet for this long. */
const HUMAN_WINDOW_MS = 2 * 60 * 60 * 1000;

function eventName(eventId: string) {
  return productFor(eventId)?.short ?? 'your event';
}

export function greeting(ctx: AssistantContext) {
  const hi = ctx.firstName ? `Hi ${ctx.firstName}` : 'Hi';
  return `${hi}, I’m the REGROWTH Assistant. I answer common event questions automatically — the agenda, venue, hotel, weather and your ticket. For anything else, tap Connect to reach the team.`;
}

/** The automated answer to one message. `teamAsked`: the team is already on it. */
export function answer(body: string, ctx: AssistantContext, teamAsked = false): Reply {
  const text = body.toLowerCase().replace(/[’']/g, "'");
  let best: Topic | null = null;
  let bestScore = 0;
  for (const topic of TOPICS) {
    const score = topic.words.filter((w) => w.test(text)).length;
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  best ??= TOPICS.find((t) => t.fallback?.test(text)) ?? null;
  if (best) return best.reply({ eventId: ctx.eventId, event: eventName(ctx.eventId) });
  if (THANKS.test(text)) return { text: 'You’re welcome!' };
  if (GREETING.test(text.trim())) {
    return { text: `Hi${ctx.firstName ? ` ${ctx.firstName}` : ''}! Ask me about the agenda, venue, hotel, weather or your ticket — or tap Connect to reach the team.` };
  }
  return { text: teamAsked ? WITH_TEAM : FALLBACK };
}

/**
 * The conversation as shown: the greeting, then each message with the
 * assistant's answer under it. After the attendee asks for the team, answers
 * stop nagging them to tap Connect; after a person replies, the assistant
 * stands back for a couple of hours.
 */
export function buildThread(rows: SupportMessage[], ctx: AssistantContext, startedAt: string): ChatItem[] {
  const items: ChatItem[] = [{ kind: 'assistant', id: 'greeting', text: greeting(ctx), at: rows[0]?.created_at ?? startedAt }];
  let teamAsked = false;
  let lastStaffAt = 0;
  for (const row of rows) {
    if (row.from_staff) {
      items.push({ kind: 'staff', id: row.id, text: row.body, at: row.created_at });
      lastStaffAt = Date.parse(row.created_at);
      continue;
    }
    items.push({ kind: 'user', id: row.id, text: row.body, at: row.created_at, pending: row.pending });
    if (row.needs_human) {
      teamAsked = true;
      items.push({ kind: 'assistant', id: `${row.id}-reply`, text: HANDOFF, at: row.created_at });
      continue;
    }
    if (lastStaffAt && Date.parse(row.created_at) - lastStaffAt < HUMAN_WINDOW_MS) continue;
    const reply = answer(row.body, ctx, teamAsked);
    items.push({ kind: 'assistant', id: `${row.id}-reply`, text: reply.text, action: reply.action, at: row.created_at });
  }
  return items;
}

/**
 * Where the team is in this conversation: not involved yet (`ready`), asked
 * and not yet replied (`waiting`), or replied within the last couple of hours
 * (`with-team`).
 */
export function teamStatus(rows: SupportMessage[], now = Date.now()): 'ready' | 'waiting' | 'with-team' {
  let waiting = false;
  let lastStaffAt = 0;
  for (const row of rows) {
    if (row.from_staff) {
      waiting = false;
      lastStaffAt = Date.parse(row.created_at);
    } else if (row.needs_human) {
      waiting = true;
    }
  }
  if (waiting) return 'waiting';
  return lastStaffAt && now - lastStaffAt < HUMAN_WINDOW_MS ? 'with-team' : 'ready';
}

/** "9:41 am" */
export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

/**
 * The comp's ambient glow over the header. CSS draws the radial gradient on
 * the web; native falls back to a flat wash, as the Continue Learning
 * gradient does (lib/theme.ts). Both are the brand ocean.
 */
export const supportGlow = {
  web: 'radial-gradient(70% 60% at 50% 0%, rgba(17,103,109,0.55) 0%, rgba(17,103,109,0.12) 55%, rgba(17,103,109,0) 100%)',
  native: 'rgba(17,103,109,0.14)',
} as const;

// --- Dictation ------------------------------------------------------------
// The input bar's mic dictates into the message on browsers with the Web
// Speech API (Chrome, Safari). Elsewhere the mic is hidden rather than shown
// and broken, as SearchField does.

type SpeechResultList = ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: SpeechResultList }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function recognitionClass(): (new () => Recognition) | null {
  if (Platform.OS !== 'web') return null;
  const w = globalThis as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function dictationAvailable() {
  return !!recognitionClass();
}

/** Starts dictation; returns a stop function. `onText` gets the running transcript. */
export function startDictation(onText: (text: string) => void, onEnd: () => void): () => void {
  const Klass = recognitionClass();
  if (!Klass) {
    onEnd();
    return () => {};
  }
  const r = new Klass();
  r.lang = 'en-AU';
  r.interimResults = true;
  r.continuous = false;
  r.onresult = (e) => {
    let text = '';
    for (let i = 0; i < e.results.length; i++) text += e.results[i][0]?.transcript ?? '';
    onText(text);
  };
  r.onend = onEnd;
  r.onerror = onEnd;
  try {
    r.start();
  } catch {
    onEnd();
  }
  return () => r.stop();
}
