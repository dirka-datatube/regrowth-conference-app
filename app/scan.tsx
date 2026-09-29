import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScanCamera, decodeImage } from '@/components/connect/ScanCamera';
import { ScanWindow } from '@/components/connect/ScanWindow';
import {
  classifyScan,
  pickImageUri,
  type CameraState,
  type ScanCameraHandle,
  type ScanResult,
} from '@/lib/scan';
import { colors } from '@/lib/theme';

/**
 * Scan QR (237:888) — full screen, outside the tabs.
 *
 * The camera reads continuously; the round button captures and decodes the
 * current frame; Upload From Gallery decodes a photo, which needs no camera
 * permission at all (lib/scan.ts). A REGROWTH badge opens its /c/<token> page,
 * which offers Connect. Anything else is shown for what it is — a link can be
 * opened, nothing is followed automatically.
 *
 * The camera feed is the comp's background image.
 */

type Other = Exclude<ScanResult, { kind: 'badge' }>;

const CAMERA_COPY: Record<Exclude<CameraState, 'live'>, { title: string; body: string }> = {
  starting: {
    title: 'Starting the camera…',
    body: 'Allow camera access when you’re asked.',
  },
  denied: {
    title: 'Camera access is off',
    body: 'Allow camera access for REGROWTH in your settings, or upload a photo of the QR code.',
  },
  unavailable: {
    title: 'No camera available',
    body: 'Upload a photo of the QR code from your gallery instead.',
  },
};

export default function ScanQr() {
  const camera = useRef<ScanCameraHandle>(null);
  const [cameraState, setCameraState] = useState<CameraState>('starting');
  const [result, setResult] = useState<Other | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const leaving = useRef(false);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const handle = useCallback((data: string | null, from: 'camera' | 'capture' | 'gallery') => {
    if (leaving.current) return;
    if (!data) {
      setNotice(from === 'gallery' ? 'No QR code found in that image.' : 'No QR code in view — hold it inside the frame.');
      return;
    }
    const scanned = classifyScan(data);
    if (scanned.kind === 'badge') {
      leaving.current = true;
      router.replace(`/c/${encodeURIComponent(scanned.token)}` as never);
      return;
    }
    setNotice(null);
    setResult(scanned);
  }, []);

  const onCode = useCallback((data: string) => handle(data, 'camera'), [handle]);

  async function capture() {
    if (cameraState !== 'live') {
      setNotice('The camera is off — upload a photo instead.');
      return;
    }
    setBusy(true);
    try {
      handle((await camera.current?.capture()) ?? null, 'capture');
    } catch {
      setNotice('That didn’t work — try again.');
    } finally {
      setBusy(false);
    }
  }

  async function fromGallery() {
    setNotice(null);
    const uri = await pickImageUri().catch(() => null);
    if (!uri) return;
    setResult(null);
    setBusy(true);
    try {
      handle(await decodeImage(uri), 'gallery');
    } catch {
      setNotice('We couldn’t read that image.');
    } finally {
      setBusy(false);
    }
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const copy = cameraState === 'live' ? null : CAMERA_COPY[cameraState];

  return (
    <View className="flex-1 overflow-hidden bg-midnight">
      <StatusBar style="light" />
      <ScanCamera ref={camera} paused={!!result || busy} onCode={onCode} onState={setCameraState} />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="z-10 flex-row justify-end px-4 pt-2">
          <Pressable
            onPress={close}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close the scanner"
            className="h-10 w-10 items-center justify-center"
          >
            <Ionicons name="close" size={28} color={colors.snow} />
          </Pressable>
        </View>

        <View className="z-10 gap-y-2 px-[30px]">
          <Text accessibilityRole="header" className="font-data text-[30px] font-semibold leading-[38px] text-snow">
            Scan QR Code
          </Text>
          <Text className="font-body text-[15px] leading-[20px] text-snow/90">
            Point your camera at a QR code and capture it.
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-5 py-6">
          <ScanWindow filled={!!copy}>
            {result ? (
              <ResultCard result={result} onDismiss={() => setResult(null)} />
            ) : (
              copy && (
                <View className="items-center gap-y-2 px-6">
                  {cameraState === 'starting' ? (
                    <ActivityIndicator color={colors.snow} />
                  ) : (
                    <Ionicons name="videocam-off-outline" size={34} color={colors.snow} />
                  )}
                  <Text className="text-center font-data text-[16px] font-semibold text-snow">{copy.title}</Text>
                  <Text className="text-center font-data text-[13px] leading-[18px] text-quiet">{copy.body}</Text>
                  {cameraState === 'denied' && (
                    <Pressable
                      onPress={() => camera.current?.retry()}
                      accessibilityRole="button"
                      className="mt-2 rounded-cta border border-card-line px-4 py-2"
                    >
                      <Text className="font-data text-[13px] font-semibold text-snow">Try again</Text>
                    </Pressable>
                  )}
                </View>
              )
            )}
            {!!notice && (
              <View className="absolute bottom-4 left-4 right-4 items-center">
                <View accessibilityRole="alert" className="rounded-pill bg-midnight/90 px-4 py-2">
                  <Text className="text-center font-data text-[13px] text-snow">{notice}</Text>
                </View>
              </View>
            )}
          </ScanWindow>
        </View>

        <View className="z-10 items-center gap-y-8 pb-6">
          <Pressable
            onPress={fromGallery}
            accessibilityRole="button"
            className="h-12 w-[244px] flex-row items-center justify-center gap-x-2.5 rounded-tile border-2 border-glass-line bg-cloud"
          >
            <Text className="font-data text-[16px] font-semibold text-basalt">Upload From Gallery</Text>
            <Ionicons name="images-outline" size={22} color={colors.basalt} />
          </Pressable>

          <Pressable
            onPress={capture}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Capture and scan"
            accessibilityState={{ busy }}
            className="h-24 w-24 items-center justify-center rounded-pill border-4 border-snow"
          >
            <View className="h-[74px] w-[74px] items-center justify-center rounded-pill bg-snow">
              {busy && <ActivityIndicator color={colors.midnight} />}
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** A code that is not a badge: what it says, and what can be done with it. */
function ResultCard({ result, onDismiss }: { result: Other; onDismiss: () => void }) {
  return (
    <View className="w-[270px] max-w-full gap-y-2 rounded-card border border-card-line bg-midnight/95 p-4">
      <Text className="font-data text-[15px] font-bold text-snow">Not a REGROWTH badge</Text>
      <Text className="font-data text-[12px] leading-[17px] text-quiet" numberOfLines={3}>
        {result.kind === 'link' ? result.url : result.text}
      </Text>
      <View className="mt-1 flex-row gap-x-2">
        {result.kind === 'link' && (
          <Pressable
            onPress={() => Linking.openURL(result.url)}
            accessibilityRole="link"
            className="flex-1 items-center rounded-cta bg-ocean py-2"
          >
            <Text className="font-data text-[13px] font-semibold text-snow">Open link</Text>
          </Pressable>
        )}
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          className="flex-1 items-center rounded-cta border border-card-line py-2"
        >
          <Text className="font-data text-[13px] font-semibold text-snow">Scan again</Text>
        </Pressable>
      </View>
    </View>
  );
}
