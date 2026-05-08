const CACHE_NAME = 'annai-kitchen-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Install: Cache essential assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Force update
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Fetch: Network-First Strategy
// This ensures the latest updates are fetched from GitHub/Supabase first
self.addEventListener('fetch', event => {
  // Bypass cache for external APIs (like Supabase)
  if (event.request.url.includes('supabase.co')) {
    return; 
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update cache with fresh version
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
        return response;
      })
      .catch(() => caches.match(event.request)) // Fallback to cache if offline
  );
});
