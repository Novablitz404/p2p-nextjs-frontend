// Utility to test VAPID key configuration using pure VAPID (not Firebase FCM)
export const testVapidKey = async () => {
  try {
    console.log('Testing VAPID key configuration...');
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }
    
    // Check if service worker is available
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }
    
    // Check notification permission
    if (Notification.permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }
    
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    console.log('VAPID Key present:', !!vapidKey);
    console.log('VAPID Key length:', vapidKey?.length);
    console.log('VAPID Key starts with:', vapidKey?.substring(0, 10));
    
    if (!vapidKey) {
      throw new Error('VAPID key not found');
    }
    
    // Validate VAPID key format
    if (!vapidKey.startsWith('B')) {
      throw new Error('VAPID key should start with "B"');
    }
    
    if (vapidKey.length < 80) {
      throw new Error('VAPID key seems too short');
    }
    
    // Check if service worker is registered and controlling
    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      throw new Error('Service worker not registered');
    }
    
    if (!registration.active) {
      throw new Error('Service worker not active');
    }
    
    if (!navigator.serviceWorker.controller) {
      throw new Error('Service worker not controlling the page');
    }
    
    console.log('Service worker status:', {
      registered: !!registration,
      active: !!registration.active,
      controller: !!navigator.serviceWorker.controller
    });
    
    // Convert VAPID public key to Uint8Array
    const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
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
    
    // Test VAPID subscription (not Firebase FCM)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });
    
    console.log('VAPID subscription obtained successfully:', !!subscription);
    console.log('Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
    console.log('Subscription keys:', Object.keys(subscription.toJSON()));
    
    return { 
      success: true, 
      token: subscription.endpoint.substring(0, 20) + '...',
      details: {
        vapidKeyLength: vapidKey.length,
        subscriptionEndpoint: subscription.endpoint.substring(0, 50) + '...',
        serviceWorkerActive: !!registration.active,
        serviceWorkerController: !!navigator.serviceWorker.controller,
        subscriptionKeys: Object.keys(subscription.toJSON())
      }
    };
  } catch (error) {
    console.error('VAPID key test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined
      }
    };
  }
}; 