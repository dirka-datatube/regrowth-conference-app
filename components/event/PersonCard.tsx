import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import { colors } from '@/lib/theme';

/**
 * The v2 "profile-card" (146:2658, and each row of Speakers 239:1447): photo,
 * name, role line and a small chip — the recipe of ProfileSummaryCard, with a
 * chip that does something. On the event home the chip is "View My QR Code";
 * on Speakers it is "About {first name}" and the whole card opens the profile.
 */
export function PersonCard({
  name,
  line,
  photoUrl,
  initials,
  chip,
  onPress,
  accessibilityLabel,
}: {
  name: string;
  line?: string | null;
  photoUrl?: string | null;
  /** Initials on a disc when there is no photo (speakers); otherwise a person glyph. */
  initials?: boolean;
  chip?: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress?: () => void } | null;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  let photo;
  if (photoUrl) {
    photo = (
      <Image source={{ uri: photoUrl }} className="h-[60px] w-[61px] rounded-pill" accessibilityIgnoresInvertColors />
    );
  } else if (initials) {
    photo = <Avatar name={name} size={60} />;
  } else {
    photo = (
      <View className="h-[60px] w-[61px] items-center justify-center rounded-pill bg-glass">
        <Ionicons name="person" size={28} color={colors.snow} />
      </View>
    );
  }

  // One of the card and the chip responds, never both: on the web each
  // renders as a <button>, and a button may not contain another.
  const chipPress = onPress ? undefined : chip?.onPress;
  const chipBody = chip ? (
    <>
      {chip.icon && <Ionicons name={chip.icon} size={11} color={colors.snow} />}
      <Text className={`font-label text-[10px] font-bold ${chipPress ? 'text-snow/80' : 'text-snow/60'}`}>
        {chip.label}
      </Text>
    </>
  ) : null;

  const body = (
    <>
      {photo}
      <View className="flex-1 pt-px">
        <Text className="font-data text-[15px] font-bold text-snow" numberOfLines={1}>
          {name}
        </Text>
        {!!line && (
          <Text className="mt-1 font-data text-[13px] text-snow/80" numberOfLines={1}>
            {line}
          </Text>
        )}
        {chip &&
          (chipPress ? (
            <Pressable
              onPress={chipPress}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={chip.label}
              className="mt-2 flex-row items-center gap-x-1 self-start rounded-md border border-glass-line px-2 py-1"
            >
              {chipBody}
            </Pressable>
          ) : (
            <View className="mt-2 flex-row items-center gap-x-1 self-start rounded-md border border-card-line px-2 py-1">
              {chipBody}
            </View>
          ))}
      </View>
    </>
  );

  const card = 'min-h-[94px] flex-row items-start gap-x-[11px] rounded-card border border-card-line bg-well p-[13px]';

  // A card that does not respond is a plain View: a disabled Pressable would
  // mark the chip inside it aria-disabled too.
  if (!onPress) return <View className={card}>{body}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? name} className={card}>
      {body}
    </Pressable>
  );
}
