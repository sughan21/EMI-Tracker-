// Service Worker for LoanPulse — Smart EMI Tracker & Reminders
const CACHE_NAME = 'loanpulse-v14';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './assets/hero.jpg',
  './assets/app-icon.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Caching partial assets:', err);
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

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
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
