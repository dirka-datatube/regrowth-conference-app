import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { captureId, type DeviceCapture } from '@/lib/recording';

/**
 * Photo and video capture for a note, through expo-image-picker: the camera
 * on native, the browser's file picker on the web (which offers the camera on
 * a phone). What comes back is kept on the device — see useDeviceCaptures.
 */

export type PickResult =
  | { kind: 'picked'; capture: DeviceCapture }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string };

const CAMERA_OFF = 'Camera access is off. Turn it on for REGROWTH in Settings to add a photo or video.';

async function cameraAllowed(): Promise<boolean> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  return permission.granted;
}

export async function pickPhoto(): Promise<PickResult> {
  try {
    let result: ImagePicker.ImagePickerResult;
    if (Platform.OS === 'web') {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
    } else {
      if (!(await cameraAllowed())) return { kind: 'error', message: CAMERA_OFF };
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    }
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return { kind: 'cancelled' };
    return {
      kind: 'picked',
      capture: { kind: 'photo', id: captureId(), uri: asset.uri, width: asset.width, height: asset.height },
    };
  } catch {
    return { kind: 'error', message: 'The camera could not open. Try again.' };
  }
}

/** Native only — the web build sends video capture to the app. */
export async function recordVideo(): Promise<PickResult> {
  try {
    if (!(await cameraAllowed())) return { kind: 'error', message: CAMERA_OFF };
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 600,
    });
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return { kind: 'cancelled' };
    return {
      kind: 'picked',
      capture: { kind: 'video', id: captureId(), uri: asset.uri, durationMs: asset.duration ?? null },
    };
  } catch {
    return { kind: 'error', message: 'The camera could not open. Try again.' };
  }
}
