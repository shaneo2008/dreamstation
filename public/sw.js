// Dreamstation Service Worker
const CACHE_NAME = 'dreamstation-v1';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
// IMPORTANT: Skip external API calls entirely (n8n, Supabase, S3, etc.)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ── Don't intercept external API requests ──
  // These need to pass straight through to avoid CORS issues
  if (
    url.origin !== self.location.origin ||          // any cross-origin request
    url.pathname.startsWith('/api') ||               // local API routes
    event.request.method !== 'GET'                   // POST/PUT/DELETE etc.
  ) {
    // Let the browser handle it natively — do NOT call event.respondWith()
    return;
  }

  // ── Only cache same-origin GET requests ──
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful GET responses
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
