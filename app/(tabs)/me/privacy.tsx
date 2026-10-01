import { router } from 'expo-router';
import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { LegalDocument } from '@/components/profile/LegalDocument';
import { LEGAL_DOCS } from '@/lib/legal';

/**
 * Privacy Policy — Figma v2 (227:2808). Built from the frame name and v2
 * patterns; re-check against 227:2808 when Figma reads are available.
 *
 * Draft copy (lib/legal.ts), shared with /legal/privacy, which the sign-up
 * screen links to before an account exists.
 */
export default function Privacy() {
  const doc = LEGAL_DOCS.privacy;
  return (
    <SubScreen title={doc.title} subtitle={doc.subtitle}>
      <Section>
        <LegalDocument doc={doc} related={{ label: 'Terms & Conditions', onPress: () => router.replace('/me/terms') }} />
      </Section>
    </SubScreen>
  );
}
