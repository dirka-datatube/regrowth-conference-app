import { Modal, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from './Type';
import { BadgeQr } from './BadgeQr';
import { colors } from '@/lib/theme';

/**
 * Full-screen QR, for holding a phone up to a scanner. Used for swapping
 * details (Connections) and for showing an entry badge (the Events ticket card).
 */
export function QrModal({
  token,
  name,
  subtitle,
  note = "Have someone scan this to swap details. We'll handle the rest.",
  onClose,
}: {
  token: string;
  name: string;
  subtitle?: string;
  note?: string;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-midnight/95 px-6">
        <Pressable
          onPress={onClose}
          className="absolute right-6 top-16"
          hitSlop={10}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={28} color={colors.snow} />
        </Pressable>

        <T variant="caption">Your QR</T>
        <T variant="h2" className="mt-2 text-center">{name}</T>
        {subtitle && <T variant="small" className="mt-1 text-center">{subtitle}</T>}

        <View className="mt-6 rounded-card bg-cloud p-6" accessibilityLabel={`QR code for ${name}`}>
          <BadgeQr token={token} size={224} />
        </View>
        <T variant="small" className="mt-6 px-6 text-center text-cloud/70">
          {note}
        </T>
      </View>
    </Modal>
  );
}
