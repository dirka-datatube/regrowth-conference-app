'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

// Direct-to-bucket uploader for brand assets. Returns the public URL —
// paste it into the row's URL field (or it's auto-copied to the clipboard).
export function Upload({ bucket, label }: { bucket: string; label?: string }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    setBusy(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error } = await supabase().storage.from(bucket).upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase().storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
      await navigator.clipboard.writeText(data.publicUrl).catch(() => {});
    } catch (e: any) {
      alert(e.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={{ padding: 14 }}>
      <label style={{ marginTop: 0 }}>{label ?? `Upload to ${bucket}`}</label>
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {url && (
        <p className="ok" style={{ wordBreak: 'break-all', fontSize: 12 }}>
          Copied to clipboard: {url}
        </p>
      )}
    </div>
  );
}
