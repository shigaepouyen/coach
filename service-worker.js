/* Coach - service worker (offline-first)
   Rien de magique - juste du cache pour éviter que tout s'écroule dès que le réseau tousse. */

const CACHE_NAME = 'coach-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './app/app.js',
  './app/router.js',
  './app/ui.js',
  './app/db.js',
  './app/utils.js',
  './app/logic/apre.js',
  './app/logic/pain.js',
  './app/logic/minimalist.js',
  './app/data/exercises.js',
  './app/views/home.js',
  './app/views/onboarding.js',
  './app/views/apre.js',
  './app/views/pain.js',
  './app/views/minimalist.js',
  './app/views/history.js',
  './app/views/library.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// SPA friendly: toutes les navigations -> index.html
function isNavigation(request) {
  return request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (isNavigation(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match('./index.html');
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req)
      .then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      })
      .catch(() => cached);

    return cached || fetchPromise;
  })());
});
