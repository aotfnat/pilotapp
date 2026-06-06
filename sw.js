const CACHE = 'pilotwx-v2.1';

// Derive the correct path to index.html relative to wherever sw.js is deployed.
// e.g. if sw.js is at https://example.com/pilotapp/sw.js,
// SW_BASE will be 'https://example.com/pilotapp/' and SHELL will be that URL.
const SW_BASE = self.location.href.replace(/sw\.js.*$/, '');
const SHELL   = [SW_BASE + 'index.html'];

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

// Allow the settings "Reload & Apply Update" button to trigger activation
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isApi = url.hostname.includes('corsproxy.io') ||
                url.hostname.includes('aviationweather') ||
                url.hostname.includes('datis') ||
                url.hostname.includes('workers.dev');

  if (isApi) {
    // Network first, cache as fallback
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

  // App shell: cache first, fall back to index.html for navigation requests
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }))
      .catch(() => caches.match(SW_BASE + 'index.html'))
  );
});
