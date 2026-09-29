import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Photos for Edit Profile (headshot) and business card capture, as base64 —
 * what the headshots upload and the business-card-ocr function both take.
 *
 * A browser hands back the original file, often several megabytes from a phone
 * camera, and ignores the picker's `quality` and crop. On the web the photo is
 * redrawn on a canvas at a sensible size instead; native pickers compress and
 * crop themselves.
 */

export type PickedPhoto = { uri: string; base64: string; mime: 'image/jpeg' | 'image/png' };

export async function pickPhoto({
  source,
  maxSide,
  square,
}: {
  /** The web has one file input either way; phones offer the camera from it. */
  source: 'camera' | 'library';
  /** Longest edge in pixels on the web: 800 for a headshot, 1600 to read a card. */
  maxSide: number;
  /** Crop to a square on native (headshots). */
  square?: boolean;
}): Promise<PickedPhoto | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    base64: true,
    quality: 0.7,
    allowsEditing: !!square,
    aspect: square ? [1, 1] : undefined,
  };

  if (source === 'camera' && Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Allow camera access in Settings to take a photo.');
  }
  // A cancelled browser file picker never resolves; callers must not hold a
  // spinner while this is pending.
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? undefined : result.assets?.[0];
  if (!asset) return null;

  if (Platform.OS === 'web') return downscale(asset.uri, maxSide);
  if (!asset.base64) throw new Error('That photo could not be read. Try another.');
  return { uri: asset.uri, base64: asset.base64, mime: asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg' };
}

/** Redraws a picked image (a data: URL on the web) as a JPEG no larger than `maxSide`. */
function downscale(src: string, maxSide: number): Promise<PickedPhoto> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight, 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('That photo could not be read. Try another.'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const uri = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ uri, base64: uri.slice(uri.indexOf(',') + 1), mime: 'image/jpeg' });
    };
    img.onerror = () => reject(new Error('That file is not a photo we can read. Try a JPEG or PNG.'));
    img.src = src;
  });
}
