'use client';

import { Crud } from '@/components/Crud';

export default function Speakers() {
  return (
    <div>
      <h2>Speakers</h2>
      <p className="sub">
        Headshot URLs point at the `headshots` storage bucket — upload via
        Storage in the Supabase dashboard for now, or paste any public URL.
      </p>
      <Crud
        title="speaker"
        table="speakers"
        orderBy="display_order"
        warnOnRow={(row) =>
          row.linkedin_url && !/^https:\/\/(www\.)?linkedin\.com\//.test(row.linkedin_url)
            ? 'LinkedIn URL looks wrong'
            : null
        }
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'title', label: 'Role' },
          { key: 'company', label: 'Company' },
          { key: 'bio', label: 'Bio', type: 'textarea', hideInList: true },
          { key: 'headshot_url', label: 'Headshot URL', hideInList: true },
          { key: 'linkedin_url', label: 'LinkedIn URL' },
          { key: 'tags', label: 'Tags', type: 'tags' },
          { key: 'display_order', label: 'Order', type: 'number' },
        ]}
      />
    </div>
  );
}
