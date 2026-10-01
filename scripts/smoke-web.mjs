// Browser smoke test for the demo export.
//
//   npm run build:web:demo && npm run test:smoke
//
// Serves dist-demo and opens every screen — the tabs, both event guides,
// Connect, Profile, notes, the signed-out account screens and the page a
// scanned badge opens — at 402×874 in both registration states. Fails on any
// console error, page error, or missing state marker. Then decodes the badge
// QR on Profile and the ticket QR on Events, checks both carry the attendee's
// badge URL, and walks sign out → log in.
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

const NAV = '00000000-0000-0000-0000-000000000001';
const TOUR = '00000000-0000-0000-0000-000000000002';

// What each page must show in each state. `tabBar: false` marks full-screen
// routes outside the tabs.
const ALL_PAGES = [
  { path: '/', name: 'home', registered: ['ACCESS EVENT', 'You’re Registered!'], unregistered: ['GET STARTED'], both: ['Quick Access', 'Featured', 'Need Help?', 'Continue Learning'] },
  { path: '/alerts', name: 'alerts', both: ['Registration Confirmed', 'Networking Opportunity'] },
  { path: '/events', name: 'events', registered: ['View My QR Code'], unregistered: ['registrations are now open'], both: ['Welcome to REGROWTH events!'] },
  { path: '/insights', name: 'insights', both: ['Insights'] },
  { path: '/connect', name: 'connect', both: ['Attendee Networking', 'Navigate 2027 Community', 'Meet Our Partners'] },
  { path: '/me', name: 'profile', registered: ['VERIFIED BADGE', 'NAVIGATE 2027 ATTENDEE'], unregistered: ['No active tickets'], both: ['My Tickets', 'App Settings'] },
  { path: '/me/tickets', name: 'tickets', registered: ['Study Tour 2027 Badge'], unregistered: ['No active tickets'], both: ['Fastpass Entry Gateway'] },
  // A phone camera opening a badge URL (lib/qr.ts).
  { path: '/c/demoqr87654321', name: 'scanned-badge', tabBar: false, both: ['James Patel', 'Connect'] },

  // Connect
  { path: `/connect/community/${NAV}`, name: 'community', registered: ['James Patel'], unregistered: ['Communities open with registration'], both: ['Navigate 2027 Community'] },
  { path: `/connect/community/${TOUR}`, name: 'community-tour', both: ['Study Tour 2027 Community'] },
  { path: '/connect/attendee/a3', name: 'attendee', registered: ['You’re connected'] },
  { path: '/connect/partners', name: 'partners', both: ['REGROWTH Partners', 'CommBank'] },
  { path: '/connect/partners/p1', name: 'partner', both: ['Register interest'] },
  { path: '/connect/podcast', name: 'podcast', both: ['Latest Episode'] },
  { path: '/connect/referral', name: 'referral', both: ['Find A Referral', 'Referrals are on their way'] },
  { path: '/scan', name: 'scan', tabBar: false, both: ['Upload From Gallery', 'No camera available'] },
  { path: '/support', name: 'support', tabBar: false, both: ['REGROWTH Assistant', 'Open Venue Map'] },

  // Event guides
  { path: `/events/${NAV}`, name: 'event-home', both: ['Quick Access', 'What’s Coming', 'Meet Our Partners'] },
  { path: `/events/${NAV}/welcome`, name: 'event-welcome', unregistered: ['Ask about tickets'], both: ['Explore the event'] },
  { path: `/events/${NAV}/agenda`, name: 'agenda', both: ['MARCH 15, 2027', 'Opening Keynote: Navigate 2027'] },
  { path: `/events/${NAV}/session/sess1`, name: 'session', registered: ['Saved to your schedule'], unregistered: ['Ask about tickets'], both: ['Opening Keynote: Navigate 2027'] },
  { path: `/events/${NAV}/speakers`, name: 'speakers', both: ['About Kylie'] },
  { path: `/events/${NAV}/speaker/s1`, name: 'speaker', both: ['Kylie Walsh'] },
  { path: `/events/${NAV}/map`, name: 'map', both: ['Quick Directory'] },
  { path: `/events/${NAV}/hotel`, name: 'hotel', both: ['REGROWTH GUEST BOOKING CODE'] },
  { path: `/events/${NAV}/pack`, name: 'pack', both: ['Essentials'] },
  { path: `/events/${NAV}/weather`, name: 'weather', both: ['Hourly Forecast', 'Perth'] },
  { path: `/events/${TOUR}`, name: 'tour-home', both: ['Quick Access', 'What’s Coming'] },
  { path: `/events/${TOUR}/agenda`, name: 'tour-agenda', both: ['JUNE 2, 2027'] },
  { path: `/events/${TOUR}/weather`, name: 'tour-weather', both: ['Hourly Forecast', 'Melbourne'] },

  // Profile
  { path: '/me/edit', name: 'edit-profile', both: ['About You', 'Interests'] },
  { path: '/me/saved', name: 'saved', registered: ['Opening Keynote: Navigate 2027'], both: ['Saved Sessions'] },
  { path: '/me/connections', name: 'connections', registered: ['Olivia Brown'], unregistered: ['No connections yet'], both: ['Networking Connections'] },
  { path: '/me/card', name: 'card', both: ['Scan a Business Card'] },
  { path: '/me/resources', name: 'resources', both: ['Templates & Resources'] },
  { path: '/me/services', name: 'services', both: ['REGROWTH Services', 'Our Services'] },
  { path: '/me/settings', name: 'settings', both: ['App Settings', 'Sign out'] },
  { path: '/me/rate', name: 'rate', both: ['Rate App'] },
  { path: '/me/privacy', name: 'privacy', both: ['Privacy Policy'] },
  { path: '/me/terms', name: 'terms', both: ['Terms & Conditions'] },
  { path: '/me/contact', name: 'contact', both: ['Send us a message'] },
  { path: '/legal/privacy', name: 'legal', tabBar: false, both: ['Privacy Policy'] },

  // Notes
  { path: '/notes/new', name: 'note-new', tabBar: false, registered: ['Navigate 2027', 'Saves as you type'], unregistered: ['Notes unlock with registration'], both: ['Create Note'] },
  { path: '/notes/n1', name: 'note', tabBar: false, registered: ['Consistency beats intensity', 'AI Summary'] },

  // Accounts: signed out. A link may open each of these directly.
  { path: '/welcome', name: 'auth-welcome', tabBar: false, both: ['Log in', 'Create account'] },
  { path: '/login', name: 'login', tabBar: false, both: ['Welcome back!', 'Forgot your password?'] },
  { path: '/signup', name: 'signup', tabBar: false, both: ['Create your account', 'Already have an account?'] },
  { path: '/forgot', name: 'forgot', tabBar: false, both: ['Forgot your password?', 'Send link'] },
  { path: '/check-email', name: 'check-email', tabBar: false, both: ['Confirm your email', 'Open the link in the email'] },
];

// SMOKE_ONLY=home,alerts runs a subset.
const only = process.env.SMOKE_ONLY?.split(',').map((x) => x.trim());
const PAGES = only ? ALL_PAGES.filter((p) => only.includes(p.name)) : ALL_PAGES;

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

// Sign out from App Settings, then log back in.
if (!only || only.includes('auth-flow')) {
  console.log('\naccounts');
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    await page.goto(`${base}/me/settings`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Sign out' }).first().click();
    await page.getByText('Sign Out', { exact: true }).click(); // the confirm dialog
    await page.getByText('Create account').first().waitFor({ timeout: 10_000 });
    console.log('  ✓ sign out → Welcome');
    await page.getByText('Log in', { exact: true }).first().click();
    await page.getByText('Welcome back!').first().waitFor({ timeout: 10_000 });
    await page.getByLabel('Email', { exact: true }).fill('kylie@regrowth.example');
    await page.getByLabel('Password', { exact: true }).fill('correct-horse');
    await page.getByRole('button', { name: 'Log in' }).last().click();
    await page.getByText('Quick Access').first().waitFor({ timeout: 10_000 });
    console.log('  ✓ log in → Home');
  } catch (e) {
    fail(`accounts: sign out → log in did not complete — ${String(e).split('\n')[0]}`);
    if (SHOTS) await page.screenshot({ path: join(SHOTS, 'auth-flow-failure.png'), fullPage: true });
  }
  for (const e of errors) fail(`accounts: console error — ${e}`);
  await page.close();
}

await browser.close();
server.close();

if (failures.length) {
  console.error(`\n${failures.length} failure(s):\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nSmoke test passed.');
