// Service Worker for LoanPulse — Smart EMI Tracker & Reminders
const CACHE_NAME = 'loanpulse-v26';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './style.css?v=26',
  './app.js',
  './app.js?v=26',
  './manifest.json',
  './assets/hero.jpg',
  './assets/app-icon.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('LoanPulse caching partial assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Network-First Strategy for Code (HTML, JS, CSS) to prevent stale cache lockup,
// Cache-First for static media (images, fonts)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isCodeAsset = url.pathname.endsWith('.html') ||
                      url.pathname.endsWith('.js') ||
                      url.pathname.endsWith('.css') ||
                      url.pathname === '/' ||
                      url.pathname.endsWith('/');

  if (isCodeAsset) {
    // Network-First with Cache Fallback for code assets
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html', { ignoreSearch: true });
            }
            return caches.match('./app.js', { ignoreSearch: true });
          });
        })
    );
  } else {
    // Cache-First for static media (images, icons)
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});

// PostMessage listener to trigger notifications reliably from page on mobile & desktop
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SHOW_NOTIFICATION' || event.data.type === 'TEST_REMINDER')) {
    const title = event.data.title || '🔔 LoanPulse EMI Reminder';
    const options = {
      body: event.data.body || 'Automated alerts are working! We will remind you 3 days before your EMI date.',
      icon: 'assets/app-icon.jpg',
      badge: 'assets/app-icon.jpg',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'loanpulse-emi-alert-' + Date.now(),
      renotify: true,
      data: {
        url: './index.html'
      }
    };
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Push notification listener
self.addEventListener('push', (event) => {
  let data = {
    title: '🔔 LoanPulse EMI Reminder',
    body: 'You have an EMI due soon. Tap to view details and avoid penalty.'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'assets/app-icon.jpg',
    badge: 'assets/app-icon.jpg',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'loanpulse-emi-alert',
    renotify: true,
    data: {
      url: './index.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});
