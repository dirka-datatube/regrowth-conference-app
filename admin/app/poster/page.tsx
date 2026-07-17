'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// Print-ready venue check-in poster. The QR deep-links to
// regrowth://check-in — scanning with the iPhone camera opens the app and
// checks the attendee in for today. Print via the browser (Cmd+P).
export default function Poster() {
  const [qr, setQr] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL('regrowth://check-in', {
      width: 640,
      margin: 1,
      color: { dark: '#04072F', light: '#FFFFFF' },
    }).then(setQr);
  }, []);

  return (
    <div>
      <style>{`
        @media print {
          .nav, .no-print { display: none !important; }
          .poster { border: none !important; }
        }
      `}</style>
      <h2 className="no-print">Check-in poster</h2>
      <p className="sub no-print">
        Print this page (Cmd/Ctrl+P) and place at the venue doors. Attendees
        scan with their camera — the app opens and checks them in.
      </p>

      <div
        className="poster"
        style={{
          background: '#FFFFFF',
          color: '#04072F',
          borderRadius: 24,
          border: '1px solid #E5E2D9',
          maxWidth: 640,
          margin: '24px auto',
          padding: '64px 48px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            margin: '0 auto',
            borderRadius: '50%',
            border: '3px solid #04072F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 30,
            fontFamily: 'Georgia, serif',
          }}
        >
          RG
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 300, fontSize: 40, margin: '28px 0 6px' }}>
          Welcome to REGROWTH®
        </h1>
        <p style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif', fontSize: 15, letterSpacing: 2, textTransform: 'uppercase', color: '#B85F3D' }}>
          Scan to check in
        </p>
        {qr && (
          <img src={qr} alt="Check-in QR code" style={{ width: 320, height: 320, margin: '24px auto' }} />
        )}
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#4A4E6E' }}>
          Point your camera at the code — the app does the rest.
          <br />
          No app yet? The team at the desk will scan you in.
        </p>
      </div>
    </div>
  );
}
