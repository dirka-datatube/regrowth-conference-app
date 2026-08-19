import { Platform } from 'react-native';

/**
 * Media capture capability — the honest platform check.
 *
 * Decision history:
 *   2026-08-18 — ship as a PWA, not a native iOS app. Right for install
 *     friction, but it costs background media capture, and AI note-taking
 *     depends on exactly that.
 *   2026-08-19 — **the hybrid native wrapper was bought.** The mobile website
 *     stays the primary surface (no download barrier, keeps Squarespace
 *     traffic), and a thin native build ships alongside it for attendees who
 *     want push notifications and session recording.
 *
 * That second decision changes how this module is used. Previously the UI
 * hid what the browser could not do. Now there is somewhere to send people:
 * the browser build offers the feature and explains that it needs the app,
 * rather than silently dropping it.
 *
 * The constraint that drove the purchase:
 *   • Native — with `UIBackgroundModes: ["audio"]` (app.json) plus
 *     `Audio.setAudioModeAsync({ staysActiveInBackground: true })`, recording
 *     survives a locked screen. A 45-minute keynote records with the phone in
 *     a pocket.
 *   • Browser — MediaRecorder is suspended when the tab is backgrounded or the
 *     screen locks. Recording only survives while the page is visible.
 *
 * See docs/SPEC-V3-GAP-ANALYSIS.md §4 for the commercial framing.
 */

export type RecordingSupport =
  | 'background' // native: records with the app backgrounded / screen locked
  | 'foreground' // browser: records only while the page is visible
  | 'unsupported'; // no MediaRecorder / no getUserMedia

export function canRecordInBackground(): RecordingSupport {
  if (Platform.OS !== 'web') return 'background';

  const g = globalThis as unknown as {
    MediaRecorder?: unknown;
    navigator?: { mediaDevices?: { getUserMedia?: unknown } };
  };
  const hasRecorder = typeof g.MediaRecorder !== 'undefined';
  const hasStream = typeof g.navigator?.mediaDevices?.getUserMedia === 'function';

  return hasRecorder && hasStream ? 'foreground' : 'unsupported';
}

/**
 * What to tell someone before they start a long recording. `null` means just
 * record — no caveat applies.
 */
export function recordingCaveat(): string | null {
  switch (canRecordInBackground()) {
    case 'background':
      return null;
    case 'foreground':
      return 'Keep this screen open while recording — your browser stops capture if the screen locks. The REGROWTH app records with your phone in your pocket.';
    case 'unsupported':
      return 'This browser cannot record audio. Use the REGROWTH app to record a session.';
  }
}

/** True when only the native app can deliver this — drives the app upsell. */
export function needsNativeApp(): boolean {
  return Platform.OS === 'web' && canRecordInBackground() !== 'background';
}

/**
 * Where to send someone who wants the native build. Populated once the first
 * EAS builds are submitted — until then the upsell links to the install
 * instructions page rather than a dead store URL.
 */
export const NATIVE_APP = {
  ios: null as string | null,
  android: null as string | null,
  /** Fallback while the store listings do not exist yet. */
  fallback: '/get-the-app',
} as const;

export function nativeAppLink(): string {
  const ua = (globalThis as unknown as { navigator?: { userAgent?: string } }).navigator?.userAgent ?? '';
  if (/iPad|iPhone|iPod/.test(ua) && NATIVE_APP.ios) return NATIVE_APP.ios;
  if (/Android/.test(ua) && NATIVE_APP.android) return NATIVE_APP.android;
  return NATIVE_APP.fallback;
}

/**
 * True when the page is installed to the home screen. iOS only grants web push
 * — and keeps a more forgiving storage/permission lifetime — for installed
 * PWAs, so several features key off this.
 */
export function isInstalledPwa(): boolean {
  if (Platform.OS !== 'web') return true;
  const w = globalThis as unknown as {
    matchMedia?: (q: string) => { matches: boolean };
    navigator?: { standalone?: boolean };
  };
  return (
    w.matchMedia?.('(display-mode: standalone)').matches === true ||
    w.navigator?.standalone === true
  );
}

/**
 * Detect an in-app browser (Instagram, LinkedIn, Gmail, Outlook…). These
 * routinely block camera access, which matters at a conference where people
 * open links straight from an email. Callers prompt "Open in Safari".
 */
export function isInAppBrowser(): boolean {
  if (Platform.OS !== 'web') return false;
  const ua = (globalThis as unknown as { navigator?: { userAgent?: string } }).navigator?.userAgent;
  if (!ua) return false;
  return /FBAN|FBAV|Instagram|LinkedInApp|Twitter|Line\/|MicroMessenger|OutlookMobile/i.test(ua);
}
