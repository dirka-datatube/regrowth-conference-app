'use client';

import { Crud } from '@/components/Crud';

export default function Faqs() {
  return (
    <div>
      <h2>FAQs</h2>
      <p className="sub">Ordered by the index column, lowest first.</p>
      <Crud
        title="FAQ"
        table="faqs"
        orderBy="order_index"
        fields={[
          { key: 'question', label: 'Question' },
          { key: 'answer', label: 'Answer', type: 'textarea' },
          { key: 'order_index', label: 'Order', type: 'number' },
        ]}
      />
    </div>
  );
}
