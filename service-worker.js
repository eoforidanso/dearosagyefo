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

// Network-first for HTML/API, cache-first (with revalidation) for everything else.
// Every branch is guaranteed to resolve respondWith() to a real Response — never
// undefined or a rejected promise — so a network hiccup can't leave the page hanging.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Skip cross-origin requests (analytics, CDN scripts, etc.)
  if (url.origin !== self.location.origin) return;

  const isHTML = e.request.headers.get('accept')?.includes('text/html');
  const isAPI = url.pathname.startsWith('/api/');

  if (isHTML || isAPI) {
    // Network-first: always try to get fresh content.
    // HTML falls back to cache if offline; API responses are never cached (dynamic data).
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (!isAPI) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() =>
          isAPI
            ? Response.error()
            : caches.match(e.request).then(cached => cached || Response.error())
        )
    );
  } else {
    // Cache-first: serve from cache instantly; revalidate in background.
    e.respondWith(
      caches.match(e.request).then(cached => {
        const revalidate = fetch(e.request)
          .then(res => {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
            return res;
          })
          .catch(() => undefined);
        return cached || revalidate.then(res => res || Response.error());
      })
    );
  }
});
