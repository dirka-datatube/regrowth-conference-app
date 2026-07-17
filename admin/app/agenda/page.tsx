'use client';

import { useEffect, useState } from 'react';
import { Crud } from '@/components/Crud';
import { supabase, audit } from '@/lib/supabase';

// Sessions CRUD with same-room overlap warnings + speaker assignment.
export default function Agenda() {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: sp } = await sb.from('speakers').select('id, name').order('name');
      setSpeakers(sp ?? []);
      const { data: links } = await sb.from('session_speakers').select('session_id, speaker_id');
      const map: Record<string, string[]> = {};
      for (const l of links ?? []) {
        (map[l.session_id] ??= []).push(l.speaker_id);
      }
      setAssignments(map);
    })();
  }, [refreshKey]);

  async function toggleSpeaker(sessionId: string, speakerId: string) {
    const sb = supabase();
    const current = assignments[sessionId] ?? [];
    if (current.includes(speakerId)) {
      await sb.from('session_speakers').delete().eq('session_id', sessionId).eq('speaker_id', speakerId);
      await audit('unassign_speaker', 'session_speakers', sessionId, { speakerId });
    } else {
      await sb.from('session_speakers').insert({ session_id: sessionId, speaker_id: speakerId });
      await audit('assign_speaker', 'session_speakers', sessionId, { speakerId });
    }
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <h2>Agenda</h2>
      <p className="sub">
        Changes appear in the app within 30 seconds. Unpublished sessions are
        hidden from attendees.
      </p>
      <Crud
        title="session"
        table="sessions"
        orderBy="start_at"
        warnOnRow={(row, all) => {
          const overlap = all.find(
            (o) =>
              o.id !== row.id &&
              o.room &&
              o.room === row.room &&
              new Date(o.start_at) < new Date(row.end_at) &&
              new Date(row.start_at) < new Date(o.end_at),
          );
          return overlap ? `Overlaps "${overlap.title}" in ${row.room}` : null;
        }}
        fields={[
          { key: 'title', label: 'Title' },
          { key: 'abstract', label: 'Abstract', type: 'textarea', hideInList: true },
          { key: 'start_at', label: 'Starts', type: 'datetime' },
          { key: 'end_at', label: 'Ends', type: 'datetime' },
          { key: 'room', label: 'Room' },
          {
            key: 'type',
            label: 'Type',
            type: 'select',
            options: ['keynote', 'panel', 'workshop', 'breakout', 'meal', 'social', 'admin'],
          },
          { key: 'tags', label: 'Tags', type: 'tags', hideInList: true },
          { key: 'is_published', label: 'Published', type: 'bool' },
          {
            key: 'id',
            label: 'Speakers',
            listRender: (row) => (
              <details>
                <summary style={{ cursor: 'pointer', fontSize: 12 }}>
                  {(assignments[row.id] ?? [])
                    .map((id) => speakers.find((s) => s.id === id)?.name)
                    .filter(Boolean)
                    .join(', ') || 'Assign…'}
                </summary>
                {speakers.map((s) => (
                  <div key={s.id} style={{ fontSize: 12, marginTop: 4 }}>
                    <label style={{ display: 'inline', margin: 0 }}>
                      <input
                        type="checkbox"
                        style={{ width: 'auto', marginRight: 6 }}
                        checked={(assignments[row.id] ?? []).includes(s.id)}
                        onChange={() => toggleSpeaker(row.id, s.id)}
                      />
                      {s.name}
                    </label>
                  </div>
                ))}
              </details>
            ),
          },
        ]}
      />
    </div>
  );
}
