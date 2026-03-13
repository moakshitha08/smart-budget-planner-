// SMART BUDGET PLANNER - SERVICE WORKER
const CACHE_NAME = 'smart-budget-v1';
const CACHE_ENABLED = false;

const urlsToCache = [
    './',
    './index.html',
    './login.html',
    './signup.html',
    './dashboard.html',
    './css/style.css',
    './js/utils.js',
    './js/dashboard.js',
    './js/auth.js',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(function(err) {
                console.log('Cache install failed:', err);
            })
    );
    self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', function(event) {
    if (!CACHE_ENABLED) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Activate event
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys()
            .then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
    self.clients.claim();
});

