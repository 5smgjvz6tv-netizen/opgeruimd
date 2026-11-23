// Opgeruimd service worker: alleen pushmeldingen.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch { d = { body: e.data?.text() } }
  const title = d.tag === 'reminder' ? 'Bas · ' + (d.title || 'Opgeruimd') : d.title || 'Opgeruimd'
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    tag: d.tag,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: d.url || './' },
  }))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of list) if ('focus' in c) return c.focus()
    return self.clients.openWindow(e.notification.data?.url || './')
  })())
})
