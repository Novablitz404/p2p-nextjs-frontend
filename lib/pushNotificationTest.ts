export const runComprehensivePushTest = async () => {
  const results: any = {
    step: 1,
    totalSteps: 5,
    success: false,
    errors: [],
    details: {}
  };

  try {
    // Step 1: Check VAPID public key
    results.step = 1;
    results.details.step1 = 'Checking VAPID public key...';
    
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID key not found in environment variables');
    }

    if (!vapidKey.startsWith('B')) {
      throw new Error('VAPID key format incorrect (should start with B)');
    }

    results.details.vapidKeyPresent = true;
    results.details.vapidKeyLength = vapidKey.length;
    results.details.vapidKeyPreview = vapidKey.substring(0, 20) + '...';

    // Step 2: Check service worker support
    results.step = 2;
    results.details.step2 = 'Checking service worker support...';
    
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    if (!('PushManager' in window)) {
      throw new Error('Push Manager not supported');
    }

    results.details.serviceWorkerSupported = true;
    results.details.pushManagerSupported = true;

    // Step 3: Check notification permission
    results.step = 3;
    results.details.step3 = 'Checking notification permission...';
    
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = Notification.permission;
    results.details.notificationPermission = permission;

    if (permission === 'denied') {
      throw new Error('Notification permission denied');
    }

    if (permission === 'default') {
      // Request permission
      const newPermission = await Notification.requestPermission();
      results.details.newPermission = newPermission;
      
      if (newPermission === 'denied') {
        throw new Error('Notification permission denied after request');
      }
    }

    // Step 4: Register service worker
    results.step = 4;
    results.details.step4 = 'Registering service worker...';
    
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    results.details.serviceWorkerRegistered = true;
    results.details.serviceWorkerState = registration.active?.state || 'unknown';

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Step 5: Subscribe to push notifications with VAPID
    results.step = 5;
    results.details.step5 = 'Subscribing to push notifications with VAPID...';
    
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

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });

    if (!subscription) {
      throw new Error('Failed to subscribe to push notifications');
    }

    results.details.subscriptionEndpoint = subscription.endpoint.substring(0, 50) + '...';
    results.details.subscriptionKeys = Object.keys(subscription.toJSON());
    results.success = true;
    results.details.step5 = 'Successfully subscribed to push notifications with VAPID!';

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push({
      step: results.step,
      error: errorMessage,
      details: results.details[`step${results.step}`] || 'Unknown step'
    });
    
    console.error(`Step ${results.step} failed:`, error);
  }

  return results;
};

export const getPushNotificationTroubleshooting = (results: any) => {
  const troubleshooting: any = {
    title: 'VAPID Push Notification Troubleshooting Guide',
    steps: []
  };

  if (results.success) {
    troubleshooting.steps.push({
      step: '✅',
      title: 'Success!',
      description: 'VAPID push notifications are working correctly.',
      action: 'none'
    });
    return troubleshooting;
  }

  // Add troubleshooting steps based on where it failed
  if (results.step < 2) {
    troubleshooting.steps.push({
      step: '🔑',
      title: 'VAPID Key Issue',
      description: 'VAPID key missing or incorrect format.',
      action: 'Check VAPID key in environment variables'
    });
  }

  if (results.step < 3) {
    troubleshooting.steps.push({
      step: '⚙️',
      title: 'Service Worker Issue',
      description: 'Service worker not supported or not available.',
      action: 'Check browser support'
    });
  }

  if (results.step < 4) {
    troubleshooting.steps.push({
      step: '🔔',
      title: 'Notification Permission Issue',
      description: 'User denied notification permission.',
      action: 'Request permission again'
    });
  }

  if (results.step < 5) {
    troubleshooting.steps.push({
      step: '🚀',
      title: 'VAPID Subscription Issue',
      description: 'Failed to subscribe to push notifications with VAPID.',
      action: 'Check VAPID key format and service worker registration'
    });
  }

  return troubleshooting;
}; 