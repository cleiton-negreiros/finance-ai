const CACHE = 'finance-ai-v2';
const ASSETS = [
  '/',
  '/dashboard.html',
  '/index.html',
  '/style.css',
  '/app.js',
  '/charts.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

const CDN_CACHE = 'finance-ai-cdn-v1';
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  e.waitUntil(
    caches.open(CDN_CACHE).then((cache) => cache.addAll(CDN_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== CDN_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // CDN: cache-first
  if (CDN_URLS.some((cdn) => e.request.url.startsWith(cdn))) {
    e.respondWith(
      caches.open(CDN_CACHE).then((cache) =>
        cache.match(e.request).then((cached) => {
          if (cached) return cached;
          return fetch(e.request).then((res) => {
            if (res.status === 200) cache.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // API: network-first with offline fallback
  if (url.pathname.startsWith('/api/') || url.pathname === '/upload' || url.pathname === '/transacoes' || url.pathname === '/resumo' || url.pathname === '/dashboard' || url.pathname === '/contas') {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline - conecte ao servidor local' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Static: cache-first, network-update
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      });
      return cached || fetchPromise;
    })
  );
});
