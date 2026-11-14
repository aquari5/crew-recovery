// Registers the service worker that keeps the app usable with no network.
// Only in the built app: in development it would get in the way of live reload.

export function enableOffline() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./sw.js')
      const registration = await navigator.serviceWorker.ready
      // Files fetched before the worker took control would otherwise be missing from its store.
      const loaded = performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.startsWith(location.origin))
      registration.active?.postMessage({ cache: [location.href, ...loaded, new URL('./tour.mp4', location.href).href, new URL('./manifest.webmanifest', location.href).href] })
    } catch {
      /* No offline support in this browser or context: the app still works online. */
    }
  })
}
