'use client';

import { useEffect, useState } from 'react';
import { supabase, EVENT_ID } from '@/lib/supabase';

type Stats = {
  attendees: number;
  checkedInToday: number;
  sessions: number;
  pendingQuestions: number;
  partnerLeads: number;
  pushSent: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const today = new Date().toISOString().slice(0, 10);
      const count = async (table: string, filter?: (q: any) => any) => {
        let q = sb.from(table).select('*', { count: 'exact', head: true });
        if (filter) q = filter(q);
        const { count: c } = await q;
        return c ?? 0;
      };

      setStats({
        attendees: await count('attendees', (q) => q.eq('event_id', EVENT_ID)),
        checkedInToday: await count('check_ins', (q) => q.eq('day', today)),
        sessions: await count('sessions', (q) => q.eq('event_id', EVENT_ID)),
        pendingQuestions: await count('questions', (q) => q.eq('event_id', EVENT_ID).eq('status', 'pending')),
        partnerLeads: await count('partner_interest'),
        pushSent: await count('notifications', (q) => q.eq('event_id', EVENT_ID).not('sent_at', 'is', null)),
      });

      const { data: runs } = await sb
        .from('sync_runs')
        .select('job, ok, finished_at, detail')
        .order('started_at', { ascending: false })
        .limit(8);
      setHealth(runs ?? []);
    })();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <p className="sub">REGROWTH® Annual Conference 2026</p>

      <div className="grid">
        {stats &&
          (
            [
              ['Attendees', stats.attendees],
              ['Checked in today', stats.checkedInToday],
              ['Sessions', stats.sessions],
              ['Questions to moderate', stats.pendingQuestions],
              ['Partner leads', stats.partnerLeads],
              ['Pushes sent', stats.pushSent],
            ] as const
          ).map(([label, value]) => (
            <div className="card" key={label}>
              <div className="stat">{value}</div>
              <div className="sub" style={{ margin: 0 }}>{label}</div>
            </div>
          ))}
      </div>

      <h2 style={{ marginTop: 32 }}>Pipeline health</h2>
      <p className="sub">Recent scheduled-job runs (AC sync, reminders, AI sweeps).</p>
      <table>
        <thead>
          <tr><th>Job</th><th>Status</th><th>Finished</th><th>Detail</th></tr>
        </thead>
        <tbody>
          {health.map((r, i) => (
            <tr key={i}>
              <td>{r.job}</td>
              <td className={r.ok ? 'ok' : 'warn'}>{r.ok ? 'ok' : 'failed'}</td>
              <td>{r.finished_at ? new Date(r.finished_at).toLocaleString() : '—'}</td>
              <td><code style={{ fontSize: 12 }}>{JSON.stringify(r.detail)}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
