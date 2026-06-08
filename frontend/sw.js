const CACHE = 'finance-ai-v1';
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

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

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

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        if (url.pathname === '/dashboard.html') return caches.match('/');
        return caches.match('/');
      });
    })
  );
});
