'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, audit, EVENT_ID } from '@/lib/supabase';

// Attendee list + edit + CSV import. ActiveCampaign remains the source of
// truth for email/name/company once its sync is configured — CSV import is
// for pre-AC loading and one-offs.
export default function Attendees() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    let query = supabase()
      .from('attendees')
      .select('id, name, email, company, role, visibility, dietary, interests, checked_in_at')
      .eq('event_id', EVENT_ID)
      .order('name')
      .limit(500);
    if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) alert(error.message);
    setRows(data ?? []);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (k: string) => (form.elements.namedItem(k) as HTMLInputElement)?.value ?? '';
    const values = {
      name: get('name'),
      email: get('email').toLowerCase(),
      company: get('company') || null,
      role: get('role') || null,
      dietary: get('dietary') || null,
      visibility: get('visibility') as 'public' | 'connections_only' | 'hidden',
      interests: get('interests').split(',').map((s) => s.trim()).filter(Boolean),
    };
    const sb = supabase();
    if (editing?.id) {
      const { error } = await sb.from('attendees').update(values).eq('id', editing.id);
      if (error) return alert(error.message);
      await audit('update', 'attendees', editing.id, values);
    } else {
      const { error } = await sb.from('attendees').insert({ ...values, event_id: EVENT_ID });
      if (error) return alert(error.message);
      await audit('create', 'attendees', undefined, values);
    }
    setEditing(null);
    load();
  }

  // CSV: name,email,company,role,interests,dietary — header row required.
  async function importCsv(file: File) {
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const idx = (k: string) => header.indexOf(k);
      if (idx('email') === -1 || idx('name') === -1) {
        alert('CSV needs at least "name" and "email" columns.');
        return;
      }
      const records = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        return {
          event_id: EVENT_ID,
          name: cols[idx('name')],
          email: cols[idx('email')]?.toLowerCase(),
          company: idx('company') >= 0 ? cols[idx('company')] || null : null,
          role: idx('role') >= 0 ? cols[idx('role')] || null : null,
          dietary: idx('dietary') >= 0 ? cols[idx('dietary')] || null : null,
          interests:
            idx('interests') >= 0
              ? (cols[idx('interests')] ?? '').split(';').map((s) => s.trim()).filter(Boolean)
              : [],
        };
      }).filter((r) => r.email && r.name);

      const { error } = await supabase()
        .from('attendees')
        .upsert(records, { onConflict: 'event_id,email' });
      if (error) return alert(error.message);
      await audit('csv_import', 'attendees', undefined, { count: records.length });
      alert(`Imported ${records.length} attendees.`);
      load();
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <h2>Attendees</h2>
      <p className="sub">
        CSV import: header row with name,email,company,role,interests,dietary —
        interests separated by semicolons. Existing emails are updated, not duplicated.
      </p>

      <div className="row">
        <div>
          <input placeholder="Search name / email / company" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ flex: 'none' }}>
          <input
            type="file"
            accept=".csv"
            disabled={importing}
            onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
          />
        </div>
        <div style={{ flex: 'none' }}>
          <button onClick={() => setEditing({})}>New attendee</button>
        </div>
      </div>

      {editing !== null && (
        <form className="card" onSubmit={save} key={editing?.id ?? 'new'}>
          <strong>{editing?.id ? 'Edit attendee' : 'New attendee'}</strong>
          <label>Name</label>
          <input name="name" defaultValue={editing?.name ?? ''} required />
          <label>Email</label>
          <input name="email" type="email" defaultValue={editing?.email ?? ''} required />
          <label>Company</label>
          <input name="company" defaultValue={editing?.company ?? ''} />
          <label>Role</label>
          <input name="role" defaultValue={editing?.role ?? ''} />
          <label>Dietary</label>
          <input name="dietary" defaultValue={editing?.dietary ?? ''} />
          <label>Interests (comma-separated)</label>
          <input name="interests" defaultValue={(editing?.interests ?? []).join(', ')} />
          <label>Directory visibility</label>
          <select name="visibility" defaultValue={editing?.visibility ?? 'public'}>
            <option value="public">public</option>
            <option value="connections_only">connections_only</option>
            <option value="hidden">hidden</option>
          </select>
          <div className="row">
            <button type="submit">Save</button>
            <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Company</th><th>Role</th><th>Visibility</th><th>Checked in</th><th /></tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.email}</td>
              <td>{a.company ?? '—'}</td>
              <td>{a.role ?? '—'}</td>
              <td>{a.visibility}</td>
              <td>{a.checked_in_at ? new Date(a.checked_in_at).toLocaleDateString() : '—'}</td>
              <td><button className="small ghost" onClick={() => setEditing(a)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
