const CACHE = "debt-shell-v3"
const SHELL = ["/offline", "/icons/icon-192.png", "/icons/icon-512.png"]
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        await cache.addAll(SHELL)
        // Precache the offline page's own bundles, even if it has never been visited.
        const offline = await cache.match("/offline")
        const html = await offline.text()
        const assets = [...html.matchAll(/(?:src|href)="([^" ]+)"/g)]
          .map(
            (match) =>
              new URL(match[1].replaceAll("&amp;", "&"), self.location.origin)
          )
          .filter(
            (url) =>
              url.origin === self.location.origin &&
              url.pathname.startsWith("/_next/static/")
          )
          .map((url) => url.href)
        await cache.addAll([...new Set(assets)])
      })
      .then(() => self.skipWaiting())
  )
})
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("debt-shell-") && key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  )
    return
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if ([502, 503, 504].includes(response.status)) {
            const cache = await caches.open(CACHE)
            return (await cache.match("/offline")) || response
          }
          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE)
          return (await cache.match("/offline")) || Response.error()
        })
    )
    return
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        const response = await fetch(event.request)
        if (response.ok) await cache.put(event.request, response.clone())
        return response
      })
    )
  }
})
