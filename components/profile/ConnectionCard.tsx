import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import { colors } from '@/lib/theme';
import type { BusinessCard, ConnectionPerson } from '@/lib/hooks/useConnections';

/**
 * A connection on Networking Connections (216:1028): photo or initials, name,
 * "Role | Company", and the quick actions — email and LinkedIn.
 *
 * `attendees` has no LinkedIn column yet, so the LinkedIn action searches
 * LinkedIn for the person's name and company rather than claiming a profile.
 */

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="h-9 w-9 items-center justify-center rounded-pill border border-card-line bg-well"
    >
      <Ionicons name={icon} size={17} color={colors.snow} />
    </Pressable>
  );
}

const open = (url: string) => void Linking.openURL(url).catch(() => undefined);

function linkedInSearch(p: { name: string; company: string | null }) {
  const keywords = [p.name, p.company].filter(Boolean).join(' ');
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
}

export function ConnectionCard({ person, onPress }: { person: ConnectionPerson | null; onPress?: () => void }) {
  if (!person) {
    // Hidden profiles come back without their row (RLS): say so, not nothing.
    return (
      <View className="flex-row items-center gap-x-3 rounded-card border border-hairline bg-tile p-4">
        <View className="h-12 w-12 items-center justify-center rounded-pill bg-well">
          <Ionicons name="lock-closed-outline" size={20} color={colors.quiet} />
        </View>
        <View className="flex-1 gap-y-0.5">
          <Text className="font-data text-[15px] font-bold text-snow">Private attendee</Text>
          <Text className="font-data text-[13px] text-quiet">This person keeps their profile hidden.</Text>
        </View>
      </View>
    );
  }

  const line = [person.role, person.company].filter(Boolean).join(' | ');
  const firstName = person.name.split(' ')[0];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={line ? `${person.name}, ${line}` : person.name}
      className="flex-row items-center gap-x-3 rounded-card border border-hairline bg-tile p-4"
    >
      <Avatar name={person.name} uri={person.photo_url} size={48} />
      <View className="flex-1 gap-y-0.5">
        <Text className="font-data text-[15px] font-bold text-snow" numberOfLines={1}>
          {person.name}
        </Text>
        {!!line && (
          <Text className="font-data text-[13px] text-snow/70" numberOfLines={1}>
            {line}
          </Text>
        )}
      </View>
      <View className="flex-row gap-x-2">
        {!!person.email && (
          <QuickAction icon="mail-outline" label={`Email ${firstName}`} onPress={() => open(`mailto:${person.email}`)} />
        )}
        <QuickAction
          icon="logo-linkedin"
          label={`Find ${firstName} on LinkedIn`}
          onPress={() => open(linkedInSearch(person))}
        />
      </View>
    </Pressable>
  );
}

/** A photographed card still waiting to be matched to an attendee. */
export function BusinessCardRow({ card }: { card: BusinessCard }) {
  const title = card.name ?? card.company ?? card.email ?? 'Business card';
  const line = card.name ? card.company : null;
  return (
    <View
      accessibilityLabel={[title, line].filter(Boolean).join(', ')}
      className="flex-row items-center gap-x-3 rounded-card border border-hairline bg-tile p-4"
    >
      <View className="h-12 w-12 items-center justify-center rounded-pill bg-well">
        <Ionicons name="card-outline" size={21} color={colors.snow} />
      </View>
      <View className="flex-1 gap-y-0.5">
        <Text className="font-data text-[15px] font-bold text-snow" numberOfLines={1}>
          {title}
        </Text>
        {!!line && (
          <Text className="font-data text-[13px] text-snow/70" numberOfLines={1}>
            {line}
          </Text>
        )}
      </View>
      <View className="flex-row gap-x-2">
        {!!card.email && <QuickAction icon="mail-outline" label={`Email ${title}`} onPress={() => open(`mailto:${card.email}`)} />}
        {!!card.phone && (
          <QuickAction icon="call-outline" label={`Call ${title}`} onPress={() => open(`tel:${card.phone!.replace(/\s+/g, '')}`)} />
        )}
      </View>
    </View>
  );
}
