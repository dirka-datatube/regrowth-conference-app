import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import type { ScanCameraHandle, ScanCameraProps } from '@/lib/scan';

/**
 * Native camera for Scan QR: expo-camera's CameraView with the platform
 * barcode scanner, as ScannerModal uses. The web build resolves
 * ScanCamera.web.tsx instead.
 */

/** The QR in a photo from the gallery, or null. */
export async function decodeImage(uri: string): Promise<string | null> {
  const [hit] = await scanFromURLAsync(uri, ['qr']);
  return hit?.data ?? null;
}

export const ScanCamera = forwardRef<ScanCameraHandle, ScanCameraProps>(function ScanCamera(
  { paused, onCode, onState },
  ref,
) {
  const camera = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  // Ask once on arrival; after a refusal the window offers to ask again.
  const asked = useRef(false);

  useEffect(() => {
    if (!permission) {
      onState('starting');
    } else if (permission.granted) {
      onState('live');
    } else if (!asked.current && permission.canAskAgain) {
      asked.current = true;
      onState('starting');
      requestPermission();
    } else {
      onState('denied');
    }
  }, [permission, requestPermission, onState]);

  useImperativeHandle(
    ref,
    () => ({
      capture: async () => {
        const photo = await camera.current?.takePictureAsync({ quality: 0.6 });
        if (!photo) return null;
        const [hit] = await scanFromURLAsync(photo.uri, ['qr']);
        return hit?.data ?? null;
      },
      retry: () => {
        if (permission?.canAskAgain) requestPermission();
        else Linking.openSettings();
      },
    }),
    [permission, requestPermission],
  );

  if (!permission?.granted) return null;
  return (
    <CameraView
      ref={camera}
      style={StyleSheet.absoluteFill}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={paused ? undefined : ({ data }) => onCode(data)}
    />
  );
});
