#!/usr/bin/env node
/**
 * Inject PWA head tags into the exported SPA shell.
 *
 * Why this exists: `app/+html.tsx` is only honoured by Expo Router's *static*
 * rendering. We export with `web.output: "single"` — the app is entirely
 * behind a login so prerendering buys no SEO, and Supabase's auth client
 * touches `window.localStorage` at module load, which crashes a Node prerender
 * pass. That leaves the SPA shell as Expo's default template, which has no
 * manifest link and no iOS standalone meta.
 *
 * Without these tags the page is not installable, and on iOS an uninstalled
 * page gets no web push at all — which is the whole reason the install prompt
 * exists. So this step is required, not cosmetic. It runs as part of
 * `npm run build:web`.
 *
 * Idempotent: re-running against an already-patched shell is a no-op.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const indexPath = join(dist, 'index.html');

if (!existsSync(indexPath)) {
  console.error(`✗ ${indexPath} not found — run \`expo export --platform web\` first.`);
  process.exit(1);
}

const MARKER = '<!-- pwa-head -->';
const HEAD = `${MARKER}
    <meta name="description" content="Your companion for Navigate, the REGROWTH Annual Conference, and the REGROWTH Study Tour." />
    <link rel="manifest" href="/manifest.json" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="REGROWTH" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <style>
      html, body { background-color: #04072F; }
      body { overscroll-behavior-y: none; }
    </style>`;

let html = readFileSync(indexPath, 'utf8');

if (html.includes(MARKER)) {
  console.log('• PWA head already present — nothing to do.');
  process.exit(0);
}

// `viewport-fit=cover` lets the layout run under the notch and home indicator,
// which the design's full-bleed tab bar depends on.
html = html.replace(
  /<meta name="viewport" content="([^"]*)"\s*\/?>/,
  (m, content) =>
    content.includes('viewport-fit')
      ? m
      : `<meta name="viewport" content="${content}, viewport-fit=cover" />`,
);

// Expo's default template emits `httpEquiv` (a React prop name) rather than
// the valid HTML `http-equiv`. Harmless but invalid — fix it on the way past.
html = html.replace(/httpEquiv=/g, 'http-equiv=');

if (!html.includes('</head>')) {
  console.error('✗ No </head> in the exported shell — Expo template changed?');
  process.exit(1);
}
html = html.replace('</head>', `  ${HEAD}\n  </head>`);

writeFileSync(indexPath, html);

const required = ['manifest.json', 'sw.js', 'icons/icon-192.png', 'icons/icon-512.png'];
const missing = required.filter((f) => !existsSync(join(dist, f)));
if (missing.length) {
  console.error(`✗ Missing from the build: ${missing.join(', ')}`);
  console.error('  These live in public/ and should be copied by the export.');
  process.exit(1);
}

console.log('✓ PWA head injected; manifest, service worker and icons present.');
