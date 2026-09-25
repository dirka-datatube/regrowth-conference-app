import { Linking } from 'react-native';
import { router } from 'expo-router';
import type { Ionicons } from '@expo/vector-icons';
import { env } from '@/lib/env';

/**
 * Content the v2 comps show that has no table behind it yet. It lives here, in
 * one place, so Sprint 12 swaps in real copy and imagery without touching a
 * screen.
 */

type Icon = keyof typeof Ionicons.glyphMap;

/**
 * The person on the support chip and the Need Help card. The comps name
 * "Jack Garcia, On-site Support Lead", which is placeholder copy
 * (docs/DESIGN-REVIEW-2026-09.md §3), so the team signs instead.
 */
export const SUPPORT = { name: 'REGROWTH Team', role: 'Event Support' };

/**
 * "Chat with Us" and "Send us a message". In-app chat versus a link-out is
 * Decision 3 on the design epic. Until it is made this opens
 * EXPO_PUBLIC_SUPPORT_URL — a mailto: or WhatsApp link — and falls back to the
 * FAQs, so the button is never dead.
 */
export function openSupport() {
  const url = env.supportUrl;
  if (!url) {
    router.push('/faqs');
    return;
  }
  Linking.openURL(url).catch(() => router.push('/faqs'));
}

export type FeaturedItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: Icon;
  /** Omitted until the destination exists; the card then does not respond. */
  href?: string;
};

/** Home → Featured (132:639). Imagery is a Sprint 12 export. */
export const FEATURED: FeaturedItem[] = [
  { key: 'podcast', title: 'Impact & Influence Podcast', subtitle: 'Audio Interview', icon: 'mic-outline', href: '/podcast' },
  // Templates & Resources is Sprint 11.
  { key: 'resources', title: 'Leadership Resources', subtitle: 'PDF Handouts', icon: 'document-text-outline' },
  { key: 'articles', title: 'Industry Articles', subtitle: 'Lumen Insight', icon: 'newspaper-outline' },
  { key: 'gallery', title: 'Event Photo Gallery', subtitle: 'Live Photos', icon: 'images-outline', href: '/gallery' },
];
