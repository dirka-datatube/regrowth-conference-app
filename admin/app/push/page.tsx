'use client';

import { useEffect, useState } from 'react';
import { supabase, audit, EVENT_ID } from '@/lib/supabase';

// Push composer. Rows insert into `notifications`; the process_queue cron
// (every minute) delivers via send-push, which enforces the 4/day cap and
// per-category opt-outs. Admin announcements bypass both.
export default function Push() {
  const [history, setHistory] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [target, setTarget] = useState<'all' | 'individuals'>('all');
  const [selected, setSelected] = useState<string[]>([]);

  async function load() {
    const sb = supabase();
    const { data } = await sb
      .from('notifications')
      .select('id, type, title, body, scheduled_at, sent_at, created_at')
      .eq('event_id', EVENT_ID)
      .order('created_at', { ascending: false })
      .limit(30);
    setHistory(data ?? []);
    const { data: att } = await sb
      .from('attendees')
      .select('id, name')
      .eq('event_id', EVENT_ID)
      .order('name')
      .limit(500);
    setAttendees(att ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (k: string) => (form.elements.namedItem(k) as HTMLInputElement)?.value ?? '';

    const scheduledAtLocal = get('scheduled_at');
    const row = {
      event_id: EVENT_ID,
      type: get('type'),
      title: get('title'),
      body: get('body'),
      data: get('route') ? { route: get('route') } : {},
      target_segment: target === 'all' ? {} : { attendee_ids: selected },
      scheduled_at: scheduledAtLocal ? new Date(scheduledAtLocal).toISOString() : new Date().toISOString(),
    };

    if (target === 'individuals' && selected.length === 0) {
      alert('Pick at least one recipient.');
      return;
    }

    const { data, error } = await supabase().from('notifications').insert(row).select('id').single();
    if (error) return alert(error.message);
    await audit('compose_push', 'notifications', data?.id, row);
    alert('Queued — delivery within a minute of the scheduled time.');
    form.reset();
    setSelected([]);
    load();
  }

  return (
    <div>
      <h2>Push composer</h2>
      <p className="sub">
        Keep it short: ~40 characters of title survive the lock screen. Voice:
        "we", positive, solutions-focused. Max 4 non-announcement pushes reach
        any attendee per day — the queue drops the lowest-priority extras.
      </p>

      <form className="card" onSubmit={send}>
        <label>Category</label>
        <select name="type" defaultValue="admin_announcement">
          <option value="admin_announcement">Admin announcement (can't be muted)</option>
          <option value="partner_spotlight">Partner spotlight</option>
          <option value="dont_miss">Don't miss this</option>
          <option value="people_to_meet">People to meet</option>
        </select>
        <label>Title</label>
        <input name="title" required maxLength={80} />
        <label>Body</label>
        <textarea name="body" required maxLength={220} />
        <label>Deep link route (optional, e.g. /session/&lt;id&gt; or /auction)</label>
        <input name="route" placeholder="/agenda" />
        <label>Schedule (blank = send now)</label>
        <input name="scheduled_at" type="datetime-local" />

        <label>Audience</label>
        <div className="row">
          <div style={{ flex: 'none' }}>
            <button type="button" className={target === 'all' ? '' : 'ghost'} onClick={() => setTarget('all')}>
              Everyone
            </button>
          </div>
          <div style={{ flex: 'none' }}>
            <button type="button" className={target === 'individuals' ? '' : 'ghost'} onClick={() => setTarget('individuals')}>
              Individuals
            </button>
          </div>
        </div>
        {target === 'individuals' && (
          <select
            multiple
            size={8}
            value={selected}
            onChange={(e) => setSelected(Array.from(e.target.selectedOptions).map((o) => o.value))}
            style={{ marginTop: 8 }}
          >
            {attendees.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}

        <button type="submit">Queue push</button>
      </form>

      <h2 style={{ marginTop: 24 }}>History</h2>
      <table>
        <thead>
          <tr><th>Type</th><th>Title</th><th>Scheduled</th><th>Sent</th></tr>
        </thead>
        <tbody>
          {history.map((n) => (
            <tr key={n.id}>
              <td>{n.type}</td>
              <td>{n.title}</td>
              <td>{n.scheduled_at ? new Date(n.scheduled_at).toLocaleString() : '—'}</td>
              <td className={n.sent_at ? 'ok' : 'warn'}>
                {n.sent_at ? new Date(n.sent_at).toLocaleString() : 'queued'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
