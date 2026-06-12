const CACHE = 'finance-ai-v3';
const CDN_CACHE = 'finance-ai-cdn-v2';

const ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/investimentos.html',
  '/categorias.html',
  '/consultor.html',
  '/style.css',
  '/app.js',
  '/charts.js',
  '/invest-charts.js',
  '/cat-charts.js',
  '/consultor.js',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/sw.js',
];

const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js',
];

const API_PATHS = ['/upload', '/transacoes', '/resumo', '/dashboard', '/contas', '/categorias', '/categorias-list', '/investimentos', '/consultor', '/analise-carteira'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    Promise.allSettled([
      caches.open(CACHE).then((cache) => cache.addAll(ASSETS)),
      caches.open(CDN_CACHE).then((cache) => cache.addAll(CDN_URLS)),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE && k !== CDN_CACHE).map((k) => caches.delete(k)))
      ),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isCDN = CDN_URLS.some((cdn) => e.request.url.startsWith(cdn));
  const isAPI = API_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p + '?'));
  const isStatic = e.request.destination === 'document' || e.request.destination === 'style' || e.request.destination === 'script';
  const isSameOrigin = url.origin === self.location.origin;

  if (isCDN) {
    e.respondWith(cacheFirst(e.request, CDN_CACHE));
    return;
  }

  if (isAPI) {
    e.respondWith(networkFirst(e.request));
    return;
  }

  if (isStatic || isSameOrigin) {
    e.respondWith(cacheFirst(e.request, CACHE));
    return;
  }

  e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 })));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    fetchAndUpdate(request, cacheName);
    return cached;
  }
  return fetchAndStore(request, cacheName);
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.status === 200) {
      const clone = res.clone();
      caches.open(CACHE).then((cache) => cache.put(request, clone));
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Offline — conecte ao servidor local (http://localhost:3000)' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function fetchAndStore(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res.status === 200) {
      const clone = res.clone();
      caches.open(cacheName).then((cache) => cache.put(request, clone));
    }
    return res;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function fetchAndUpdate(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res.status === 200) {
      const clone = res.clone();
      caches.open(cacheName).then((cache) => cache.put(request, clone));
    }
  } catch {
    // Silently fail — cached version is good enough
  }
}
