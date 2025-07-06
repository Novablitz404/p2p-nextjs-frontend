import { getMessaging, getToken } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

export const runComprehensivePushTest = async () => {
  const results: any = {
    step: 1,
    totalSteps: 6,
    success: false,
    errors: [],
    details: {}
  };

  try {
    // Step 1: Check Firebase initialization
    results.step = 1;
    results.details.step1 = 'Checking Firebase initialization...';
    
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    results.details.firebaseInitialized = true;

    // Step 2: Check messaging initialization
    results.step = 2;
    results.details.step2 = 'Initializing Firebase Messaging...';
    
    const messaging = getMessaging(app);
    results.details.messagingInitialized = true;

    // Step 3: Check service worker
    results.step = 3;
    results.details.step3 = 'Checking service worker...';
    
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      throw new Error('No service worker registration found');
    }

    if (!registration.active) {
      throw new Error('Service worker not active');
    }

    results.details.serviceWorkerActive = true;
    results.details.serviceWorkerState = registration.active.state;

    // Step 4: Check notification permission
    results.step = 4;
    results.details.step4 = 'Checking notification permission...';
    
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

    // Step 5: Check VAPID key
    results.step = 5;
    results.details.step5 = 'Checking VAPID key...';
    
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      throw new Error('VAPID key not found in environment variables');
    }

    if (!vapidKey.startsWith('B')) {
      throw new Error('VAPID key format incorrect (should start with B)');
    }

    results.details.vapidKeyPresent = true;
    results.details.vapidKeyLength = vapidKey.length;

    // Step 6: Request FCM token
    results.step = 6;
    results.details.step6 = 'Requesting FCM token...';
    
    const token = await getToken(messaging, {
      vapidKey: vapidKey
    });

    if (!token) {
      throw new Error('Failed to get FCM token');
    }

    results.details.fcmToken = token.substring(0, 20) + '...';
    results.details.fcmTokenLength = token.length;
    results.success = true;
    results.details.step6 = 'FCM token obtained successfully!';

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
    title: 'Push Notification Troubleshooting Guide',
    steps: []
  };

  if (results.success) {
    troubleshooting.steps.push({
      step: '✅',
      title: 'Success!',
      description: 'Push notifications are working correctly.',
      action: 'none'
    });
    return troubleshooting;
  }

  // Add troubleshooting steps based on where it failed
  if (results.step < 2) {
    troubleshooting.steps.push({
      step: '🔧',
      title: 'Firebase Configuration Issue',
      description: 'Check your Firebase config in environment variables.',
      action: 'Check environment variables'
    });
  }

  if (results.step < 3) {
    troubleshooting.steps.push({
      step: '⚙️',
      title: 'Service Worker Issue',
      description: 'Service worker not registered or not active.',
      action: 'Reload service worker'
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
      step: '🔑',
      title: 'VAPID Key Issue',
      description: 'VAPID key missing or incorrect format.',
      action: 'Check VAPID key in environment variables'
    });
  }

  if (results.step < 6) {
    troubleshooting.steps.push({
      step: '🚀',
      title: 'FCM Token Issue',
      description: 'Failed to get FCM token. Check Firebase Console settings.',
      action: 'Check Firebase Console → Cloud Messaging → Web Push certificates'
    });
  }

  return troubleshooting;
}; 