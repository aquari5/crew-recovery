// Offline support. The network is used when it answers, so a new version shows
// up at once; when it does not, the copy saved on this device is served. After
// one visit the whole app, including its entries, works with no link at all.
const CACHE = 'crew-recovery-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// The page lists what it loaded before this worker took control, so those files are saved too.
self.addEventListener('message', (event) => {
  const urls = event.data?.cache
  if (!Array.isArray(urls)) return
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(urls.map((url) => cache.add(url).catch(() => undefined)))),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Partial (range) answers cannot be stored; everything else that succeeded is.
        if (response.status === 200) {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(async () => {
        // ignoreVary: the saved copy may have been fetched with different request headers than this one.
        const saved = (await caches.match(request, { ignoreVary: true })) ?? (await caches.match(request, { ignoreVary: true, ignoreSearch: true }))
        if (saved) return saved
        if (request.mode === 'navigate') return (await caches.match('./', { ignoreVary: true })) ?? Response.error()
        return Response.error()
      }),
  )
})
