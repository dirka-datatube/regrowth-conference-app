import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

/** Profile summary (145:1505): photo, name, role line, and the event chip. */
export function ProfileSummaryCard({
  name,
  line,
  photoUrl,
  chip,
  onPress,
}: {
  name: string;
  line?: string | null;
  photoUrl?: string | null;
  /** e.g. "NAVIGATE 2027 ATTENDEE"; omitted when not registered. */
  chip?: string | null;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Edit your profile, ${name}` : undefined}
      className="min-h-[94px] flex-row items-start gap-x-[11px] rounded-card border border-card-line bg-well p-[13px]"
    >
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} className="h-[60px] w-[61px] rounded-pill" accessibilityIgnoresInvertColors />
      ) : (
        <View className="h-[60px] w-[61px] items-center justify-center rounded-pill bg-glass">
          <Ionicons name="person" size={28} color={colors.snow} />
        </View>
      )}
      <View className="flex-1 pt-px">
        <Text className="font-data text-[15px] font-bold text-snow" numberOfLines={1}>
          {name}
        </Text>
        {!!line && (
          <Text className="mt-1 font-data text-[13px] text-snow/80" numberOfLines={1}>
            {line}
          </Text>
        )}
        {!!chip && (
          <View className="mt-2 self-start rounded-md border border-card-line px-2 py-1">
            <Text className="font-label text-[10px] font-bold text-snow/60">{chip}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
