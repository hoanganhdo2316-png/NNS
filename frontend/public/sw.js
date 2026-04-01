// NNS Service Worker — Cache Strategy
const CACHE_NAME = 'nns-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// ── Install: cache static assets ─────────────────────────
self.addEventListener('install', (event) => {
  console.log('[NNS SW] Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Icon chưa có thì bỏ qua, không fail cả SW
        console.warn('[NNS SW] Some assets failed to cache:', err)
      })
    })
  )
  self.skipWaiting()
})

// ── Activate: xóa cache cũ ───────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[NNS SW] Activating...')
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[NNS SW] Deleting old cache:', key)
            return caches.delete(key)
          })
      )
    )
  )
  self.clients.claim()
})

// ── Fetch strategy ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Bỏ qua Chrome extension và non-http
  if (!request.url.startsWith('http')) return

  // API calls → Network first, fallback offline message
  if (url.hostname === 'api.nns.id.vn') {
    event.respondWith(networkFirst(request))
    return
  }

  // Static assets → Cache first
  if (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image' ||
      request.destination === 'font') {
    event.respondWith(cacheFirst(request))
    return
  }

  // Navigate (page load) → Network first, fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(res => res || offlinePage())
      )
    )
    return
  }

  // Default → Network first
  event.respondWith(networkFirst(request))
})

// ── Helper: Cache first ───────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Không có kết nối', { status: 503 })
  }
}

// ── Helper: Network first ─────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response(
      JSON.stringify({ error: 'offline', message: 'Không có kết nối internet' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// ── Helper: Offline fallback page ────────────────────────
function offlinePage() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>NNS — Offline</title>
      <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center;
               min-height: 100vh; margin: 0; background: #f2f7f2; color: #1a2e1a; text-align: center; }
        .box { padding: 40px 24px; }
        .icon { font-size: 56px; margin-bottom: 16px; }
        h1 { font-size: 22px; margin-bottom: 8px; }
        p { color: #4a6e4a; font-size: 14px; }
        button { margin-top: 20px; padding: 12px 24px; background: #2e7d32; color: white;
                 border: none; border-radius: 10px; font-size: 15px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="icon">☕</div>
        <h1>Đang offline</h1>
        <p>Kiểm tra kết nối internet và thử lại.</p>
        <button onclick="location.reload()">↻ Thử lại</button>
      </div>
    </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}

// ── Web Push Event ────────────────────────────────────────
self.addEventListener('push', function(event) {
  let data = {}
  try {
    data = event.data.json()
  } catch(e) {
    data = { title: 'NNS Đại lý', body: event.data ? event.data.text() : 'Bạn có thông báo mới' }
  }

  const title = data.title || 'NNS Đại lý'
  const options = {
    body: data.body || data.message || '',
    icon: '/icon-agent-192.png',
    badge: '/icon-agent-192.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    sound: '/notification.mp3',
    data: { url: data.url || '/agent' }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
