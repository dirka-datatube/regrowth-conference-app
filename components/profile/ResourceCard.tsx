import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CtaButton } from './CtaButton';
import { RESOURCE_ICONS, type Resource } from '@/lib/hooks/useResources';
import { colors } from '@/lib/theme';

/**
 * A resource on Templates & Resources (217:1521): the type's icon well, title,
 * one line of description, "PDF · 2.4 MB", and Open or Download — or
 * "Available soon" while the file is not up yet.
 */
export function ResourceCard({ resource, onOpen }: { resource: Resource; onOpen: (url: string) => void }) {
  const { url } = resource;
  const meta = [resource.format, resource.size].filter(Boolean).join(' · ');
  return (
    <View className="gap-y-3 rounded-card border border-hairline bg-tile p-4">
      <View className="flex-row items-start gap-x-3">
        <View className="h-11 w-11 items-center justify-center rounded-tile bg-well">
          <Ionicons name={RESOURCE_ICONS[resource.category]} size={21} color={colors.snow} />
        </View>
        <View className="flex-1 gap-y-1">
          <Text className="font-data text-[15px] font-bold leading-[20px] text-snow">{resource.title}</Text>
          <Text className="font-data text-[13px] leading-[18px] text-quiet" numberOfLines={2}>
            {resource.description}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between gap-x-3">
        <Text className="font-label text-[11px] font-bold uppercase tracking-[0.5px] text-snow/60">
          {[resource.category.replace(/s$/, ''), meta].filter(Boolean).join(' · ')}
        </Text>
        {url ? (
          <CtaButton
            label={resource.action === 'download' ? 'Download' : 'Open'}
            icon={resource.action === 'download' ? 'download-outline' : 'open-outline'}
            onPress={() => onOpen(url)}
            accessibilityLabel={`${resource.action === 'download' ? 'Download' : 'Open'} ${resource.title}`}
          />
        ) : (
          <View
            accessibilityLabel={`${resource.title} is available soon`}
            className="flex-row items-center gap-x-1.5 rounded-pill border border-card-line px-3 py-1.5"
          >
            <Ionicons name="time-outline" size={13} color={colors.quiet} />
            <Text className="font-data text-[12px] font-medium text-quiet">Available soon</Text>
          </View>
        )}
      </View>
    </View>
  );
}
