const CACHE = 'dearosagyefo-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/letters.html',
  '/about.html',
  '/from-osagyefo.html',
  '/quiz.html',
  '/write.html',
  '/manifest.json',
  '/thumbnail.png',
  '/Kwame.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for HTML, cache-first for everything else
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Skip cross-origin requests (analytics, CDN scripts, etc.)
  if (url.origin !== self.location.origin) return;

  const isHTML = e.request.headers.get('accept')?.includes('text/html');

  if (isHTML) {
    // Network-first: always try to get fresh HTML; fall back to cache
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first: serve from cache instantly; revalidate in background
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        });
        return cached || network;
      })
    );
  }
});
