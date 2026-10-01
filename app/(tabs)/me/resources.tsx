import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { SubScreen } from '@/components/SubScreen';
import { Section } from '@/components/TabScreen';
import { Chip } from '@/components/Chip';
import { NeedHelp } from '@/components/NeedHelp';
import { ResourceCard } from '@/components/profile/ResourceCard';
import { StatePanel } from '@/components/profile/StatePanel';
import { RESOURCE_CATEGORIES, useResources, type ResourceCategory } from '@/lib/hooks/useResources';

/**
 * Templates & Resources — Figma v2 (217:1521). Built from the frame name, the
 * Profile menu copy and v2 patterns; re-check against 217:1521 when Figma reads
 * are available.
 *
 * REGROWTH's library of templates, guides, worksheets and event handouts,
 * filtered by type. The list is interim content (lib/hooks/useResources.ts)
 * until a resources table exists; a file opens in the browser once it has a
 * URL, and reads "Available soon" until then. ICONS — Ionicons stand in for
 * the comp's file-type artwork.
 */

type Filter = 'All' | ResourceCategory;
const FILTERS: Filter[] = ['All', ...RESOURCE_CATEGORIES];

export default function Resources() {
  const { data: resources } = useResources();
  const [filter, setFilter] = useState<Filter>('All');
  const shown = useMemo(
    () => (filter === 'All' ? resources : resources.filter((r) => r.category === filter)),
    [resources, filter],
  );

  return (
    <SubScreen title="Templates & Resources" subtitle="Tools & resources to support your growth">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, columnGap: 8 }}
        accessibilityRole="tablist"
      >
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      <Section className="gap-y-3">
        {shown.length ? (
          shown.map((r) => (
            <ResourceCard key={r.id} resource={r} onOpen={(url) => void WebBrowser.openBrowserAsync(url)} />
          ))
        ) : (
          <StatePanel icon="folder-open-outline" title={`No ${filter.toLowerCase()} yet`} body="New resources are added here as REGROWTH publishes them." />
        )}
      </Section>

      <Section>
        <NeedHelp />
      </Section>
    </SubScreen>
  );
}
