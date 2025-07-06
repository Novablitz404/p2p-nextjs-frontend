export const testVapidSetup = async () => {
  const results: any = {
    step: 1,
    totalSteps: 4,
    success: false,
    errors: [],
    details: {}
  };

  try {
    // Step 1: Check VAPID public key
    results.step = 1;
    results.details.step1 = 'Checking VAPID public key...';
    
    const vapidPublicKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidPublicKey) {
      throw new Error('VAPID public key not found in environment variables');
    }

    if (!vapidPublicKey.startsWith('B')) {
      throw new Error('VAPID public key format incorrect (should start with B)');
    }

    results.details.vapidKeyPresent = true;
    results.details.vapidKeyLength = vapidPublicKey.length;
    results.details.vapidKeyPreview = vapidPublicKey.substring(0, 20) + '...';

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

    // Step 4: Test service worker registration
    results.step = 4;
    results.details.step4 = 'Testing service worker registration...';
    
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    results.details.serviceWorkerRegistered = true;
    results.details.serviceWorkerState = registration.active?.state || 'unknown';

    // Test push subscription
    if (permission === 'granted') {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        results.details.alreadySubscribed = true;
        results.details.subscriptionEndpoint = subscription.endpoint.substring(0, 50) + '...';
      } else {
        results.details.alreadySubscribed = false;
      }
    }

    results.success = true;
    results.details.step4 = 'VAPID setup test completed successfully!';

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

export const getVapidInstructions = () => {
  return {
    title: 'VAPID Setup Instructions',
    steps: [
      {
        step: 1,
        title: 'Add VAPID Keys to Environment Variables',
        description: 'Add these to your Vercel environment variables:\nNEXT_PUBLIC_FIREBASE_VAPID_KEY=BGtqtKCJdnuLTNrbOifvmqbB3xD27r5a-M9z8DgO-DoKJdBV5D3UvByLIsqUL5_lNVfvYCuGKpLNcv1qFRSB9mo\nVAPID_PRIVATE_KEY=YEPWhSGwZDBeNyX3Nyl6RwJj4yh5ZmbwVrT5bFr_edE',
        critical: true
      },
      {
        step: 2,
        title: 'Deploy the Updated Code',
        description: 'Deploy the updated service worker and notification provider that uses VAPID instead of Firebase',
        critical: true
      },
      {
        step: 3,
        title: 'Test Push Notifications',
        description: 'Use the debug panel to test push notifications with the new VAPID setup',
        critical: false
      },
      {
        step: 4,
        title: 'Update Server Code',
        description: 'Update your server-side code to use VAPID for sending push notifications',
        critical: false
      }
    ]
  };
}; 