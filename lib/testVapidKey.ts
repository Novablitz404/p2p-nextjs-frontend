// Utility to test VAPID key configuration
import { getMessaging, getToken } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

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
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    
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
    
    // Test getting token with timeout
    const tokenPromise = getToken(messaging, { vapidKey });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('FCM token request timeout')), 15000);
    });
    
    const token = await Promise.race([tokenPromise, timeoutPromise]) as string;
    console.log('Token obtained successfully:', !!token);
    console.log('Token length:', token?.length);
    console.log('Token starts with:', token?.substring(0, 20));
    
    return { 
      success: true, 
      token: token?.substring(0, 20) + '...',
      details: {
        vapidKeyLength: vapidKey.length,
        tokenLength: token?.length,
        serviceWorkerActive: !!registration.active,
        serviceWorkerController: !!navigator.serviceWorker.controller
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