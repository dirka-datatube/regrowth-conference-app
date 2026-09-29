import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dayLabel, degrees, describeWeather, hourLabel, type WeatherReport } from '@/lib/eventWeather';
import { colors } from '@/lib/theme';

/**
 * The Weather screen's bottom sheet (54:258): a segmented control over rows of
 * 60×146 capsules — the next 24 hours, or the week.
 */

type Tab = 'hourly' | 'weekly';

function Capsule({
  label,
  icon,
  temp,
  low,
  now,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  temp: string;
  low?: string;
  now?: boolean;
}) {
  return (
    <View
      accessibilityLabel={[label, temp, low && `low ${low}`].filter(Boolean).join(', ')}
      className={`h-[146px] w-[60px] items-center justify-between rounded-pill border py-4 ${
        now ? 'border-glass-line bg-accent-soft' : 'border-snow/20 bg-glass'
      }`}
    >
      <Text className="font-data text-[14px] font-semibold text-snow">{label}</Text>
      <Ionicons name={icon} size={26} color={colors.snow} />
      <View className="items-center">
        <Text className="font-data text-[20px] text-snow">{temp}</Text>
        {!!low && <Text className="font-data text-[12px] text-snow/60">{low}</Text>}
      </View>
    </View>
  );
}

export function ForecastSheet({ report, footnote }: { report: WeatherReport; footnote?: string }) {
  const [tab, setTab] = useState<Tab>('hourly');
  const tabs: { key: Tab; label: string }[] = [
    { key: 'hourly', label: 'Hourly Forecast' },
    { key: 'weekly', label: 'Weekly Forecast' },
  ];

  return (
    // The sheet runs under the tab bar, as in the comp; its content stops above it.
    <View className="rounded-t-[44px] border-t border-glass-line bg-glass px-5 pb-[112px] pt-2 backdrop-blur-xl">
      <View className="mb-1 h-1.5 w-12 self-center rounded-pill bg-snow/30" />

      <View className="flex-row border-b border-snow/15" accessibilityRole="tablist">
        {tabs.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              className="flex-1 items-center gap-y-2 pt-3"
            >
              <Text className={`font-data text-[15px] font-semibold ${on ? 'text-snow' : 'text-snow/60'}`}>
                {t.label}
              </Text>
              <View className={`h-[3px] w-12 rounded-pill ${on ? 'bg-snow' : 'bg-transparent'}`} />
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
        contentContainerStyle={{ columnGap: 12 }}
      >
        {tab === 'hourly'
          ? report.hourly.map((h, i) => (
              <Capsule
                key={h.time}
                label={hourLabel(h.time, i)}
                icon={describeWeather(h.code, h.isDay).icon}
                temp={degrees(h.temp)}
                now={i === 0}
              />
            ))
          : report.daily.map((d, i) => (
              <Capsule
                key={d.date}
                label={dayLabel(d.date, i)}
                icon={describeWeather(d.code).icon}
                temp={degrees(d.high)}
                low={degrees(d.low)}
                now={i === 0}
              />
            ))}
      </ScrollView>

      {!!footnote && <Text className="mt-3 text-center font-data text-[11px] text-snow/50">{footnote}</Text>}
    </View>
  );
}
