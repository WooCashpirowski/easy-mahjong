const CACHE_VERSION = 'mahjong-shell-v1';
const CACHE_PREFIX = `mahjong:${new URL(self.registration.scope).pathname}:`;
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const APP_FILES = [
  './',
  './index.html',
  './styles.css',
  './favicon.svg',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './src/main.js',
  './src/domain/layout.js',
  './src/domain/tiles.js',
  './src/domain/deal.js',
  './src/domain/game.js',
  './src/storage/best-times.js',
  './src/ui/board-view.js',
  './src/ui/tile-art.js',
  './src/ui/format.js',
  './src/ui/ranking-view.js',
  './src/ui/pwa-view.js',
  './src/pwa/installation.js',
];
const appUrls = new Set(APP_FILES.map(path => new URL(path, self.registration.scope).href));
const homeUrl = new URL('./', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  if (!appUrls.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request.mode === 'navigate' ? homeUrl : url.href);
    return cached || fetch(event.request);
  })());
});
