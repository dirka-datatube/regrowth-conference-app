import * as ImagePicker from 'expo-image-picker';
import jsQR from 'jsqr';
import { tokenFromQr } from '@/lib/qr';

/**
 * Scan QR (237:888) — what the scanner reads, and the gallery fallback.
 *
 * The web decodes with jsQR on a canvas, bundled with the app: the browser
 * scanner inside expo-camera fetches its decoder from a CDN at runtime, which
 * a conference network or an offline PWA cannot count on (importing
 * expo-camera on the web starts that fetch, so only the native camera module
 * does). Native uses the platform scanners through expo-camera — see
 * components/connect/ScanCamera(.web).tsx, which also export decodeImage().
 */

/** What the camera is doing, as the scanner window shows it. */
export type CameraState = 'starting' | 'live' | 'denied' | 'unavailable';

export type ScanCameraHandle = {
  /** Decode the current frame now — the capture button. */
  capture: () => Promise<string | null>;
  /** Ask for the camera again after access was refused. */
  retry: () => void;
};

export type ScanCameraProps = {
  /** Stop reading frames, e.g. while a result is on screen. */
  paused: boolean;
  onCode: (data: string) => void;
  onState: (state: CameraState) => void;
};

export type ScanResult =
  | { kind: 'badge'; token: string }
  | { kind: 'link'; url: string }
  | { kind: 'text'; text: string };

/** A REGROWTH badge (lib/qr.ts), a web link, or anything else. */
export function classifyScan(data: string): ScanResult {
  const token = tokenFromQr(data);
  if (token) return { kind: 'badge', token };
  const text = data.trim();
  if (/^https?:\/\/\S+$/i.test(text)) return { kind: 'link', url: text };
  return { kind: 'text', text };
}

/**
 * Decode a QR from RGBA pixels. `thorough` also tries inverted codes (light on
 * dark), which costs a second pass — used for captures and photos, not for
 * every live frame.
 */
export function decodePixels(data: Uint8ClampedArray, width: number, height: number, thorough = false) {
  return jsQR(data, width, height, { inversionAttempts: thorough ? 'attemptBoth' : 'dontInvert' })?.data ?? null;
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = uri;
  });
}

/**
 * The QR in a photo, decoded on a canvas (the web). Photos are scaled down for
 * speed first, then tried at full size (up to 2048px).
 */
export async function decodeImageWithCanvas(uri: string): Promise<string | null> {
  const img = await loadImage(uri);
  const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  for (const side of [1024, 2048]) {
    const scale = Math.min(1, side / longest);
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const found = decodePixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, true);
    if (found || scale === 1) return found;
  }
  return null;
}

/**
 * Upload From Gallery. On the web this is a file input, so it needs no camera
 * permission at all. A cancelled web picker never resolves — callers must not
 * hold a spinner on it.
 */
export async function pickImageUri(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });
  if (res.canceled || !res.assets?.length) return null;
  return res.assets[0].uri;
}
