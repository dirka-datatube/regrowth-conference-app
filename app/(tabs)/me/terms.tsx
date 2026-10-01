import { router } from 'expo-router';
import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { LegalDocument } from '@/components/profile/LegalDocument';
import { LEGAL_DOCS } from '@/lib/legal';

/**
 * Terms & Conditions — Figma v2 (227:2863). Built from the frame name and v2
 * patterns; re-check against 227:2863 when Figma reads are available.
 *
 * Draft copy (lib/legal.ts), shared with /legal/terms, which the sign-up
 * screen links to before an account exists.
 */
export default function Terms() {
  const doc = LEGAL_DOCS.terms;
  return (
    <SubScreen title={doc.title} subtitle={doc.subtitle}>
      <Section>
        <LegalDocument doc={doc} related={{ label: 'Privacy Policy', onPress: () => router.replace('/me/privacy') }} />
      </Section>
    </SubScreen>
  );
}
