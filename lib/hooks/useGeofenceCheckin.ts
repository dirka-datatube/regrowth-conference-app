import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../supabase';
import { useAppStore } from '../store';
import { IS_DEMO } from '../demo';

// One-tap venue check-in: on first Home mount during event days, if we're
// inside the venue geofence and not checked in today, offer a single tap.
// Consent-first — never fully automatic.
function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function useGeofenceCheckin() {
  const attendee = useAppStore((s) => s.attendee);
  const asked = useRef(false);

  useEffect(() => {
    if (!attendee || IS_DEMO || asked.current) return;

    (async () => {
      try {
        const { data: event } = await supabase
          .from('events')
          .select('start_date, end_date, venue_lat, venue_lng, geofence_radius_m, venue')
          .eq('id', attendee.event_id)
          .single();
        if (!event?.venue_lat || !event.venue_lng) return;

        const today = new Date().toISOString().slice(0, 10);
        if (today < event.start_date || today > event.end_date) return;

        const { data: todayCheckin } = await supabase
          .from('check_ins')
          .select('id')
          .eq('attendee_id', attendee.id)
          .eq('day', today)
          .maybeSingle();
        if (todayCheckin) return;

        // Only use permission that's already granted — never prompt for
        // location just to offer a check-in.
        const perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted) return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const dist = distanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          event.venue_lat,
          event.venue_lng,
        );
        if (dist > (event.geofence_radius_m ?? 250)) return;

        asked.current = true;
        Alert.alert(
          `Welcome to ${event.venue ?? 'the venue'}`,
          'Looks like you\'ve arrived — check in for today?',
          [
            { text: 'Not yet', style: 'cancel' },
            {
              text: "I'm here",
              onPress: async () => {
                await supabase.functions.invoke('check-in', {
                  body: { source: 'geofence' },
                });
              },
            },
          ],
        );
      } catch {
        // Location is best-effort; self check-in always available on Home.
      }
    })();
  }, [attendee]);
}
