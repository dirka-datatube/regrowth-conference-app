'use client';

import { useCallback, useEffect, useState } from 'react';
import { Crud } from '@/components/Crud';
import { Upload } from '@/components/Upload';
import { supabase, audit, EVENT_ID } from '@/lib/supabase';

// Items CRUD + close-out. Closing an item assigns the current top bidder as
// winner and queues their "you won" push (payment happens outside the app).
export default function Auction() {
  const [closable, setClosable] = useState<any[]>([]);

  const loadClosable = useCallback(async () => {
    const { data } = await supabase()
      .from('auction_items')
      .select('id, name, current_bid, current_bidder_id, is_open, winner_id, bidder:attendees!auction_items_current_bidder_id_fkey(name)')
      .eq('event_id', EVENT_ID)
      .order('ends_at');
    setClosable(data ?? []);
  }, []);

  useEffect(() => {
    loadClosable();
  }, [loadClosable]);

  async function closeItem(item: any) {
    if (!confirm(`Close "${item.name}" and assign the winner?`)) return;
    const sb = supabase();
    const { error } = await sb
      .from('auction_items')
      .update({ is_open: false, winner_id: item.current_bidder_id })
      .eq('id', item.id);
    if (error) return alert(error.message);
    await audit('close_auction_item', 'auction_items', item.id, { winner: item.current_bidder_id });

    if (item.current_bidder_id) {
      await sb.from('notifications').insert({
        event_id: EVENT_ID,
        type: 'auction',
        title: 'You won! 🎉',
        body: `Your bid on ${item.name} came out on top. See the auction page for what happens next.`,
        data: { route: '/auction' },
        target_segment: { attendee_ids: [item.current_bidder_id] },
        scheduled_at: new Date().toISOString(),
      });
    }
    loadClosable();
  }

  return (
    <div>
      <h2>Charity auction</h2>
      <p className="sub">
        Bids are validated server-side (atomic, minimum increment $1). Closing
        an item notifies the winner; settle payment outside the app.
      </p>

      <div className="card">
        <strong>Open items</strong>
        <table>
          <thead>
            <tr><th>Item</th><th>Top bid</th><th>Leader</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {closable.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{i.current_bid ? `$${i.current_bid}` : '—'}</td>
                <td>{i.bidder?.name ?? '—'}</td>
                <td className={i.is_open ? 'ok' : 'warn'}>{i.is_open ? 'open' : i.winner_id ? 'won' : 'closed'}</td>
                <td>
                  {i.is_open && (
                    <button className="small" onClick={() => closeItem(i)}>Close &amp; assign winner</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Upload bucket="auction" label="Upload an item photo (URL auto-copies)" />

      <Crud
        title="auction item"
        table="auction_items"
        orderBy="ends_at"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description', type: 'textarea', hideInList: true },
          { key: 'photo_url', label: 'Photo URL', hideInList: true },
          { key: 'starting_bid', label: 'Starting bid', type: 'number' },
          { key: 'ends_at', label: 'Ends', type: 'datetime' },
          { key: 'is_open', label: 'Open', type: 'bool' },
        ]}
      />
    </div>
  );
}
