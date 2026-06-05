const CACHE = 'pilotwx-v2';
const SHELL = ['/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isApi = url.hostname.includes('corsproxy.io') ||
                url.hostname.includes('aviationweather') ||
                url.hostname.includes('datis') ||
                (url.hostname.includes('workers.dev'));

  if (isApi) {
    // Network first, fall back to cache — never let a fetch error crash the SW
    e.respondWith(
      fetch(e.request.clone())
        .then(resp => {
          if (resp && resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request).then(cached => cached || Response.error()))
    );
    return;
  }

  // App shell: cache first
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }))
      .catch(() => caches.match('/index.html'))
  );
});
