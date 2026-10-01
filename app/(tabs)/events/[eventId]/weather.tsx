import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Backdrop } from '@/components/event/Backdrop';
import { ForecastSheet } from '@/components/event/ForecastSheet';
import { ActionButton } from '@/components/event/ActionButton';
import { GuideEmpty, GuideLoading } from '@/components/event/GuideState';
import { useEvent } from '@/lib/hooks/useEvent';
import { useWeather } from '@/lib/hooks/useWeather';
import { IS_DEMO } from '@/lib/demo';
import { degrees, describeWeather } from '@/lib/eventWeather';

/**
 * Weather — Navigate (37:26) and Study Tour (211:1273): the venue city over a
 * full-bleed sky, the temperature and conditions, and a sheet with the hourly
 * and weekly forecast. Live from Open-Meteo at the event's coordinates; the
 * demo uses a fixture and never fetches.
 *
 * The comp's search field (54:558) is left out: the forecast is for the
 * venue, so there is nothing to search. Its sky photograph is a gradient
 * stand-in (components/event/Backdrop.tsx).
 */
export default function Weather() {
  const { eventId = '' } = useLocalSearchParams<{ eventId: string }>();
  const { event, isLoading: eventLoading } = useEvent(eventId);
  const { data: report, isLoading, isError, refetch } = useWeather(event);
  const city = event.city ?? event.short;

  let body;
  if ((eventLoading && !event.loaded) || isLoading) {
    body = <GuideLoading label="Checking the forecast…" />;
  } else if (isError) {
    body = (
      <GuideEmpty icon="cloud-offline-outline" title="Forecast unavailable" body="We couldn’t reach the weather service.">
        <ActionButton label="Try again" icon="refresh-outline" onPress={() => refetch()} />
      </GuideEmpty>
    );
  } else if (!report) {
    body = (
      <GuideEmpty
        icon="partly-sunny-outline"
        title="Forecast coming soon"
        body={`The forecast for ${event.short} appears here once the venue is confirmed.`}
      />
    );
  }

  const now = report ? describeWeather(report.current.code, report.current.isDay) : null;

  return (
    <View className="flex-1 bg-midnight">
      <Backdrop tone={report && !report.current.isDay ? 'night' : 'day'} />
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar style="light" />
        <View className="px-5 pt-2">
          <ScreenHeader title="Weather" subtitle="Check latest forecast & plan ahead" />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, paddingTop: 20 }}>
          {report && now ? (
            <>
              <View className="items-center px-5 pb-10 pt-6">
                <Text accessibilityRole="header" className="font-data text-[34px] text-snow">
                  {city}
                </Text>
                <Text className="font-data text-[96px] font-extralight leading-[104px] text-snow">
                  {degrees(report.current.temp)}
                </Text>
                <Text className="font-data text-[20px] font-semibold text-snow/70">{now.label}</Text>
                <Text className="font-data text-[20px] font-semibold text-snow">
                  H:{degrees(report.today.high)} L:{degrees(report.today.low)}
                </Text>
              </View>
              <View className="flex-1" />
              <ForecastSheet
                report={report}
                footnote={IS_DEMO ? 'Sample forecast for the demo' : 'Weather data by Open-Meteo.com'}
              />
            </>
          ) : (
            <View className="px-5 pb-[200px]">{body}</View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
