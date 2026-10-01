import { useQuery } from '@tanstack/react-query';
import { IS_DEMO } from '@/lib/demo';
import { demoWeather } from '@/lib/demo-event';
import type { EventInfo } from '@/lib/eventContent';
import { forecastUrl, parseForecast, type WeatherReport } from '@/lib/eventWeather';
import type { GuideQuery } from '@/lib/hooks/useEvent';

/**
 * The forecast at the event's venue coordinates (`events.venue_lat` /
 * `venue_lng`), from Open-Meteo. Demo mode never fetches: it returns a
 * fixture shaped like the real response. `null` means there is no forecast to
 * show — the event has no coordinates yet.
 */
export function useWeather(event: Pick<EventInfo, 'id' | 'lat' | 'lng'>): GuideQuery<WeatherReport | null> {
  const { id, lat, lng } = event;
  const located = lat !== null && lng !== null;
  const query = useQuery({
    queryKey: ['weather', id, lat, lng],
    enabled: IS_DEMO ? !!id : located,
    staleTime: 30 * 60 * 1000,
    queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<WeatherReport | null> => {
      if (IS_DEMO) return demoWeather(id);
      const res = await fetch(forecastUrl(lat!, lng!), { signal });
      if (!res.ok) throw new Error(`Open-Meteo answered ${res.status}`);
      return parseForecast(await res.json());
    },
  });
  // A disabled query never loads; without coordinates there is nothing to wait for.
  const data: WeatherReport | null | undefined = IS_DEMO || located ? query.data : null;
  return { data, isLoading: query.isLoading, isError: query.isError, refetch: query.refetch };
}
