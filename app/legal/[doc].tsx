import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';

import { ScreenHeader } from '@/components/ScreenHeader';
import { LegalDocument } from '@/components/profile/LegalDocument';
import { CtaButton } from '@/components/profile/CtaButton';
import { LEGAL_DOCS, isLegalDoc } from '@/lib/legal';

/**
 * Terms & Conditions and Privacy Policy outside the tabs — `/legal/terms` and
 * `/legal/privacy` — so they can be read before signing in (the sign-up screen
 * links here). The same draft copy as /me/terms and /me/privacy, full screen
 * with the header's back chevron; opened straight from a link, back goes to
 * the start. Built from the frame names and v2 patterns; re-check against
 * 227:2863 and 227:2808 when Figma reads are available.
 */
export default function Legal() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const content = isLegalDoc(doc) ? LEGAL_DOCS[doc] : null;
  const other = content ? LEGAL_DOCS[content.key === 'terms' ? 'privacy' : 'terms'] : null;

  return (
    <SafeAreaView className="flex-1 bg-midnight" edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View className="px-5 pt-2">
        <ScreenHeader title={content?.title ?? 'Page not found'} subtitle={content?.subtitle} />
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 }}>
        {content && other ? (
          <LegalDocument
            doc={content}
            related={{ label: other.title, onPress: () => router.replace(`/legal/${other.key}` as never) }}
          />
        ) : (
          <View className="items-center gap-y-4 py-10">
            <Text className="text-center font-data text-[14px] text-quiet">
              There’s no page at this address. The Terms and the Privacy Policy are here:
            </Text>
            <View className="flex-row gap-x-3">
              <CtaButton label="Terms" tone="outline" onPress={() => router.replace('/legal/terms')} />
              <CtaButton label="Privacy Policy" tone="outline" onPress={() => router.replace('/legal/privacy')} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
