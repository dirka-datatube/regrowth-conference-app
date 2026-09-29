import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { Avatar } from '@/components/Avatar';
import type { GuideSpeaker } from '@/lib/eventContent';

/**
 * "Featured Speakers at …" (146:2535): 140×160 cards in a horizontal row, the
 * FeaturedRow recipe with people in it. A headshot fills the card under the
 * scrim; without one, the speaker's initials stand in.
 */
export function SpeakerRow({ speakers, onOpen }: { speakers: GuideSpeaker[]; onOpen: (s: GuideSpeaker) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, columnGap: 10 }}
    >
      {speakers.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => onOpen(s)}
          accessibilityRole="link"
          accessibilityLabel={[s.name, s.title].filter(Boolean).join(', ')}
          className="h-40 w-[140px] justify-between overflow-hidden rounded-tile border border-hairline bg-well p-3"
        >
          {s.headshot_url ? (
            <>
              <Image
                source={{ uri: s.headshot_url }}
                className="absolute inset-0"
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              <View className="absolute inset-0 bg-scrim" />
              <View />
            </>
          ) : (
            <Avatar name={s.name} size={52} />
          )}
          <View className="gap-y-1">
            <Text className="font-data text-[12px] font-bold text-snow" numberOfLines={2}>
              {s.name}
            </Text>
            {!!s.title && (
              <Text className="font-data text-[10px] text-quiet" numberOfLines={1}>
                {s.title}
              </Text>
            )}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
