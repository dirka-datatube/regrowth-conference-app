import { Pressable, Text } from 'react-native';

/**
 * Full-width announcement strip between hairline rules — the Events tab when
 * the attendee is not registered (129:420).
 */
export function AnnouncementBanner({ text, onPress }: { text: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'link' : 'text'}
      className="border-y border-card-line px-5 py-3"
    >
      <Text className="text-center font-data text-[13px] text-snow">{text}</Text>
    </Pressable>
  );
}
