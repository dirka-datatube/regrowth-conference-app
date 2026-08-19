import { Platform } from 'react-native';

/**
 * Media capture capability — the honest platform check.
 *
 * Decision 2026-08-18: the event app ships as a PWA, not a native iOS app.
 * That choice is right for install friction but it costs us background media
 * capture, and AI note-taking depends on exactly that. The constraint:
 *
 *   • Native — MediaRecorder equivalents keep running with the screen locked.
 *     A 45-minute keynote can be recorded with the phone in a pocket.
 *   • Browser — MediaRecorder is suspended when the tab is backgrounded or the
 *     screen locks. Recording only survives while the page is visible.
 *
 * So we do not offer long-form audio capture on the web and then silently drop
 * half the recording. `canRecordInBackground()` tells callers which world they
 * are in, and the UI adapts: the Insights capture menu hides voice/video where
 * they cannot work, and the recorder screen warns where they only half-work.
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
