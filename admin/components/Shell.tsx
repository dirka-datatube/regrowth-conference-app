'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type Gate = 'loading' | 'signed_out' | 'not_admin' | 'ok';

const NAV = [
  ['Dashboard', '/'],
  ['Agenda', '/agenda'],
  ['Speakers', '/speakers'],
  ['Partners', '/partners'],
  ['Attendees', '/attendees'],
  ['FAQs', '/faqs'],
  ['Q&A moderation', '/questions'],
  ['Push composer', '/push'],
  ['Auction', '/auction'],
  ['Check-in desk', '/checkin'],
  ['Check-in poster', '/poster'],
  ['Reports', '/reports'],
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const [gate, setGate] = useState<Gate>('loading');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const sb = supabase();
    async function evaluate() {
      const { data } = await sb.auth.getSession();
      if (!data.session) {
        setGate('signed_out');
        return;
      }
      const { data: admin } = await sb
        .from('admin_users')
        .select('id')
        .eq('user_id', data.session.user.id)
        .maybeSingle();
      setGate(admin ? 'ok' : 'not_admin');
    }
    evaluate();
    const { data: sub } = sb.auth.onAuthStateChange(() => evaluate());
    return () => sub.subscription.unsubscribe();
  }, []);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) alert(error.message);
    else setSent(true);
  }

  if (gate === 'loading') {
    return <div className="main"><p className="sub">Loading…</p></div>;
  }

  if (gate === 'signed_out') {
    return (
      <div className="main" style={{ maxWidth: 420, margin: '10vh auto' }}>
        <h2>REGROWTH® Conference Admin</h2>
        <p className="sub">Sign in with your admin email.</p>
        {sent ? (
          <div className="card">Check your inbox — tap the link and this page will refresh.</div>
        ) : (
          <form onSubmit={sendLink} className="card">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@regrowth.au" />
            <button type="submit">Send magic link</button>
          </form>
        )}
      </div>
    );
  }

  if (gate === 'not_admin') {
    return (
      <div className="main" style={{ maxWidth: 480, margin: '10vh auto' }}>
        <h2>Not an admin account</h2>
        <p className="sub">
          This email isn't on the admin list. Ask an existing owner to add you,
          then sign in again.
        </p>
        <button className="ghost" onClick={() => supabase().auth.signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="shell">
      <nav className="nav">
        <h1>REGROWTH®</h1>
        {NAV.map(([label, href]) => (
          <a key={href} href={href}>{label}</a>
        ))}
        <a href="#" onClick={(e) => { e.preventDefault(); supabase().auth.signOut(); }}>
          Sign out
        </a>
      </nav>
      <main className="main">{children}</main>
    </div>
  );
}
