// =============================================================================
// Campus Connect — Service Worker (hand-crafted, zero dependencies)
// =============================================================================

const CACHE_VERSION = 1;
const PREFIX = `cc-v${CACHE_VERSION}-`;

// ---------------------------------------------------------------------------
// Cache bucket names
// ---------------------------------------------------------------------------
const PRECACHE = `${PREFIX}precache`; // Shell assets installed upfront
const STATIC = `${PREFIX}static`; // /_next/static/* (immutable, hashed)
const IMAGES = `${PREFIX}images`; // /api/images/* (product photos etc.)
const PAGES = `${PREFIX}pages`; // HTML navigation responses
const FONTS = `${PREFIX}fonts`; // Google Fonts CSS + font files

const ALL_CACHES = [PRECACHE, STATIC, IMAGES, PAGES, FONTS];

// ---------------------------------------------------------------------------
// Precache list — critical shell assets cached during install
// ---------------------------------------------------------------------------
const PRECACHE_URLS = [
  "/offline",
  "/manifest.json",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

// =============================================================================
// INSTALL — precache shell assets & skip waiting for immediate activation
// =============================================================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// =============================================================================
// ACTIVATE — purge old-version caches & claim all open clients immediately
// =============================================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("cc-") && !key.startsWith(PREFIX))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// =============================================================================
// FETCH — route requests to the appropriate caching strategy
// =============================================================================
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ---- 1. /_next/static/* → Cache-first (immutable hashed bundles) ---------
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }

  // ---- 2. /api/images/* → Cache-first, 30-day expiry, max 100 entries ------
  if (url.pathname.startsWith("/api/images/")) {
    event.respondWith(cacheFirstWithExpiry(request, IMAGES, 30, 100));
    return;
  }

  // ---- 3. /api/* (except /api/images/) → Network-only (never cache) --------
  //      Server actions, auth endpoints, mutations — must always hit origin.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkOnly(request));
    return;
  }

  // ---- 4. Google Fonts → Cache-first, 1-year expiry -----------------------
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirstWithExpiry(request, FONTS, 365));
    return;
  }

  // ---- 5. Navigation (HTML pages) → Network-first, /offline fallback -------
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // ---- 6. Everything else → Stale-while-revalidate ------------------------
  event.respondWith(staleWhileRevalidate(request, STATIC));
});

// =============================================================================
// MESSAGE — allow the registration component to trigger skipWaiting
// =============================================================================
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// =============================================================================
// Caching strategy helpers
// =============================================================================

/**
 * Cache-first: return from cache if available, otherwise fetch & cache.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Cache-first with time-based expiry.
 * Stores a timestamp header so we can check freshness on subsequent hits.
 * @param {Request}  request
 * @param {string}   cacheName
 * @param {number}   maxAgeDays  — maximum age in days before re-fetching
 * @param {number}   [maxItems]  — optional cap on number of entries
 */
async function cacheFirstWithExpiry(request, cacheName, maxAgeDays, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get("sw-cached-at");
    if (dateHeader) {
      const age = (Date.now() - Number(dateHeader)) / 1000 / 60 / 60 / 24;
      if (age < maxAgeDays) return cached;
    }
  }

  // Cache miss or expired — fetch from network
  const response = await fetch(request);
  if (response.ok) {
    // Clone and stamp with a cache-time header so we can check expiry later
    const headers = new Headers(response.headers);
    headers.set("sw-cached-at", String(Date.now()));
    const stamped = new Response(await response.clone().blob(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    cache.put(request, stamped);

    // Enforce entry limit if specified
    if (maxItems) {
      trimCache(cacheName, maxItems);
    }
  }
  return response;
}

/**
 * Network-only: always go to network, never cache. Used for API mutations.
 */
async function networkOnly(request) {
  return fetch(request);
}

/**
 * Network-first for navigation requests.
 * Falls back to cached page, then ultimately to the /offline shell.
 */
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Network failed — try cache, then offline page
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/offline");
  }
}

/**
 * Stale-while-revalidate: return cache immediately, update in background.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fire-and-forget network update
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached); // swallow network errors if we have a cached copy

  // Return cached version immediately if available, otherwise wait for network
  return cached || networkFetch;
}

// =============================================================================
// Cache cleanup helper
// =============================================================================

/**
 * Evict the oldest entries when a cache exceeds the given limit.
 * @param {string} cacheName
 * @param {number} maxItems
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Delete from the front (oldest first) until we're within budget
    await Promise.all(
      keys.slice(0, keys.length - maxItems).map((key) => cache.delete(key))
    );
  }
}
