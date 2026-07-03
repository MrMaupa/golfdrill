// sw.js — Golfdrill service worker.
// Precaches the app shell so the app opens offline after one successful load.
// Firestore/Auth network traffic is NOT cached here — the Firestore SDK's own
// IndexedDB cache handles offline data. Bump CACHE on every deploy to refresh.

const CACHE = 'golfdrill-v6';

// Same-origin app shell. Relative paths so it works under a GitHub Pages subpath.
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './js/render.js',
  './js/firebase-init.js',
  './js/firestore-service.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isFirebaseCdn =
    url.origin === 'https://www.gstatic.com' && url.pathname.includes('/firebasejs/');

  // Same-origin app shell: stale-while-revalidate (instant + self-updating).
  if (isSameOrigin) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Versioned Firebase SDK modules from the CDN: cache-first (URLs are immutable).
  if (isFirebaseCdn) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Everything else (Firestore/Auth APIs, etc.): straight to network, uncached.
});

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);

  const fresh = cached || (await network);
  if (fresh) return fresh;

  // Offline navigation with nothing cached: fall back to the app shell.
  if (req.mode === 'navigate') {
    const shell = await cache.match('./index.html');
    if (shell) return shell;
  }
  return Response.error();
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return Response.error();
  }
}
