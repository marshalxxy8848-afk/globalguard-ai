const CACHE = 'globalguard-v2';
const ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/login',
  '/register',
  '/history',
  '/tools/hs-lookup',
  '/tools/duty-calculator',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  // Always try network first for HTML/document requests, fall back to cache
  if (request.mode === 'navigate' || request.destination === 'document') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/')),
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      if (res.ok && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
      }
      return res;
    })),
  );
});
