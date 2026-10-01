/* REGROWTH Events — service worker.
 *
 * Scope is deliberately narrow. We cache the app shell and static assets so
 * the app opens on a bad conference wifi, and we let every API call go to the
 * network. We do NOT queue writes offline: Background Sync is unsupported in
 * Safari, so a queue would work on Android and silently fail on iPhone, which
 * is worse than not offering it. See docs/SPEC-V3-GAP-ANALYSIS.md §4.
 */

const VERSION = 'v1';
const SHELL_CACHE = `regrowth-shell-${VERSION}`;
const ASSET_CACHE = `regrowth-assets-${VERSION}`;

const SHELL = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase et al. — network only

  // Navigations: network first, fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/').then((r) => r ?? Response.error())),
    );
    return;
  }

  // Static assets: cache first, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(ASSET_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    }),
  );
});

/* Web push. On iOS this only fires for pages installed to the home screen —
 * the install prompt is what unlocks it. */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'REGROWTH', body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'REGROWTH', {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url ?? '/' },
      tag: payload.tag,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => 'focus' in c);
      if (open) {
        open.navigate(target);
        return open.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
