'use client';

// Generic CRUD table for event-scoped entities. Field types cover what the
// conference schema needs: text, textarea, datetime, number, bool, tags.

import { useCallback, useEffect, useState } from 'react';
import { supabase, audit, EVENT_ID } from '@/lib/supabase';

export type Field = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'datetime' | 'number' | 'bool' | 'tags' | 'select';
  options?: string[];
  listRender?: (row: any) => React.ReactNode;
  hideInList?: boolean;
};

export function Crud({
  table,
  fields,
  orderBy = 'created_at',
  title,
  warnOnRow,
}: {
  table: string;
  fields: Field[];
  orderBy?: string;
  title: string;
  warnOnRow?: (row: any, all: any[]) => string | null;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase()
      .from(table)
      .select('*')
      .eq('event_id', EVENT_ID)
      .order(orderBy);
    if (error) alert(error.message);
    setRows(data ?? []);
    setLoading(false);
  }, [table, orderBy]);

  useEffect(() => {
    load();
  }, [load]);

  function fromForm(form: HTMLFormElement) {
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const el = form.elements.namedItem(f.key) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!el) continue;
      const v = el.value;
      if (f.type === 'bool') out[f.key] = (el as HTMLInputElement).checked;
      else if (f.type === 'number') out[f.key] = v === '' ? null : Number(v);
      else if (f.type === 'tags') out[f.key] = v.split(',').map((s) => s.trim()).filter(Boolean);
      else if (f.type === 'datetime') out[f.key] = v === '' ? null : new Date(v).toISOString();
      else out[f.key] = v === '' ? null : v;
    }
    return out;
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = fromForm(e.currentTarget);
    const sb = supabase();
    if (editing?.id) {
      const { error } = await sb.from(table).update(values).eq('id', editing.id);
      if (error) return alert(error.message);
      await audit('update', table, editing.id, values);
    } else {
      const { data, error } = await sb
        .from(table)
        .insert({ ...values, event_id: EVENT_ID })
        .select('id')
        .single();
      if (error) return alert(error.message);
      await audit('create', table, data?.id, values);
    }
    setEditing(null);
    load();
  }

  async function remove(row: any) {
    if (!confirm(`Delete this ${title.toLowerCase()}?`)) return;
    const { error } = await supabase().from(table).delete().eq('id', row.id);
    if (error) return alert(error.message);
    await audit('delete', table, row.id);
    load();
  }

  function toLocalInput(iso: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const listFields = fields.filter((f) => !f.hideInList);

  return (
    <div>
      {editing !== null ? (
        <form className="card" onSubmit={save} key={editing?.id ?? 'new'}>
          <strong>{editing?.id ? `Edit ${title}` : `New ${title}`}</strong>
          {fields.map((f) => (
            <div key={f.key}>
              <label>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea name={f.key} defaultValue={editing?.[f.key] ?? ''} />
              ) : f.type === 'bool' ? (
                <input name={f.key} type="checkbox" defaultChecked={!!editing?.[f.key]} style={{ width: 'auto' }} />
              ) : f.type === 'datetime' ? (
                <input name={f.key} type="datetime-local" defaultValue={toLocalInput(editing?.[f.key])} />
              ) : f.type === 'select' ? (
                <select name={f.key} defaultValue={editing?.[f.key] ?? f.options?.[0]}>
                  {(f.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  name={f.key}
                  type={f.type === 'number' ? 'number' : 'text'}
                  step={f.type === 'number' ? 'any' : undefined}
                  defaultValue={
                    f.type === 'tags'
                      ? (editing?.[f.key] ?? []).join(', ')
                      : editing?.[f.key] ?? ''
                  }
                />
              )}
            </div>
          ))}
          <div className="row">
            <button type="submit">Save</button>
            <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setEditing({})}>New {title}</button>
      )}

      {loading ? (
        <p className="sub">Loading…</p>
      ) : (
        <table>
          <thead>
            <tr>
              {listFields.map((f) => <th key={f.key}>{f.label}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const warning = warnOnRow?.(row, rows);
              return (
                <tr key={row.id}>
                  {listFields.map((f) => (
                    <td key={f.key}>
                      {f.listRender
                        ? f.listRender(row)
                        : f.type === 'tags'
                          ? (row[f.key] ?? []).map((t: string) => <span className="pill" key={t}>{t}</span>)
                          : f.type === 'bool'
                            ? (row[f.key] ? 'Yes' : '—')
                            : f.type === 'datetime'
                              ? (row[f.key] ? new Date(row[f.key]).toLocaleString() : '—')
                              : String(row[f.key] ?? '—')}
                    </td>
                  ))}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {warning && <div className="warn">⚠ {warning}</div>}
                    <button className="small ghost" onClick={() => setEditing(row)}>Edit</button>{' '}
                    <button className="small danger" onClick={() => remove(row)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
