const VERSION = 'v1'
const STATIC_CACHE = `tekstil-static-${VERSION}`
const PAGE_CACHE = `tekstil-sayfa-${VERSION}`
const OFFLINE_URL = '/offline.html'

const STATIK_YOL = /^\/_next\/static\//
const API_YOLU = /^\/api\//
const IKON_YOLU = /^\/icons\//

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.all(
          ['/manifest.webmanifest', '/icons/icon-192.png', OFFLINE_URL].map((url) =>
            cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined)
          )
        )
      )
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE && k !== PAGE_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (API_YOLU.test(url.pathname)) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const kopya = res.clone()
          caches.open(PAGE_CACHE).then((c) => c.put(req, kopya))
          return res
        })
        .catch(async () => {
          return (
            (await caches.match(req)) ||
            (await caches.match('/')) ||
            (await caches.match(OFFLINE_URL)) ||
            Response.error()
          )
        })
    )
    return
  }

  if (!STATICIK_YOL.test(url.pathname) && !IKON_YOLU.test(url.pathname)) return

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit
      return fetch(req).then((res) => {
        const kopya = res.clone()
        caches.open(STATIC_CACHE).then((c) => c.put(req, kopya))
        return res
      })
    })
  )
})
