import { z } from 'zod';
import type { Ionicons } from '@expo/vector-icons';
import type { DayKey } from '@/lib/eventTime';

/**
 * The venue forecast behind the Weather screen (37:26 / 211:1273), from
 * Open-Meteo — free, keyless, and CORS-open, so the PWA calls it directly.
 * Times come back in the venue's own zone (`timezone=auto`) as local
 * 'YYYY-MM-DDTHH:mm' strings, which is what the screen labels.
 */

type Icon = keyof typeof Ionicons.glyphMap;

export type WeatherHour = { time: string; temp: number; code: number; isDay: boolean };
export type WeatherDay = { date: DayKey; high: number; low: number; code: number };

export type WeatherReport = {
  current: { temp: number; code: number; isDay: boolean };
  today: { high: number; low: number };
  /** The next 24 hours, starting with the current one. */
  hourly: WeatherHour[];
  /** Seven days, starting today. */
  daily: WeatherDay[];
};

export function forecastUrl(lat: number, lng: number) {
  const params = [
    `latitude=${lat}`,
    `longitude=${lng}`,
    'current=temperature_2m,weather_code,is_day',
    'hourly=temperature_2m,weather_code,is_day',
    'daily=weather_code,temperature_2m_max,temperature_2m_min',
    'timezone=auto',
    'forecast_days=7',
  ];
  return `https://api.open-meteo.com/v1/forecast?${params.join('&')}`;
}

const series = z.array(z.number().nullable());

const responseSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    weather_code: z.number(),
    is_day: z.number().optional(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: series,
    weather_code: series,
    is_day: series.optional(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: series,
    temperature_2m_max: series,
    temperature_2m_min: series,
  }),
});

/** Throws on a response that is not a forecast — the screen shows its retry state. */
export function parseForecast(json: unknown): WeatherReport {
  const { current, hourly, daily } = responseSchema.parse(json);
  const hour = current.time.slice(0, 13); // 'YYYY-MM-DDTHH'
  const from = Math.max(
    0,
    hourly.time.findIndex((t) => t.startsWith(hour)),
  );

  const hours: WeatherHour[] = [];
  for (let i = from; i < hourly.time.length && hours.length < 24; i++) {
    const temp = hourly.temperature_2m[i];
    const code = hourly.weather_code[i];
    if (temp === null || code === null) continue;
    hours.push({ time: hourly.time[i], temp, code, isDay: hourly.is_day?.[i] !== 0 });
  }

  const days: WeatherDay[] = [];
  daily.time.forEach((date, i) => {
    const high = daily.temperature_2m_max[i];
    const low = daily.temperature_2m_min[i];
    const code = daily.weather_code[i];
    if (high === null || low === null || code === null) return;
    days.push({ date, high, low, code });
  });

  return {
    current: { temp: current.temperature_2m, code: current.weather_code, isDay: current.is_day !== 0 },
    today: { high: days[0]?.high ?? current.temperature_2m, low: days[0]?.low ?? current.temperature_2m },
    hourly: hours,
    daily: days,
  };
}

/** WMO weather interpretation codes, as Open-Meteo reports them. */
export function describeWeather(code: number, isDay = true): { label: string; icon: Icon } {
  const sky = (day: Icon, night: Icon) => (isDay ? day : night);
  if (code === 0) return { label: 'Clear', icon: sky('sunny', 'moon') };
  if (code === 1) return { label: 'Mostly Clear', icon: sky('partly-sunny', 'cloudy-night') };
  if (code === 2) return { label: 'Partly Cloudy', icon: sky('partly-sunny', 'cloudy-night') };
  if (code === 3) return { label: 'Cloudy', icon: 'cloudy' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: 'cloudy' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: 'rainy' };
  if (code >= 61 && code <= 67) return { label: code === 65 ? 'Heavy Rain' : 'Rain', icon: 'rainy' };
  if (code >= 71 && code <= 77) return { label: 'Snow', icon: 'snow' };
  if (code >= 80 && code <= 82) return { label: 'Showers', icon: 'rainy' };
  if (code === 85 || code === 86) return { label: 'Snow Showers', icon: 'snow' };
  if (code >= 95) return { label: 'Thunderstorms', icon: 'thunderstorm' };
  return { label: 'Fair', icon: sky('partly-sunny', 'cloudy-night') };
}

/** "Now" for the first hour, then "2 PM" from the local timestamp. */
export function hourLabel(time: string, index: number) {
  if (index === 0) return 'Now';
  const hour = Number(time.slice(11, 13));
  if (Number.isNaN(hour)) return '';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function dayLabel(date: DayKey, index: number) {
  if (index === 0) return 'Today';
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
}

export function degrees(t: number) {
  return `${Math.round(t)}°`;
}
