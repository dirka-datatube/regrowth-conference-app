import { useState } from 'react';
import { View, Text, Pressable, Linking, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { NeedHelp } from '@/components/NeedHelp';
import { ActionButton } from '@/components/event/ActionButton';
import { GuideEmpty, GuideLoading } from '@/components/event/GuideState';
import { useEvent } from '@/lib/hooks/useEvent';
import type { HotelInfo } from '@/lib/eventContent';
import { colors } from '@/lib/theme';

/**
 * Hotel & Accommodation — Navigate (92:289). The frame has only its header
 * ("Hotel & Accommodation" over the hotel's name), so the body is built from
 * the event-home card's promise ("Accommodation & booking information for
 * your stay") and v2 patterns; re-check against 92:289 when Figma reads are
 * available. Content is `settings.hotel` (lib/eventContent.ts).
 *
 * IMAGERY — the hotel photograph is a brand-colour block until Sprint 12.
 */

type Clipboard = { writeText?: (text: string) => Promise<void> };

// The booking code copies on the web; on native it is selectable text.
const clipboard: Clipboard | undefined =
  Platform.OS === 'web'
    ? (globalThis as unknown as { navigator?: { clipboard?: Clipboard } }).navigator?.clipboard
    : undefined;

function directionsUrl(hotel: HotelInfo) {
  const query =
    hotel.lat !== undefined && hotel.lng !== undefined
      ? `${hotel.lat},${hotel.lng}`
      : [hotel.name, hotel.address].filter(Boolean).join(', ');
  return Platform.OS === 'ios'
    ? `https://maps.apple.com/?q=${encodeURIComponent(query)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function StayTile({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-1 gap-y-1.5 rounded-card border border-hairline bg-tile p-4">
      <View className="flex-row items-center gap-x-1.5">
        <Ionicons name={icon} size={14} color={colors.quiet} />
        <Text className="font-label text-[11px] font-bold tracking-[1px] text-quiet">{label}</Text>
      </View>
      <Text className="font-data text-[15px] font-semibold text-snow">{value}</Text>
    </View>
  );
}

export default function Hotel() {
  const { eventId = '' } = useLocalSearchParams<{ eventId: string }>();
  const { event, isLoading } = useEvent(eventId);
  const [copied, setCopied] = useState(false);
  const hotel = event.hotel;

  if (!hotel) {
    return (
      <SubScreen title="Hotel & Accommodation" subtitle={event.venue ?? undefined}>
        <Section>
          {isLoading && !event.loaded ? (
            <GuideLoading label="Loading accommodation…" />
          ) : (
            <GuideEmpty
              icon="bed-outline"
              title="Accommodation details coming soon"
              body={`Where to stay for ${event.short}, and the REGROWTH booking code, will appear here.`}
            />
          )}
        </Section>
        <Section>
          <NeedHelp />
        </Section>
      </SubScreen>
    );
  }

  const code = hotel.booking_code;
  const phone = hotel.phone;
  const website = hotel.website;

  async function copyCode() {
    if (!code || !clipboard?.writeText) return;
    try {
      await clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission refused — the code is still on screen.
    }
  }

  return (
    <SubScreen title="Hotel & Accommodation" subtitle={hotel.name}>
      <Section>
        <View
          className="h-[180px] items-center justify-center overflow-hidden rounded-feature border border-hairline bg-ocean/30"
          accessibilityLabel={`${hotel.name} — photo coming soon`}
        >
          <View className="absolute -right-12 -top-12 h-44 w-44 rounded-pill bg-earth/25" />
          <View className="absolute -bottom-16 -left-10 h-44 w-44 rounded-pill bg-accent/15" />
          <Ionicons name="bed-outline" size={56} color={colors.snow} style={{ opacity: 0.5 }} />
        </View>
      </Section>

      <Section className="gap-y-2">
        <Text accessibilityRole="header" className="font-data text-[20px] font-semibold text-snow">
          {hotel.name}
        </Text>
        {!!hotel.address && (
          <View className="flex-row items-start gap-x-1.5">
            <Ionicons name="location-outline" size={15} color={colors.quiet} style={{ marginTop: 1 }} />
            <Text className="flex-1 font-data text-[13px] leading-[18px] text-quiet">{hotel.address}</Text>
          </View>
        )}
      </Section>

      {!!(hotel.check_in || hotel.check_out) && (
        <Section>
          <View className="flex-row gap-x-3">
            {!!hotel.check_in && <StayTile icon="log-in-outline" label="CHECK-IN" value={hotel.check_in} />}
            {!!hotel.check_out && <StayTile icon="log-out-outline" label="CHECK-OUT" value={hotel.check_out} />}
          </View>
        </Section>
      )}

      {!!code && (
        <Section>
          <View className="gap-y-2 rounded-card border border-teal-line bg-teal-wash p-4">
            <Text className="font-label text-[11px] font-bold tracking-[1px] text-quiet">REGROWTH GUEST BOOKING CODE</Text>
            <View className="flex-row items-center justify-between gap-x-3">
              <Text selectable className="flex-1 font-label text-[24px] font-bold tracking-[2px] text-snow">
                {code}
              </Text>
              {!!clipboard?.writeText && (
                <Pressable
                  onPress={copyCode}
                  accessibilityRole="button"
                  accessibilityLabel={copied ? 'Booking code copied' : 'Copy booking code'}
                  className="flex-row items-center gap-x-1.5 rounded-cta border border-card-line px-3 py-2"
                >
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={colors.snow} />
                  <Text className="font-data text-[12px] font-semibold text-snow">{copied ? 'Copied' : 'Copy'}</Text>
                </Pressable>
              )}
            </View>
            {!!hotel.booking_note && (
              <Text className="font-data text-[13px] leading-[18px] text-lede">{hotel.booking_note}</Text>
            )}
          </View>
        </Section>
      )}

      {hotel.amenities.length > 0 && (
        <Section className="gap-y-3">
          <SectionHeading title="Amenities" />
          <View className="flex-row flex-wrap gap-2">
            {hotel.amenities.map((a, i) => (
              <View key={`${i}-${a}`} className="rounded-pill border border-card-line bg-tile px-3 py-1.5">
                <Text className="font-ui text-[12px] text-snow">{a}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {hotel.notes.length > 0 && (
        <Section className="gap-y-3">
          <SectionHeading title="Good to know" />
          {hotel.notes.map((n, i) => (
            <View key={`${i}-${n}`} className="flex-row items-start gap-x-2.5">
              <Ionicons name="information-circle-outline" size={16} color={colors.quiet} style={{ marginTop: 1 }} />
              <Text className="flex-1 font-data text-[13px] leading-[18px] text-lede">{n}</Text>
            </View>
          ))}
        </Section>
      )}

      <Section className="gap-y-3">
        <ActionButton
          label="Get directions"
          icon="navigate-outline"
          onPress={() => Linking.openURL(directionsUrl(hotel)).catch(() => {})}
        />
        {(!!phone || !!website) && (
          <View className="flex-row gap-x-3">
            {!!phone && (
              <ActionButton
                label="Call hotel"
                icon="call-outline"
                tone="outline"
                accessibilityLabel={`Call ${hotel.name}, ${phone}`}
                onPress={() => Linking.openURL(`tel:${phone.replace(/[^+\d]/g, '')}`).catch(() => {})}
                className="flex-1"
              />
            )}
            {!!website && (
              <ActionButton
                label="Website"
                icon="globe-outline"
                tone="outline"
                accessibilityLabel={`${hotel.name} website`}
                onPress={() => Linking.openURL(website).catch(() => {})}
                className="flex-1"
              />
            )}
          </View>
        )}
      </Section>

      <Section>
        <NeedHelp />
      </Section>
    </SubScreen>
  );
}
