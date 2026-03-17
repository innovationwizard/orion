/// Service Worker for /reservar PWA
const CACHE_NAME = "reservar-v3";

const PRECACHE_URLS = ["/reservar", "/ventas/portal"];

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigation + API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST submissions handled by offline queue)
  if (request.method !== "GET") return;

  // Skip API routes — let them fail naturally so the offline queue kicks in
  if (url.pathname.startsWith("/api/")) return;

  // Navigation requests (HTML pages): network-first with cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets (JS, CSS, images): stale-while-revalidate
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }
});
