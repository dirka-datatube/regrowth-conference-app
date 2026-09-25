import { View, Text, Pressable, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/**
 * Alerts are typed and colour-coded by a 2px border (Alerts 71:540):
 * confirmation (teal), action required (red), welcome and other information
 * (earth), and reminders (gold).
 *
 * ICONS — Ionicons stand-ins for the comp's Check Mark, Box Important, About
 * and Alarm illustrations.
 */

export type AlertKind = 'confirm' | 'action' | 'info' | 'reminder';

const KIND: Record<AlertKind, { border: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  confirm: { border: 'border-alert-confirm', icon: 'checkmark-circle', color: colors.alertConfirm },
  action: { border: 'border-alert-action', icon: 'alert-circle', color: colors.alertAction },
  info: { border: 'border-alert-info', icon: 'information-circle', color: colors.alertInfo },
  reminder: { border: 'border-alert-reminder', icon: 'alarm', color: colors.alertReminder },
};

/**
 * Notification type → card kind. The first five types are the ones the push
 * senders use today; the rest name the comp's cards and are sent from
 * Sprint 09 (registration) and Sprint 14 (live alerts).
 */
export function alertKind(type: string): AlertKind {
  switch (type) {
    case 'registration_confirmed':
      return 'confirm';
    case 'action_required':
      return 'action';
    case 'welcome':
    case 'admin_announcement':
      return 'info';
    default:
      return 'reminder'; // session_starting, dont_miss, people_to_meet, countdown…
  }
}

// The glass sheen the comp lays over each card.
const sheen = Platform.select({
  web: { boxShadow: 'inset 2.146px 2px 9.24px 0px rgba(255,255,255,0.13)' },
  default: {},
}) as object;

export function AlertCard({
  kind,
  title,
  body,
  onPress,
}: {
  kind: AlertKind;
  title: string;
  body: string;
  onPress?: () => void;
}) {
  const k = KIND[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={sheen}
      className={`min-h-[66px] flex-row items-center gap-x-3 rounded-note border-2 bg-midnight px-3 py-2.5 ${k.border}`}
    >
      <Ionicons name={k.icon} size={30} color={k.color} />
      <View className="flex-1 gap-y-1">
        <Text className="font-data text-[14px] text-snow">{title}</Text>
        <Text className="font-body text-[12px] leading-[15px] text-snow" numberOfLines={2}>
          {body}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * iOS-style alert dialog on the cloud surface — the countdown modal
 * (79:1243, "Only 5 Days To Go!").
 */
export function AlertDialog({
  title,
  body,
  primary,
  onPrimary,
  onDismiss,
}: {
  title: string;
  body: string;
  primary: string;
  onPrimary: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <View className="flex-1 items-center justify-center bg-basalt/40 px-6">
        <View accessibilityRole="alert" className="w-[270px] overflow-hidden rounded-[14px] bg-cloud">
          <View className="items-center gap-y-[9px] px-4 pb-4 pt-[11px]">
            <Text className="text-center font-data text-[15px] font-medium text-basalt">{title}</Text>
            <Text className="text-center font-body text-[13px] leading-[18px] tracking-[-0.078px] text-basalt">
              {body}
            </Text>
          </View>
          <View className="h-px bg-separator" />
          <View className="flex-row">
            <Pressable onPress={onPrimary} accessibilityRole="button" className="h-11 flex-1 items-center justify-center">
              <Text className="font-data text-[15px] font-medium text-earth">{primary}</Text>
            </Pressable>
            <View className="w-px bg-separator" />
            <Pressable onPress={onDismiss} accessibilityRole="button" className="h-11 flex-1 items-center justify-center">
              <Text className="font-data text-[15px] font-medium text-earth">Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
