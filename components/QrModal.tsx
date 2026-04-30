import { Modal, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from './Type';

// Simple SVG-based QR placeholder. Wire `react-native-qrcode-svg` (no extra
// native deps) once it's added: `import QRCode from 'react-native-qrcode-svg'`.
export function QrModal({
  token,
  name,
  subtitle,
  onClose,
}: {
  token: string;
  name: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-midnight/95 items-center justify-center px-6">
        <Pressable onPress={onClose} className="absolute top-16 right-6" hitSlop={10}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>

        <T variant="caption">Your QR</T>
        <T variant="h2" className="mt-2 text-center">{name}</T>
        {subtitle && <T variant="small" className="mt-1 text-center">{subtitle}</T>}

        <View className="bg-cloud rounded-card p-6 mt-6">
          {/* TODO: render <QRCode value={token} size={220} /> once dep is added */}
          <View className="w-56 h-56 bg-midnight items-center justify-center">
            <T variant="caption" className="text-cloud">QR · {token.slice(0, 8)}…</T>
          </View>
        </View>
        <T variant="small" className="mt-6 text-center text-cloud/70 px-6">
          Have someone scan this to swap details. We'll handle the rest.
        </T>
      </View>
    </Modal>
  );
}
