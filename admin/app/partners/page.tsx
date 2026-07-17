'use client';

import { Crud } from '@/components/Crud';

export default function Partners() {
  return (
    <div>
      <h2>Partners</h2>
      <p className="sub">
        Tags drive "Solutions to Support Your Business" filtering
        (recruitment, tech, marketing, banking, training…).
      </p>
      <Crud
        title="partner"
        table="partners"
        orderBy="display_order"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description', type: 'textarea', hideInList: true },
          { key: 'solutions_content', label: 'Solutions content', type: 'textarea', hideInList: true },
          { key: 'logo_url', label: 'Logo URL', hideInList: true },
          { key: 'website_url', label: 'Website' },
          { key: 'contact_email', label: 'Lead email' },
          { key: 'tags', label: 'Tags', type: 'tags' },
          { key: 'is_featured', label: 'Featured', type: 'bool' },
          { key: 'display_order', label: 'Order', type: 'number' },
        ]}
      />
    </div>
  );
}
