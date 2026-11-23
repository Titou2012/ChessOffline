const CACHE_NAME = "chess-offline-v3";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/index-CqnNrK8B.css",
  "./assets/index-sx-iLY40.js",
  "./engine/stockfish-19-lite-single.js",
  "./engine/stockfish-19-lite-single.wasm"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response.ok) return response;

        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy);
        });

        return response;
      }).catch(() =>
        new Response("Indisponible hors connexion", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        })
      );
    })
  );
});
