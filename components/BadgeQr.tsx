import QRCode from 'react-native-qrcode-svg';
import { badgeUrl } from '@/lib/qr';
import { colors } from '@/lib/theme';

/**
 * The badge QR — midnight modules on the cloud badge, as on Profile (34:1423).
 *
 * Encodes the badge URL, not the bare token (see lib/qr.ts). No quiet zone is
 * drawn here: every caller sits it inside a cloud frame at least 16px wide,
 * which is the margin a scanner needs.
 */
export function BadgeQr({ token, size = 150 }: { token: string; size?: number }) {
  return (
    <QRCode
      value={badgeUrl(token)}
      size={size}
      color={colors.midnight}
      backgroundColor={colors.cloud}
      ecl="M"
    />
  );
}
