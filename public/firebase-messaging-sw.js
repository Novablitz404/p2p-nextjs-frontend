// Service Worker for VAPID Push Notifications
// Based on Chrome documentation: https://developer.chrome.com/blog/web-push-interop-wins

console.log('Service Worker loaded successfully');

// Install event - take control immediately
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  let options = {
    body: 'You have a new notification',
    icon: '/RampzLogo.png',
    badge: '/RampzLogo.png',
    tag: 'default',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('Push data:', data);
      
      options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/RampzLogo.png',
        badge: data.badge || '/RampzLogo.png',
        tag: data.tag || 'default',
        data: data.data || {},
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || [200, 100, 200],
        timestamp: data.timestamp || Date.now(),
        image: data.image,
        dir: data.dir || 'auto',
        lang: data.lang || 'en',
        renotify: data.renotify || false
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data?.title || 'Rampz Notification', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action) {
    console.log('Action clicked:', event.action);
    // Handle specific actions
    switch (event.action) {
      case 'view':
        // Open the main app
        event.waitUntil(
          clients.openWindow('/')
        );
        break;
      case 'dismiss':
        // Just close the notification
        break;
      default:
        // Handle custom actions
        if (event.notification.data && event.notification.data.url) {
          event.waitUntil(
            clients.openWindow(event.notification.data.url)
          );
        }
    }
  } else {
    // Default behavior: open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Notification close handler
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});

// Background sync handler
self.addEventListener('sync', function(event) {
  console.log('Background sync:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync
      console.log('Background sync triggered')
    );
  }
});

// Push subscription change handler
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('Push subscription changed:', event);
  
  event.waitUntil(
    // Get the VAPID public key from the environment
    fetch('/api/getVapidKey')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to get VAPID key');
        }
        return response.text();
      })
      .then(vapidKey => {
        // Convert VAPID key to Uint8Array
        const urlBase64ToUint8Array = (base64String) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);

          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        return self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        });
      })
      .then(function(subscription) {
        console.log('Re-subscribed to push notifications:', subscription);
        // Send the new subscription to your server
        return fetch('/api/updateSubscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription)
        });
      })
      .catch(function(error) {
        console.error('Failed to re-subscribe:', error);
      })
  );
}); 