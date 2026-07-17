'use client';

import { useEffect, useState } from 'react';
import { supabase, EVENT_ID } from '@/lib/supabase';

// Reports-lite: engagement counts + partner leads CSV export.
export default function Reports() {
  const [topSessions, setTopSessions] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [checkinsByDay, setCheckinsByDay] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const sb = supabase();

      const { data: picks } = await sb
        .from('schedule_picks')
        .select('session_id, session:sessions(title)')
        .limit(2000);
      const counts = new Map<string, { title: string; count: number }>();
      for (const p of (picks ?? []) as any[]) {
        const entry = counts.get(p.session_id) ?? { title: p.session?.title ?? '?', count: 0 };
        entry.count++;
        counts.set(p.session_id, entry);
      }
      setTopSessions(Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 10));

      const { data: leadRows } = await sb
        .from('partner_interest')
        .select('created_at, attendee:attendees(name, email, company), partner:partners(name)')
        .order('created_at', { ascending: false })
        .limit(1000);
      setLeads((leadRows ?? []) as any[]);

      const { data: checkins } = await sb.from('check_ins').select('day').limit(5000);
      const byDay: Record<string, number> = {};
      for (const c of checkins ?? []) byDay[c.day] = (byDay[c.day] ?? 0) + 1;
      setCheckinsByDay(byDay);
    })();
  }, []);

  function exportLeadsCsv() {
    const header = 'partner,attendee,email,company,date';
    const rows = leads.map((l) =>
      [l.partner?.name, l.attendee?.name, l.attendee?.email, l.attendee?.company, l.created_at]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'partner-leads.csv';
    a.click();
  }

  return (
    <div>
      <h2>Reports</h2>
      <p className="sub">Event {EVENT_ID.slice(0, 8)} — live data.</p>

      <div className="card">
        <strong>Check-ins by day</strong>
        <table>
          <thead><tr><th>Day</th><th>Check-ins</th></tr></thead>
          <tbody>
            {Object.entries(checkinsByDay).sort().map(([day, count]) => (
              <tr key={day}><td>{day}</td><td>{count}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <strong>Top sessions by schedule picks</strong>
        <table>
          <thead><tr><th>Session</th><th>Picks</th></tr></thead>
          <tbody>
            {topSessions.map((s, i) => (
              <tr key={i}><td>{s.title}</td><td>{s.count}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <strong>Partner leads ({leads.length})</strong>{' '}
        <button className="small" onClick={exportLeadsCsv}>Export CSV</button>
        <table>
          <thead><tr><th>Partner</th><th>Attendee</th><th>Email</th><th>When</th></tr></thead>
          <tbody>
            {leads.slice(0, 50).map((l, i) => (
              <tr key={i}>
                <td>{l.partner?.name}</td>
                <td>{l.attendee?.name}</td>
                <td>{l.attendee?.email}</td>
                <td>{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
