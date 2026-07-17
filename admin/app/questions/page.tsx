'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, audit, EVENT_ID } from '@/lib/supabase';

// Q&A moderation: approve / reject / mark answered. Approved questions
// appear in the app feed in realtime.
export default function Questions() {
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'answered'>('pending');

  const load = useCallback(async () => {
    const { data, error } = await supabase()
      .from('questions')
      .select('id, body, anonymous, status, upvotes, created_at, attendee:attendees(name), speaker:speakers(name), session:sessions(title)')
      .eq('event_id', EVENT_ID)
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) alert(error.message);
    setRows(data ?? []);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    const patch: Record<string, unknown> = { status };
    if (status === 'answered') patch.answered_at = new Date().toISOString();
    const { error } = await supabase().from('questions').update(patch).eq('id', id);
    if (error) return alert(error.message);
    await audit(`question_${status}`, 'questions', id);
    load();
  }

  return (
    <div>
      <h2>Q&amp;A moderation</h2>
      <p className="sub">
        Attendee names are visible here for moderation — the app never shows
        them for anonymous questions.
      </p>

      <div className="row">
        {(['pending', 'approved', 'answered', 'rejected'] as const).map((f) => (
          <div style={{ flex: 'none' }} key={f}>
            <button className={filter === f ? '' : 'ghost'} onClick={() => setFilter(f)}>{f}</button>
          </div>
        ))}
      </div>

      <table>
        <thead>
          <tr><th>Question</th><th>From</th><th>Target</th><th>Votes</th><th /></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={{ maxWidth: 420 }}>{row.body}</td>
              <td>
                {row.attendee?.name ?? '—'}
                {row.anonymous && <div className="warn">anonymous in app</div>}
              </td>
              <td>{row.speaker?.name ?? row.session?.title ?? 'General'}</td>
              <td>{row.upvotes}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {filter !== 'approved' && (
                  <button className="small" onClick={() => setStatus(row.id, 'approved')}>Approve</button>
                )}{' '}
                {filter !== 'answered' && (
                  <button className="small secondary" onClick={() => setStatus(row.id, 'answered')}>Answered</button>
                )}{' '}
                {filter !== 'rejected' && (
                  <button className="small danger" onClick={() => setStatus(row.id, 'rejected')}>Reject</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
