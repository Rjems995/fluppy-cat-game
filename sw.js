/**
 * Pluffy Bird — Service Worker
 * Caches all game assets for offline play and fast launches.
 */

const CACHE_NAME = "pluffy-bird-v1";

// All game assets to pre-cache on install
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./src/audio.js",
  "./src/particles.js",
  "./src/cat.js",
  "./src/collectibles.js",
  "./src/obstacles.js",
  "./src/game.js",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  // Fonts are loaded from Google Fonts — cache them on first fetch
];

// ── Install: pre-cache all local assets ────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ── Activate: clean up old caches ──────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// ── Fetch: Cache-first for game assets, Network-first for fonts ────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always try network first for Google Fonts (external CDN)
  if (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  // Cache-first for all local game assets
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          // Dynamically cache any new local asset not in the precache list
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
          }
          return response;
        }),
    ),
  );
});
