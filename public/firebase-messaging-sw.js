// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDZ_HmXkKWPGBzSs2ZO3thb3GyBnQKGJyA",
  authDomain: "p2p-dex-ramp.firebaseapp.com",
  projectId: "p2p-dex-ramp",
  storageBucket: "p2p-dex-ramp.firebasestorage.app",
  messagingSenderId: "641517280810",
  appId: "1:641517280810:web:b8e7091cf8a27902b82d53"
});

// Log service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase messaging service worker installed');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Firebase messaging service worker activated');
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

const messaging = firebase.messaging();

// Log service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase messaging service worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Firebase messaging service worker activated');
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'You have a new notification',
    icon: '/RampzLogo.png',
    badge: '/RampzLogo.png',
    tag: 'p2p-notification',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes('/dapp') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          const url = event.notification.data?.link || '/dapp';
          return clients.openWindow(url);
        }
      })
    );
  }
}); 