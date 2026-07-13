const CACHE_VERSION = "2026-07-12-v7";
const PREFIX = `cc-v${CACHE_VERSION}-`;

const PRECACHE = `${PREFIX}precache`;
const STATIC = `${PREFIX}static`; // Immutable Next.js chunks
const IMAGES = `${PREFIX}images`; // /api/images & /_next/image
const HTML = `${PREFIX}html`; // HTML navigations
const API = `${PREFIX}api`; // Public read APIs

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

const CACHEABLE_PAGES = new Set([
  "/",
  "/about",
  "/contact",
  "/faq",
  "/feed",
  "/deals",
  "/shops",
  "/search",
  "/privacy",
  "/refund-policy",
  "/terms",
  "/offline",
]);

const PUBLIC_API_ROUTES = new Set([
  "/api/shops/all",
  "/api/shops/brand",
  "/api/shops/category",
  "/api/search/brands",
  "/api/search/product",
  "/api/search/products",
]);

function isPublicReadApi(pathname) {
  if (PUBLIC_API_ROUTES.has(pathname)) return true;
  if (
    pathname === "/api/products" ||
    (pathname.startsWith("/api/products/") && !pathname.includes("stock-watch"))
  )
    return true;
  return false;
}

// INSTALL & ACTIVATE
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then(async (cache) => {
        const results = await Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache.add(new Request(url, { cache: "reload" }))
          )
        );

        const offlineIndex = PRECACHE_URLS.indexOf("/offline");
        if (
          offlineIndex !== -1 &&
          results[offlineIndex].status === "rejected"
        ) {
          throw new Error(
            "Critical precache failed: /offline route could not be cached."
          );
        }

        const successCount = results.filter(
          (r) => r.status === "fulfilled"
        ).length;
        if (successCount === 0) {
          throw new Error("Precache failed completely. No assets were cached.");
        }
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("cc-") && !k.startsWith(PREFIX))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => {
        if ("navigationPreload" in self.registration) {
          return self.registration.navigationPreload.enable();
        }
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// FETCH ROUTER

const ROUTES = [
  {
    match: ({ url }) => url.pathname.startsWith("/_next/static/"),
    strategy: (req, evt) => cacheFirst(req, evt, STATIC),
  },
  {
    match: ({ url }) => url.pathname.startsWith("/_next/webpack-hmr"),
    strategy: () => null,
  },
  {
    match: ({ url }) =>
      url.pathname === "/_next/image" ||
      url.pathname.startsWith("/api/images/"),
    strategy: (req, evt) => cacheFirstWithLimit(req, evt, IMAGES, 500),
  },
  {
    match: ({ url }) =>
      url.pathname.startsWith("/api/") && isPublicReadApi(url.pathname),
    strategy: (req, evt) => staleWhileRevalidate(req, evt, API, 200),
  },
  {
    match: ({ url }) => url.pathname.startsWith("/api/"),
    strategy: (req) => fetch(req),
  },
  {
    match: ({ request }) => request.mode === "navigate",
    strategy: (req, evt, { url }) => {
      const isPublicHTML =
        CACHEABLE_PAGES.has(url.pathname) ||
        url.pathname.startsWith("/product/") ||
        url.pathname.startsWith("/shops/");
      if (isPublicHTML)
        return networkFirstNavigation(req, evt, HTML, "/offline", 50);
      return networkOnlyWithOfflineFallback(req, evt, "/offline");
    },
  },
];

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (request.headers.has("range")) return;
  if (request.destination === "video" || request.destination === "audio")
    return;
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (url.searchParams.has("_rsc") || url.searchParams.has("__flight__"))
    return;

  if (url.origin !== self.location.origin) return;

  for (const route of ROUTES) {
    if (route.match({ url, request })) {
      const responsePromise = route.strategy(request, event, { url });
      if (responsePromise) {
        event.respondWith(responsePromise);
        return;
      }
    }
  }

  event.respondWith(fetch(request));
});

// CACHING STRATEGIES

function isCacheable(response) {
  if (response.status !== 200) return false;
  if (!["basic", "default"].includes(response.type)) return false;

  const cc = response.headers.get("Cache-Control");
  if (cc && (cc.includes("no-store") || cc.includes("private"))) return false;

  return true;
}

function safePutAndTrim(event, cacheName, request, response, maxItems) {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(cacheName);
        await cache.put(request, response.clone());
        if (maxItems) {
          await enforceCacheLimit(cacheName, maxItems);
        }
      } catch {}
    })()
  );
}

async function cacheFirst(request, event, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    safePutAndTrim(event, cacheName, request, response);
  }
  return response;
}

async function cacheFirstWithLimit(request, event, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    safePutAndTrim(event, cacheName, request, response, maxItems);
  }
  return response;
}

async function staleWhileRevalidate(request, event, cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (isCacheable(response)) {
        safePutAndTrim(event, cacheName, request, response, maxItems);
      }
      return response;
    })
    .catch(() => cached);

  return cached || networkFetch;
}

async function networkFirstNavigation(
  request,
  event,
  cacheName,
  fallbackUrl,
  maxItems
) {
  const cache = await caches.open(cacheName);

  try {
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) {
      if (isCacheable(preloadResponse)) {
        safePutAndTrim(event, cacheName, request, preloadResponse, maxItems);
      }
      return preloadResponse;
    }
  } catch {}

  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      safePutAndTrim(event, cacheName, request, response, maxItems);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    const precache = await caches.open(PRECACHE);
    return (await precache.match(fallbackUrl)) || Response.error();
  }
}

async function networkOnlyWithOfflineFallback(request, event, fallbackUrl) {
  try {
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) {
      return preloadResponse;
    }
  } catch {}

  try {
    return await fetch(request);
  } catch {
    const precache = await caches.open(PRECACHE);
    return (await precache.match(fallbackUrl)) || Response.error();
  }
}

async function enforceCacheLimit(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
  }
}

// Push notifications and background sync
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || "Campus Connect", {
        body: data.message || "You have a new notification.",
        icon: "/android-chrome-192x192.png",
        data: { url: data.action_url || "/" },
      })
    );
  } catch {}
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = new URL(
    event.notification.data?.url || "/",
    self.location.origin
  ).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
