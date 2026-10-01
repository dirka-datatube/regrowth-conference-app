import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/Avatar';
import { Pills } from './Pills';
import { roleLine, type CommunityMember } from '@/lib/hooks/useCommunity';
import { colors } from '@/lib/theme';

/**
 * An attendee in a community list (189:540 / 211:660): photo or initials,
 * name, "role | company", interests, and the Connect affordance. The whole
 * card opens the profile, where connecting happens — one tap target, no
 * button nested in a button.
 */
export function AttendeeCard({
  member,
  connected,
  onPress,
}: {
  member: CommunityMember;
  connected: boolean;
  onPress: () => void;
}) {
  const line = roleLine(member);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${member.name}${line ? `, ${line}` : ''}${connected ? ', connected' : ''}`}
      accessibilityHint={connected ? 'Opens their profile' : 'Opens their profile to connect'}
      className="gap-y-3 rounded-card border border-hairline bg-tile p-4"
    >
      <View className="flex-row items-center gap-x-3">
        <Avatar name={member.name} uri={member.photo_url} size={48} />
        <View className="flex-1 gap-y-0.5">
          <Text className="font-data text-[15px] font-bold text-snow" numberOfLines={1}>
            {member.name}
          </Text>
          {!!line && (
            <Text className="font-data text-[12px] text-quiet" numberOfLines={1}>
              {line}
            </Text>
          )}
        </View>
        {connected ? (
          <View className="flex-row items-center gap-x-1 rounded-cta border border-card-line px-2.5 py-1.5">
            <Ionicons name="checkmark" size={13} color={colors.snow} />
            <Text className="font-data text-[12px] font-semibold text-snow">Connected</Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-x-1 rounded-cta bg-ocean px-2.5 py-1.5">
            <Ionicons name="person-add-outline" size={13} color={colors.snow} />
            <Text className="font-data text-[12px] font-semibold text-snow">Connect</Text>
          </View>
        )}
      </View>
      <Pills items={member.interests ?? []} max={3} />
    </Pressable>
  );
}
