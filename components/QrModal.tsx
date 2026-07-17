import { Modal, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { T } from './Type';

// Personal QR — payload is "regrowth:<qr_token>" so scanners can reject
// arbitrary third-party codes before hitting the server.
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
      <View className="flex-1 bg-moment/95 items-center justify-center px-6">
        <Pressable onPress={onClose} className="absolute top-16 right-6" hitSlop={10}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>

        <T variant="caption" className="text-moment-soft">Your QR</T>
        <T variant="h2" className="mt-2 text-center text-moment-ink">{name}</T>
        {subtitle && <T variant="small" className="mt-1 text-center text-moment-soft">{subtitle}</T>}

        <View className="bg-cloud rounded-card p-6 mt-6">
          <QRCode
            value={`regrowth:${token}`}
            size={220}
            color="#04072F"
            backgroundColor="#DCD9D0"
          />
        </View>
        <T variant="small" className="mt-6 text-center text-moment-soft px-6">
          Have someone scan this to swap details. We'll handle the rest.
        </T>
      </View>
    </Modal>
  );
}
