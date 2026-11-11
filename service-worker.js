
const CACHE = 'chess-offline-v1';

const ENGINE = [
  './engine/stockfish-19-lite-single.js',
  './engine/stockfish-19-lite-single.wasm'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const root = new URL('./', self.registration.scope);

    const response = await fetch(root);
    if (!response.ok) throw new Error('Chargement impossible');

    const html = await response.clone().text();
    await cache.put(root, response);

    const assets = [
      ...html.matchAll(/(?:src|href)="([^"]+)"/g)
    ]
      .map(match => new URL(match[1], root))
      .filter(url => url.origin === self.location.origin)
      .map(url => url.href);

    await cache.addAll([
      ...new Set([
        ...assets,
        ...ENGINE.map(path => new URL(path, root).href)
      ])
    ]);

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (
    request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin
  ) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);

    if (cached) return cached;

    try {
      const response = await fetch(request);

      if (response.ok) {
        await cache.put(request, response.clone());
      }

      return response;
    } catch {
      return new Response('Indisponible hors connexion', {
        status: 503
      });
    }
  })());
});
