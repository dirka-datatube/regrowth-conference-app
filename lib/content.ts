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
 * "Chat with Us" and "Send us a message" open the in-app support chat
 * (Customer Support, 73:453). EXPO_PUBLIC_SUPPORT_URL — a mailto: or WhatsApp
 * link — overrides it, for running support outside the app.
 */
export function openSupport() {
  const url = env.supportUrl;
  if (!url) {
    router.push('/support');
    return;
  }
  Linking.openURL(url).catch(() => router.push('/support'));
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
  { key: 'podcast', title: 'Impact & Influence Podcast', subtitle: 'Audio Interview', icon: 'mic-outline', href: '/connect/podcast' },
  { key: 'resources', title: 'Leadership Resources', subtitle: 'PDF Handouts', icon: 'document-text-outline', href: '/me/resources' },
  { key: 'articles', title: 'Industry Articles', subtitle: 'Lumen Insight', icon: 'newspaper-outline' },
  { key: 'gallery', title: 'Event Photo Gallery', subtitle: 'Live Photos', icon: 'images-outline', href: '/gallery' },
];
