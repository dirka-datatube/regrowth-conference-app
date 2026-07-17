'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Check-in desk. Works with a USB/bluetooth barcode scanner (keyboard wedge):
// focus the field, scan the attendee's QR, enter submits. Manual paste works too.
export default function CheckinDesk() {
  const [log, setLog] = useState<{ label: string; ok: boolean }[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refreshCount() {
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase()
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('day', today);
    setTodayCount(count ?? 0);
  }

  useEffect(() => {
    refreshCount();
  }, []);

  async function scan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = inputRef.current;
    if (!input?.value) return;
    const token = input.value.trim();
    input.value = '';

    const { data, error } = await supabase().functions.invoke('check-in', {
      body: { qr_token: token },
    });

    if (error || data?.error) {
      setLog((l) => [{ label: `✗ ${data?.error ?? error?.message}`, ok: false }, ...l].slice(0, 20));
    } else {
      setLog((l) => [
        { label: data.already ? '✓ Already in today' : '✓ Checked in', ok: true },
        ...l,
      ].slice(0, 20));
      refreshCount();
    }
    input.focus();
  }

  return (
    <div>
      <h2>Check-in desk</h2>
      <p className="sub">
        Keep this field focused and scan attendee QR codes — each scan checks
        them in for today. Works with any keyboard-wedge scanner.
      </p>

      <div className="card">
        <div className="stat">{todayCount}</div>
        <div className="sub" style={{ margin: 0 }}>checked in today</div>
      </div>

      <form onSubmit={scan} className="card">
        <label>Scan / paste QR payload</label>
        <input ref={inputRef} autoFocus placeholder="regrowth:…" />
        <button type="submit">Check in</button>
      </form>

      <div className="card">
        {log.length === 0 ? (
          <span className="sub">Scans will appear here.</span>
        ) : (
          log.map((entry, i) => (
            <div key={i} className={entry.ok ? 'ok' : 'warn'}>{entry.label}</div>
          ))
        )}
      </div>
    </div>
  );
}
