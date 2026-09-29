import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { decodeImageWithCanvas, decodePixels, type ScanCameraHandle, type ScanCameraProps } from '@/lib/scan';

/**
 * Web camera for Scan QR: the rear camera through getUserMedia in a <video>,
 * with frames drawn to a canvas and decoded by jsQR (lib/scan.ts) a few times
 * a second, and on capture. getUserMedia needs a secure context (HTTPS or
 * localhost); without it, or without a camera, the window says so and Upload
 * From Gallery still works.
 */

const SCAN_EVERY_MS = 250;

/** The QR in a photo from the gallery, or null — same API as the native module. */
export const decodeImage = decodeImageWithCanvas;

/** Frames are scaled to this long side before decoding — plenty for a badge. */
const MAX_SIDE = 720;

export const ScanCamera = forwardRef<ScanCameraHandle, ScanCameraProps>(function ScanCamera(
  { paused, onCode, onState },
  ref,
) {
  const video = useRef<HTMLVideoElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Latest props for the timer and the camera promise, without restarting them.
  const live = useRef({ paused, onCode, onState });
  useEffect(() => {
    live.current = { paused, onCode, onState };
  });

  const readFrame = useCallback((thorough: boolean) => {
    const v = video.current;
    if (!v || !stream.current || v.readyState < 2 || !v.videoWidth) return null;
    const scale = Math.min(1, MAX_SIDE / Math.max(v.videoWidth, v.videoHeight));
    const w = Math.round(v.videoWidth * scale);
    const h = Math.round(v.videoHeight * scale);
    const c = canvas.current ?? (canvas.current = document.createElement('canvas'));
    if (c.width !== w) c.width = w;
    if (c.height !== h) c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(v, 0, 0, w, h);
    return decodePixels(ctx.getImageData(0, 0, w, h).data, w, h, thorough);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const media = typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
    if (!media?.getUserMedia) {
      live.current.onState('unavailable');
      return;
    }
    live.current.onState('starting');
    media
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = s;
        const v = video.current;
        if (v) {
          v.srcObject = s;
          v.muted = true;
          await v.play().catch(() => {});
        }
        live.current.onState('live');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const name = (e as { name?: string } | null)?.name;
        live.current.onState(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable');
      });
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (live.current.paused) return;
      const found = readFrame(false);
      if (found) live.current.onCode(found);
    }, SCAN_EVERY_MS);
    return () => clearInterval(timer);
  }, [readFrame]);

  useImperativeHandle(
    ref,
    () => ({
      capture: async () => readFrame(true),
      retry: () => setAttempt((n) => n + 1),
    }),
    [readFrame],
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <video ref={video} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </View>
  );
});
