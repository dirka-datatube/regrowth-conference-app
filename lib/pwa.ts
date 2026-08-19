import { Platform } from 'react-native';
import { isInstalledPwa } from './capture';

/**
 * PWA plumbing — service worker registration and the install prompt.
 *
 * Why this matters commercially: iOS grants web push only to pages the user
 * has added to their home screen. Session reminders are the most-used feature
 * of a conference app, so "installed" is the difference between the app
 * working and half-working. We therefore ask, once, at a sensible moment.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

/** Subscribe to install-availability changes. Returns an unsubscribe fn. */
export function onInstallAvailabilityChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function registerServiceWorker() {
  if (Platform.OS !== 'web') return;
  const nav = globalThis.navigator as Navigator | undefined;
  if (!nav || !('serviceWorker' in nav)) return;

  globalThis.addEventListener?.('load', () => {
    nav.serviceWorker.register('/sw.js').catch(() => {
      // A failed registration costs offline caching and push, not the app.
    });
  });

  // Chromium fires this when the app is installable; Safari never does, which
  // is why iOS gets the manual instructions in InstallPrompt.
  globalThis.addEventListener?.('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  globalThis.addEventListener?.('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

/** True when the browser has offered us a native install prompt to fire. */
export function canPromptInstall() {
  return deferredPrompt !== null;
}

/** Fire the browser's install prompt. Resolves true if the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === 'accepted';
}

export type InstallState =
  | 'installed' // running standalone, or native
  | 'promptable' // browser will show a one-tap install
  | 'manual-ios' // Safari: needs Share → Add to Home Screen
  | 'unavailable';

export function getInstallState(): InstallState {
  if (Platform.OS !== 'web') return 'installed';
  if (isInstalledPwa()) return 'installed';
  if (deferredPrompt) return 'promptable';

  const ua = (globalThis.navigator as Navigator | undefined)?.userAgent ?? '';
  const isIos = /iPad|iPhone|iPod/.test(ua);
  return isIos ? 'manual-ios' : 'unavailable';
}

/**
 * One line describing where the user is running, for the "Get the app" page.
 * Keeps the two surfaces legible rather than leaving people guessing which
 * one they are on.
 */
export function getInstallStateLabel(): string {
  if (Platform.OS !== 'web') return 'You are using the REGROWTH app.';
  switch (getInstallState()) {
    case 'installed':
      return 'You have added REGROWTH to your home screen.';
    case 'promptable':
      return 'Tip: add REGROWTH to your home screen for a full-screen view.';
    case 'manual-ios':
      return 'Tip: tap Share, then "Add to Home Screen" for a full-screen view and reminders.';
    default:
      return 'You are using REGROWTH in a browser.';
  }
}
