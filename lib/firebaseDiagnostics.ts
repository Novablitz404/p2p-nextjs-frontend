// Comprehensive VAPID diagnostics

export const runFirebaseDiagnostics = async () => {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      userAgent: navigator.userAgent,
    },
    firebase: {
      config: {
        apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      },
      vapidKey: {
        present: !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        length: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.length,
        startsWithB: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.startsWith('B'),
      }
    },
    browser: {
      serviceWorker: 'serviceWorker' in navigator,
      notifications: 'Notification' in window,
      permission: Notification.permission,
    },
    serviceWorker: null,
    fcmTest: null,
    errors: []
  };

  try {
    // Test 1: Service Worker Status
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        results.serviceWorker = {
          exists: !!registration,
          active: registration?.active ? true : false,
          state: registration?.active?.state || 'none',
          controller: !!navigator.serviceWorker.controller,
          scope: registration?.scope,
        };
      } catch (error) {
        results.serviceWorker = { error: error instanceof Error ? error.message : 'Unknown error' };
        results.errors.push(`Service Worker Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Test 2: VAPID Key Validation
    try {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        throw new Error('VAPID key not found');
      }
      if (!vapidKey.startsWith('B')) {
        throw new Error('VAPID key format incorrect');
      }
      results.firebase.initialization = 'success';
    } catch (error) {
      results.firebase.initialization = 'failed';
      results.errors.push(`VAPID Key Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: VAPID Subscription (not FCM)
    try {
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (!registration) {
        throw new Error('Service worker not registered');
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        throw new Error('VAPID key not found');
      }

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
      
      results.fcmTest = {
        success: true,
        tokenLength: subscription.endpoint.length,
        tokenPreview: subscription.endpoint.substring(0, 20) + '...',
      };
    } catch (error) {
      results.fcmTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      };
      results.errors.push(`VAPID Subscription Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Network Connectivity
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      results.network = { fcmReachable: true };
    } catch (error) {
      results.network = { fcmReachable: false };
      results.errors.push(`Network Error: Cannot reach FCM servers`);
    }

  } catch (error) {
    results.errors.push(`General Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return results;
};

export const getFirebaseProjectInfo = () => {
  return {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    vapidKeyPreview: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 20) + '...',
  };
}; 