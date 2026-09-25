// Browser smoke test for the demo export — the Sprint 07 definition of done.
//
//   npm run build:web:demo && npm run test:smoke
//
// Serves dist-demo and opens every tab, My Tickets, and the page a scanned
// badge opens, at 402×874 in both registration states. Fails on any console
// error, page error, or missing state marker. Then decodes the badge QR on
// Profile and the ticket QR on Events, and checks both carry the attendee's
// badge URL.
//
// SMOKE_SHOTS=<dir> also saves a screenshot of every page.

import { createServer } from 'node:http';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';

const ROOT = fileURLToPath(new URL('../dist-demo/', import.meta.url));
const SHOTS = process.env.SMOKE_SHOTS;
const DEMO_TOKEN = 'demoqr12345678'; // lib/demo.ts, Navigate registration

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
};

// Single-page app server: real files as they are, every other path gets the shell.
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  let file = join(ROOT, path);
  if (!file.startsWith(ROOT)) file = join(ROOT, 'index.html');
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
  } catch {
    file = join(ROOT, 'index.html');
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://localhost:${server.address().port}`;

// What each page must show in each state.
const PAGES = [
  { path: '/', name: 'home', registered: ['ACCESS EVENT', 'You’re Registered!'], unregistered: ['GET STARTED'], both: ['Quick Access', 'Featured', 'Need Help?', 'Continue Learning'] },
  { path: '/alerts', name: 'alerts', both: ['Registration Confirmed', 'Networking Opportunity'] },
  { path: '/events', name: 'events', registered: ['View My QR Code'], unregistered: ['registrations are now open'], both: ['Welcome to REGROWTH events!'] },
  { path: '/insights', name: 'insights', both: ['Insights'] },
  { path: '/connect', name: 'connect', both: ['Attendee Networking', 'Navigate 2027 Community', 'Meet Our Partners'] },
  { path: '/me', name: 'profile', registered: ['VERIFIED BADGE', 'NAVIGATE 2027 ATTENDEE'], unregistered: ['No active tickets'], both: ['My Tickets', 'App Settings'] },
  { path: '/tickets', name: 'tickets', tabBar: false, registered: ['Study Tour 2027 Badge'], unregistered: ['No active tickets'], both: ['Fastpass Entry Gateway'] },
  // A phone camera opening a badge URL (lib/qr.ts).
  { path: '/c/demoqr87654321', name: 'scanned-badge', tabBar: false, both: ['James Patel', 'Connect'] },
];

const failures = [];
const fail = (msg) => failures.push(msg);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const context = await browser.newContext({
  viewport: { width: 402, height: 874 },
  deviceScaleFactor: 2,
  serviceWorkers: 'block',
});
if (SHOTS) await mkdir(SHOTS, { recursive: true });

async function decodeQr(locator) {
  const png = PNG.sync.read(await locator.screenshot());
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null;
}

function checkBadgeUrl(where, data) {
  if (!data) return fail(`${where}: QR did not decode`);
  if (!/^https?:\/\/[^/]+\/c\/demoqr12345678$/.test(data)) fail(`${where}: QR decoded to ${data}`);
  else console.log(`  ✓ ${where} QR → ${data}`);
}

for (const registered of [true, false]) {
  const state = registered ? 'registered' : 'unregistered';
  console.log(`\n${state}`);
  for (const p of PAGES) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(`${base}${p.path}?registered=${registered ? 1 : 0}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const expected = [...(p.both ?? []), ...((registered ? p.registered : p.unregistered) ?? [])];
    for (const text of expected) {
      if (!(await page.getByText(text, { exact: false }).first().isVisible().catch(() => false))) {
        // Below the fold counts: the marker only has to be on the page.
        if (!(await page.getByText(text, { exact: false }).count())) fail(`${state} ${p.name}: missing "${text}"`);
      }
    }
    if (p.tabBar !== false) {
      for (const tab of ['Home', 'Alerts', 'Events', 'Insights', 'Connect', 'Profile']) {
        if (!(await page.getByRole('tab', { name: tab, exact: true }).count())) {
          fail(`${state} ${p.name}: tab bar is missing ${tab}`);
        }
      }
    }

    if (registered && p.name === 'profile') {
      checkBadgeUrl('Profile badge', await decodeQr(page.getByLabel('Navigate 2027 entry QR code for Kylie Walsh')));
    }
    if (registered && p.name === 'events') {
      await page.getByText('View My QR Code').click();
      await page.waitForTimeout(800); // the modal fades in
      checkBadgeUrl('Events ticket', await decodeQr(page.getByLabel('QR code for Kylie Walsh')));
    }
    if (!registered && p.name === 'connect') {
      const locked = await page.getByLabel(/locked until you register/).count();
      if (locked !== 2) fail(`unregistered connect: expected 2 locked communities, found ${locked}`);
    }

    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${state}-${p.name}.png`), fullPage: true });
    for (const e of errors) fail(`${state} ${p.name}: console error — ${e}`);
    console.log(`  ${errors.length ? '✗' : '✓'} ${p.name}`);
    await page.close();
  }
}

await browser.close();
server.close();

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nSmoke test passed.');
