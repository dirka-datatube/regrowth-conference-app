import { env } from '@/lib/env';

/**
 * Badge QR payloads.
 *
 * A badge encodes a URL — `<APP_URL>/c/<token>` — not a bare token. A phone's
 * own camera app offers to open a URL, so a badge can be scanned by someone who
 * has never installed anything. That is the PWA check-in approach recommended
 * in docs/SPEC-V3-GAP-ANALYSIS.md.
 *
 * The in-app scanner accepts both shapes, so codes shown before this change
 * still scan.
 */

export const APP_URL = (env.appUrl || 'https://app.regrowth.au').replace(/\/+$/, '');

export function badgeUrl(token: string): string {
  return `${APP_URL}/c/${encodeURIComponent(token)}`;
}

const TOKEN = /^[A-Za-z0-9_-]{8,128}$/;

/** The token inside a scanned payload, or null if it is not a badge. */
export function tokenFromQr(data: string): string | null {
  const raw = data.trim();
  const match = raw.match(/\/c\/([^/?#]+)\/?(?:[?#].*)?$/);
  let candidate = raw;
  if (match) {
    try {
      candidate = decodeURIComponent(match[1]);
    } catch {
      return null; // malformed escape — not one of ours
    }
  }
  return TOKEN.test(candidate) ? candidate : null;
}
