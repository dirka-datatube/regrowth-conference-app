'use client';

import { Crud } from '@/components/Crud';
import { Upload } from '@/components/Upload';

export default function Speakers() {
  return (
    <div>
      <h2>Speakers</h2>
      <p className="sub">
        Upload a headshot below — the URL copies to your clipboard, ready to
        paste into the row's headshot field.
      </p>
      <Upload bucket="headshots" label="Upload a headshot (URL auto-copies)" />
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
