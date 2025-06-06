const CACHE_VERSION = 'v4';
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  dynamic: `dynamic-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`
};

const STATIC_ASSETS = [
  '/',
  '/weather-icon.svg',
  '/manifest.json'
  // Only add other assets if they exist
];

// Cache expiration times
const CACHE_EXPIRATION = {
  api: 5 * 60 * 1000, // 5 minutes for API calls
  static: 24 * 60 * 60 * 1000, // 24 hours for static assets
  fonts: 7 * 24 * 60 * 60 * 1000 // 7 days for fonts
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then(cache => {
        // Cache assets individually to avoid failing entire operation
        return Promise.allSettled(
          STATIC_ASSETS.map(asset => 
            cache.add(asset).catch(error => {
              console.warn(`Failed to cache ${asset}:`, error);
              return null;
            })
          )
        );
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('Service worker installation failed:', error);
      })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests except for allowed domains
  if (!url.href.startsWith(self.location.origin) && 
      !url.href.includes('fonts.googleapis.com') &&
      !url.href.includes('fonts.gstatic.com') &&
      !url.href.includes('api.kairos.gr')) {
    return;
  }

  // Network-first strategy for API calls with cache fallback
  if (url.href.includes('api.kairos.gr')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAMES.api).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            // Return cached data but mark as stale
            return new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: new Headers({
                ...cachedResponse.headers,
                'X-From-Cache': 'true'
              })
            });
          }
          // Return offline fallback
          return new Response(
            JSON.stringify({ error: 'Offline' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          // Return cached version and update cache in background
          if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
            fetch(request).then(networkResponse => {
              caches.open(CACHE_NAMES.static).then(cache => {
                cache.put(request, networkResponse);
              });
            });
          }
          return response;
        }

        return fetch(request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          const cacheName = url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)
            ? CACHE_NAMES.static
            : CACHE_NAMES.dynamic;
          caches.open(cacheName)
            .then(cache => {
              cache.put(request, responseToCache);
            });

          return response;
        });
      })
      .catch(error => {
        console.error('Fetch error:', error);
      })
  );
});

self.addEventListener('activate', event => {
  const currentCaches = Object.values(CACHE_NAMES);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Message handler for cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});