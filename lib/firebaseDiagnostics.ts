// Comprehensive Firebase diagnostics
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

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
        apiKey: !!firebaseConfig.apiKey,
        authDomain: !!firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: !!firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: !!firebaseConfig.appId,
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

    // Test 2: Firebase Initialization
    try {
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);
      results.firebase.initialization = 'success';
    } catch (error) {
      results.firebase.initialization = 'failed';
      results.errors.push(`Firebase Init Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: FCM Token Generation
    try {
      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        throw new Error('VAPID key not found');
      }

      // Test with timeout
      const tokenPromise = getToken(messaging, { vapidKey });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('FCM token request timeout')), 20000);
      });

      const token = await Promise.race([tokenPromise, timeoutPromise]) as string;
      
      results.fcmTest = {
        success: true,
        tokenLength: token?.length,
        tokenPreview: token?.substring(0, 20) + '...',
      };
    } catch (error) {
      results.fcmTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      };
      results.errors.push(`FCM Token Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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