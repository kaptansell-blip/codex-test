/* Service worker: uygulamayı, haritaları ve fotoğrafları çevrimdışı sunar. */
const VERSION = 'nk-v2';
const SHELL = [
  './', 'index.html', 'styles.css', 'app.js', 'data.js', 'manifest.webmanifest',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'data/belgeler.enc.json',
  'fonts/cormorant-garamond-latin-600-normal.woff2', 'fonts/cormorant-garamond-latin-ext-600-normal.woff2', 'fonts/cormorant-garamond-cyrillic-600-normal.woff2',
  'fonts/cormorant-garamond-latin-700-normal.woff2', 'fonts/cormorant-garamond-latin-ext-700-normal.woff2', 'fonts/cormorant-garamond-cyrillic-700-normal.woff2',
  'fonts/pt-sans-latin-400-normal.woff2', 'fonts/pt-sans-latin-ext-400-normal.woff2', 'fonts/pt-sans-cyrillic-400-normal.woff2',
  'fonts/pt-sans-latin-700-normal.woff2', 'fonts/pt-sans-latin-ext-700-normal.woff2', 'fonts/pt-sans-cyrillic-700-normal.woff2',
  'fonts/pt-mono-latin-400-normal.woff2', 'fonts/pt-mono-latin-ext-400-normal.woff2', 'fonts/pt-mono-cyrillic-400-normal.woff2'
];
const TILES = 'nk-tiles-esri';
const OLD = ['nk-tiles']; // CARTO'nun "API KEY REQUIRED" karolarını içeren eski önbellek
const PHOTOS = 'nk-photos';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((k) => (k.startsWith('nk-v') && k !== VERSION) || OLD.includes(k))
    .map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function cacheFirst(cacheName, req, key) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(key || req, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(key || req, res.clone());
  return res;
}

async function shell(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req).then((res) => {
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  if (hit) return hit;
  const res = await net;
  if (res) return res;
  if (req.mode === 'navigate') return cache.match('index.html');
  return new Response('', { status: 504 });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'server.arcgisonline.com') {
    e.respondWith(cacheFirst(TILES, req).catch(() => new Response('', { status: 504 })));
    return;
  }
  if (url.hostname === 'upload.wikimedia.org') {
    e.respondWith(cacheFirst(PHOTOS, req).catch(() => new Response('', { status: 504 })));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(shell(req));
  }
});
