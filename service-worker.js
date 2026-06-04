const CACHE_NAME = "dar-al-tawhid-all-in-one-v6";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Diese Dateien immer frisch vom Netz laden
  if (
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/posts.json") ||
    url.pathname.endsWith("/") ||
    url.search.includes("v=")
  ) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
