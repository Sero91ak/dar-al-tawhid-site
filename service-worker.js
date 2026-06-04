const CACHE_NAME = "dar-al-tawhid-pwa-share-v1";
const FILES_TO_CACHE = [
  "./",
  "index.html",
  "posts.json",
  "manifest.json",
  "service-worker.js",
  "app-icon-192.png",
  "app-icon-512.png",
  "apple-touch-icon.png",
  "favicon-32.png",
  "favicon-16.png",
  "app-share-image.png",
  "logo-black.png",
  "logo-blue.png",
  "logo-cream.jpg"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE).catch(() => null))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match("index.html")))
  );
});
