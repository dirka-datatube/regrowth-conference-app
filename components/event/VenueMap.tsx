import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AreaKind, MapArea, VenueMap } from '@/lib/eventContent';
import { colors } from '@/lib/theme';

/**
 * Venue Map pieces (92:290): the level pills, the 335×250 map canvas and the
 * Quick Directory rows.
 *
 * The comp's canvas is a floor-plan image that could not be exported, and a
 * real venue plan is Sprint 12 content anyway. The canvas is drawn from
 * `settings.map` instead — each area a box at its percent position — which
 * also lets a directory row light up its area.
 */

type Icon = keyof typeof Ionicons.glyphMap;

const KIND: Record<AreaKind, { fill: string; icon: Icon }> = {
  stage: { fill: 'bg-ocean/60', icon: 'mic-outline' },
  room: { fill: 'bg-ocean/35', icon: 'easel-outline' },
  booth: { fill: 'bg-earth/45', icon: 'storefront-outline' },
  meeting: { fill: 'bg-accent/30', icon: 'people-outline' },
  coffee: { fill: 'bg-cloud/25', icon: 'cafe-outline' },
  food: { fill: 'bg-earth/30', icon: 'restaurant-outline' },
  lounge: { fill: 'bg-accent/20', icon: 'wine-outline' },
  entry: { fill: 'bg-snow/10', icon: 'enter-outline' },
  info: { fill: 'bg-snow/10', icon: 'information-circle-outline' },
  amenity: { fill: 'bg-snow/5', icon: 'accessibility-outline' },
};

export function areaIcon(kind: AreaKind): Icon {
  return KIND[kind]?.icon ?? 'location-outline';
}

export function LevelTabs({
  levels,
  value,
  onChange,
}: {
  levels: VenueMap['levels'];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View className="flex-row gap-x-2" accessibilityRole="tablist">
      {levels.map((l, i) => {
        const on = l.id === value;
        return (
          <Pressable
            key={`${i}-${l.id}`}
            onPress={() => onChange(l.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            className={`h-9 flex-1 items-center justify-center rounded-pill border ${
              on ? 'border-ocean bg-ocean' : 'border-card-line bg-tile'
            }`}
          >
            <Text className="font-data text-[13px] font-semibold text-snow">{l.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FloorPlan({
  level,
  selectedId,
  onSelect,
}: {
  level: VenueMap['levels'][number];
  selectedId: string | null;
  onSelect: (area: MapArea) => void;
}) {
  return (
    <View
      className="h-[250px] overflow-hidden rounded-tile border border-card-line bg-well"
      accessibilityLabel={`${level.label} floor plan`}
    >
      {/* Faint grid, so the canvas reads as a plan rather than a panel. */}
      {[25, 50, 75].map((p) => (
        <View key={`v${p}`} className="absolute bottom-0 top-0 w-px bg-snow/5" style={{ left: `${p}%` }} />
      ))}
      {[33, 66].map((p) => (
        <View key={`h${p}`} className="absolute left-0 right-0 h-px bg-snow/5" style={{ top: `${p}%` }} />
      ))}

      {level.areas.map((a, i) => {
        const on = a.id === selectedId;
        return (
          <Pressable
            key={`${i}-${a.id}`}
            onPress={() => onSelect(a)}
            accessibilityRole="button"
            accessibilityLabel={a.name}
            accessibilityState={{ selected: on }}
            style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%` }}
            className={`absolute items-center justify-center gap-y-1 rounded-md p-1 ${KIND[a.kind]?.fill ?? 'bg-snow/10'} ${
              on ? 'border-2 border-snow' : 'border border-snow/20'
            }`}
          >
            <Ionicons name={areaIcon(a.kind)} size={14} color={colors.snow} />
            <Text className="text-center font-data text-[9px] font-semibold text-snow" numberOfLines={2}>
              {a.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function DirectoryRow({
  area,
  status,
  selected,
  onPress,
}: {
  area: MapArea;
  /** "Currently Hosting …", or the area's note. */
  status: string | null;
  selected: boolean;
  onPress: () => void;
}) {
  const line = [area.location, status].filter(Boolean).join(' • ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[area.name, line].filter(Boolean).join(', ')}
      accessibilityState={{ selected }}
      className={`min-h-[58px] flex-row items-center gap-x-3 rounded-tile border px-3 py-3 ${
        selected ? 'border-ocean bg-teal-wash' : 'border-card-line bg-tile'
      }`}
    >
      <View className="h-8 w-8 items-center justify-center rounded-pill bg-well">
        <Ionicons name={areaIcon(area.kind)} size={16} color={colors.snow} />
      </View>
      <View className="flex-1 gap-y-0.5">
        <Text className="font-data text-[14px] font-semibold text-snow">{area.name}</Text>
        {!!line && (
          <Text className="font-data text-[11px] text-quiet" numberOfLines={2}>
            {line}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
