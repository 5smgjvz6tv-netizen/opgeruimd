// De build vult de lijst met de gehashte bestanden van deze release.
const shell = /* SHELL_FILES */ []
const cacheName = 'opgeruimd-shell-' + (shell.find(path => path.endsWith('.js')) || 'dev')
self.addEventListener('install', event => event.waitUntil((async () => {
  if (shell.length) await (await caches.open(cacheName)).addAll(shell)
  await self.skipWaiting()
})()))
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('opgeruimd-shell-') && key !== cacheName) await caches.delete(key)
  await self.clients.claim()
})()))
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (!shell.length || event.request.method !== 'GET' || url.origin !== self.location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(new URL('index.html', self.registration.scope))))
  } else if (shell.some(path => new URL(path, self.registration.scope).href === url.href)) {
    event.respondWith(caches.match(event.request, { ignoreVary: true }).then(hit => hit || fetch(event.request)))
  }
})

self.addEventListener('push', (e) => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch { d = { body: e.data?.text() } }
  const title = d.tag === 'reminder' ? 'Bas · ' + (d.title || 'Opgeruimd') : d.title || 'Opgeruimd'
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    tag: d.tag,
    icon: 'bas-rubber-192.png',
    badge: 'bas-rubber-badge.png',
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
