const CACHE = 'not-defterim-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;
  if (request.url.includes('/@vite') || request.url.includes('/src/')) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      if (cached) {
        fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
          })
          .catch(() => {});
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        const fallback = await cache.match('/index.html');
        return (
          fallback ||
          new Response('<h1>Çevrimdışı</h1><p>Bağlantı yok.</p>', {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          })
        );
      }
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/');
    }),
  );
});
