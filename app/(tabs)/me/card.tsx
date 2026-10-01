import { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { SectionHeading } from '@/components/SectionHeading';
import { CtaButton } from '@/components/profile/CtaButton';
import { pickPhoto, type PickedPhoto } from '@/components/profile/photo';
import { useConnectionsCardScan, type CardDetails } from '@/lib/hooks/useConnections';
import { IS_DEMO } from '@/lib/demo';
import { colors } from '@/lib/theme';

/**
 * Business card capture — no frame in the file; built in the v2 language of
 * Scan QR (237:888) and Networking Connections (216:1028). Re-check when a
 * frame exists.
 *
 * Photograph a card (or upload one), and the business-card-ocr function reads
 * the name, company, email and phone and files them with the attendee's
 * connections. The photo itself is not stored.
 */

const FIELDS: { key: keyof CardDetails; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'name', label: 'Name', icon: 'person-outline' },
  { key: 'company', label: 'Company', icon: 'business-outline' },
  { key: 'email', label: 'Email', icon: 'mail-outline' },
  { key: 'phone', label: 'Phone', icon: 'call-outline' },
];

function Found({ details }: { details: CardDetails }) {
  return (
    <View className="overflow-hidden rounded-card border border-hairline bg-tile">
      {FIELDS.map((f, i) => {
        const value = details[f.key]?.trim();
        return (
          <View key={f.key} className={`flex-row items-center gap-x-3 px-4 py-3 ${i ? 'border-t border-hairline' : ''}`}>
            <Ionicons name={f.icon} size={17} color={colors.quiet} />
            <Text className="w-[72px] font-data text-[12px] font-semibold text-quiet">{f.label}</Text>
            <Text
              className={`flex-1 font-data text-[14px] ${value ? 'text-snow' : 'italic text-quiet'}`}
              numberOfLines={1}
              selectable
            >
              {value || 'Not found'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function BusinessCardCapture() {
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const { scan, details, isPending, error, reset } = useConnectionsCardScan();

  async function pick(source: 'camera' | 'library') {
    setPickError(null);
    try {
      const picked = await pickPhoto({ source, maxSide: 1600 });
      if (!picked) return;
      reset();
      setPhoto(picked);
    } catch (e) {
      setPickError(e instanceof Error ? e.message : 'That photo could not be read. Try another.');
    }
  }

  function startOver() {
    reset();
    setPhoto(null);
    setPickError(null);
  }

  const problem = pickError ?? (error ? 'We couldn’t read that card. Try a sharper photo with the whole card in the frame.' : null);

  return (
    <SubScreen title="Scan a Business Card" subtitle="Turn a card into a connection">
      <Section className="gap-y-4">
        <Text className="font-body text-[14px] leading-[21px] text-lede">
          Photograph a business card and we’ll read the name, company, email and phone for you. We don’t keep the
          photo — only the details read from it.
        </Text>

        <Pressable
          onPress={photo ? undefined : () => pick('camera')}
          disabled={!!photo}
          accessibilityRole={photo ? 'image' : 'button'}
          accessibilityLabel={photo ? 'The business card you photographed' : 'Take a photo of a business card'}
          className={`h-[210px] items-center justify-center overflow-hidden rounded-card ${
            photo ? 'border border-hairline' : 'border-2 border-dashed border-card-line bg-tile'
          }`}
        >
          {photo ? (
            <Image source={{ uri: photo.uri }} className="h-full w-full" resizeMode="cover" accessibilityIgnoresInvertColors />
          ) : (
            <View className="items-center gap-y-2 px-6">
              <Ionicons name="card-outline" size={44} color={colors.quiet} />
              <Text className="text-center font-data text-[13px] text-quiet">
                Lay the card flat in good light, filling the frame.
              </Text>
            </View>
          )}
        </Pressable>

        {!photo ? (
          <View className="gap-y-3">
            <CtaButton label="Take Photo" icon="camera-outline" block onPress={() => pick('camera')} />
            <CtaButton label="Upload From Gallery" icon="image-outline" tone="outline" block onPress={() => pick('library')} />
          </View>
        ) : !details ? (
          <View className="gap-y-3">
            <CtaButton
              label={isPending ? 'Reading card…' : 'Read Card'}
              icon="sparkles-outline"
              block
              loading={isPending}
              onPress={() => scan(photo)}
            />
            <CtaButton label="Retake" icon="camera-reverse-outline" tone="quiet" onPress={startOver} disabled={isPending} />
          </View>
        ) : null}

        {!!problem && (
          <Text accessibilityLiveRegion="polite" className="text-center font-data text-[13px] text-alert-action">
            {problem}
          </Text>
        )}
      </Section>

      {details && (
        <Section className="gap-y-3">
          <SectionHeading title="We Found" subtitle="Saved with your connections under Business Cards." />
          {IS_DEMO && (
            <Text className="font-data text-[12px] text-quiet">
              Demo: these details are an example, not read from your photo.
            </Text>
          )}
          <Found details={details} />
          <View className="mt-1 gap-y-3">
            <CtaButton
              label="View Connections"
              icon="people-outline"
              block
              onPress={() => router.navigate('/me/connections')}
            />
            <CtaButton label="Scan Another Card" icon="camera-outline" tone="outline" block onPress={startOver} />
          </View>
        </Section>
      )}
    </SubScreen>
  );
}
