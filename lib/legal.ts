/**
 * Terms & Conditions and Privacy Policy — shown on /me/terms and /me/privacy
 * (Figma 227:2863 / 227:2808), and on /legal/[doc] for people who have not
 * signed in yet (the sign-up screen links there).
 *
 * DRAFT. REGROWTH has not supplied its legal copy. This is a structured draft
 * written from what the app actually does — the data it stores, who can see
 * it, the AI features — so the final wording is an edit rather than a blank
 * page. Every screen that shows it carries LEGAL_DRAFT_NOTICE until the real
 * text lands here; drop the notice then.
 */

export const LEGAL_DRAFT_NOTICE = 'Draft — final wording to be supplied by REGROWTH';

export type LegalDocKey = 'terms' | 'privacy';

/** A paragraph, or a bulleted list. */
export type LegalBlock = string | string[];

export type LegalSection = { heading: string; blocks: LegalBlock[] };

export type LegalDoc = {
  key: LegalDocKey;
  title: string;
  /** One-line purpose under the screen title. */
  subtitle: string;
  intro: string;
  sections: LegalSection[];
};

export function isLegalDoc(value: unknown): value is LegalDocKey {
  return value === 'terms' || value === 'privacy';
}

const PRIVACY: LegalDoc = {
  key: 'privacy',
  title: 'Privacy Policy',
  subtitle: 'How we collect, use and protect your information',
  intro:
    'REGROWTH ("we", "us", "our") provides the REGROWTH Events app for people who attend our events, including Navigate and the REGROWTH Study Tour. This policy explains what personal information the app collects, why we collect it, who can see it and the choices you have. We handle personal information in line with the Australian Privacy Principles in the Privacy Act 1988 (Cth).',
  sections: [
    {
      heading: 'Information we collect',
      blocks: [
        'We collect information you give us and information created as you use the app:',
        [
          'Account details — your name, email address, phone number and password. Your password is never visible to us.',
          'Registration details — the events you are registered for, your ticket type and whether you have checked in.',
          'Profile details you choose to add — your photo, role, company, a short bio, interests and dietary requirements.',
          'Networking activity — the people you connect with by scanning a badge QR code, and the contact details read from business cards you photograph.',
          'Content you create — notes, voice and photo notes, saved sessions, questions you ask in sessions, ratings and messages you send us.',
          'Device information — a notification token if you allow notifications, and your location only while you use a feature that needs it, such as checking in at the venue.',
        ],
      ],
    },
    {
      heading: 'How we use your information',
      blocks: [
        [
          'To run the app: your tickets and entry badge, the agenda, your saved sessions and your notes.',
          'To help you network: showing your profile to other attendees at the same event, according to your profile visibility setting.',
          'To send you the notifications you have switched on, and important announcements about your event.',
          'To provide AI features, such as summarising your notes and reading the details from a business card you photograph.',
          'To improve our events and the app, including from your ratings and feedback.',
          'To keep accounts secure and meet our legal obligations.',
        ],
      ],
    },
    {
      heading: 'Who can see your information',
      blocks: [
        [
          'Other attendees at the same event can see your name, photo, role, company, bio and interests, unless you hide your profile in App Settings → Privacy.',
          'People you connect with can also see your email address, so you can follow up with each other.',
          'Your notes, recordings and saved sessions are private to you.',
          'The REGROWTH team can see the information needed to run our events and support you.',
        ],
        'We do not sell your personal information.',
      ],
    },
    {
      heading: 'Service providers',
      blocks: [
        'We use trusted providers to host the app and its database, send notifications and emails, manage our contact lists and power the AI features. They may only use your information to provide their service to us. Some of these providers store or process information outside Australia, including in the United States.',
      ],
    },
    {
      heading: 'Marketing',
      blocks: [
        'We only send you marketing emails about future events and programs if you have agreed to receive them. Every marketing email includes a way to unsubscribe.',
      ],
    },
    {
      heading: 'Storage and security',
      blocks: [
        'Your information is stored with our hosting provider and protected with encryption in transit and access controls that limit it to people who need it. No system is completely secure, so please keep your password private and tell us straight away if you think your account has been misused.',
      ],
    },
    {
      heading: 'How long we keep it',
      blocks: [
        'We keep your information while you have an account and for as long as we need it for the purposes above or to meet our legal obligations. After that we delete it or remove the details that identify you.',
      ],
    },
    {
      heading: 'Your choices',
      blocks: [
        [
          'Update your profile at any time in Edit Profile.',
          'Choose who can see your profile in App Settings → Privacy.',
          'Turn notifications on or off in App Settings or on the Alerts tab.',
          'Ask us for a copy of your information, to correct it, or to delete your account, using the Contact screen.',
        ],
      ],
    },
    {
      heading: 'Questions and complaints',
      blocks: [
        'If you have a question or a concern about how we handle your information, contact us first through the Contact screen and we will work with you to resolve it. If you are not satisfied with our response, you can contact the Office of the Australian Information Commissioner (oaic.gov.au).',
      ],
    },
    {
      heading: 'Changes to this policy',
      blocks: [
        'We may update this policy from time to time. If we make a significant change, we will let you know in the app.',
      ],
    },
  ],
};

const TERMS: LegalDoc = {
  key: 'terms',
  title: 'Terms & Conditions',
  subtitle: 'The terms for using the REGROWTH Events app',
  intro:
    'These terms apply to your use of the REGROWTH Events app ("the app"), provided by REGROWTH ("we", "us", "our"). By creating an account or using the app you agree to them. Your event registration is also covered by the terms you accepted when you bought your ticket.',
  sections: [
    {
      heading: 'Your account',
      blocks: [
        [
          'Give us accurate details and keep them up to date.',
          'Keep your password private. You are responsible for what happens in your account.',
          'An account is for one person. Tell us straight away if you think someone else has used yours.',
        ],
      ],
    },
    {
      heading: 'Tickets and entry',
      blocks: [
        'Your entry badge and its QR code are personal to you. Do not share, copy or alter them — we may refuse entry to anyone presenting a badge that is not theirs.',
        'Event details such as the agenda, speakers and venue can change. The app shows the latest information we have.',
      ],
    },
    {
      heading: 'Using the app respectfully',
      blocks: [
        'You agree not to:',
        [
          'harass, abuse or mislead other attendees, speakers, partners or our team;',
          'post or send anything unlawful, offensive or that you do not have the right to share;',
          'use attendee details for bulk marketing or pass them on to others;',
          'try to access another person’s account, or interfere with how the app works.',
        ],
      ],
    },
    {
      heading: 'Networking',
      blocks: [
        'When you connect with someone, you share your profile and email address with them. Only connect with people you are happy to share those details with, and use the details you receive to follow up on your professional relationship.',
      ],
    },
    {
      heading: 'Your content',
      blocks: [
        'You own the notes, photos, recordings, questions and feedback you create. You allow us to store and process them to provide the app to you — for example, to generate an AI summary of your notes. Questions you submit during a session may be shown to the speaker and the room, without your name if you ask anonymously.',
      ],
    },
    {
      heading: 'AI features',
      blocks: [
        'Summaries, suggestions and details read from business cards are generated automatically and can contain mistakes. Check anything important before you rely on it.',
      ],
    },
    {
      heading: 'Recording sessions',
      blocks: [
        'Recording is for your personal notes. Respect any request from a speaker or from us not to record, and do not publish or share recordings of sessions.',
      ],
    },
    {
      heading: 'Our content',
      blocks: [
        'The agenda, templates, resources and other material in the app belong to REGROWTH or the people who licensed them to us. You may use them for your own professional development and business, but you may not resell, republish or distribute them.',
      ],
    },
    {
      heading: 'Availability',
      blocks: [
        'We work to keep the app available and accurate, but we cannot promise it will always be uninterrupted or error-free. We may change, suspend or stop any part of it.',
      ],
    },
    {
      heading: 'Liability',
      blocks: [
        'To the extent the law allows, we are not liable for loss arising from your use of the app. Nothing in these terms excludes, restricts or modifies any right or remedy you have under the Australian Consumer Law.',
      ],
    },
    {
      heading: 'Suspending or closing an account',
      blocks: [
        'We may suspend or close an account that breaks these terms. You can ask us to close your account at any time through the Contact screen.',
      ],
    },
    {
      heading: 'Changes to these terms',
      blocks: [
        'We may update these terms from time to time. If we make a significant change, we will let you know in the app. Continuing to use the app after a change means you accept the updated terms.',
      ],
    },
    {
      heading: 'Contact us',
      blocks: ['Questions about these terms? Get in touch through the Contact screen in the app.'],
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = { terms: TERMS, privacy: PRIVACY };
