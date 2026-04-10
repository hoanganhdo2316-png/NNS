// NNS Service Worker — Cache Strategy
const CACHE_NAME = 'nns-v10'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// ── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[NNS SW] Installing v10...')
  self.skipWaiting()
})

// ── Activate: xóa TOÀN BỘ cache cũ ─────────────────────
self.addEventListener('activate', (event) => {
  console.log('[NNS SW] Activating, clearing all old caches...')
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => {
        console.log('[NNS SW] Deleting cache:', key)
        return caches.delete(key)
      })))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting()
})

// ── Fetch strategy ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (!request.url.startsWith('http')) return

  // API calls → luôn network, không cache
  if (url.hostname === 'api.nns.id.vn') {
    if (request.method !== 'GET') {
      event.respondWith(fetch(request))
      return
    }
    event.respondWith(fetch(request).catch(() =>
      new Response(JSON.stringify({ error: 'offline' }), { status: 503 })
    ))
    return
  }

  // JS/CSS/Font → luôn network (không cache để tránh stale)
  if (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'font') {
    event.respondWith(fetch(request))
    return
  }

  // Ảnh → cache first
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request))
    return
  }

  // Zalo callback
  if (url.pathname.startsWith('/auth/zalo')) {
    event.respondWith(fetch(request))
    return
  }

  // Navigate → network first, fallback index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(res => res || offlinePage())
      )
    )
    return
  }

  // Default → network
  event.respondWith(fetch(request))
})

// ── Helper: Cache first (chỉ dùng cho ảnh) ──────────────
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
    return new Response('Offline', { status: 503 })
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
    data: { url: data.url || '/agent' }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data.url))
})
