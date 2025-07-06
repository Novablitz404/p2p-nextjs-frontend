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
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    console.log('VAPID Key present:', !!vapidKey);
    console.log('VAPID Key length:', vapidKey?.length);
    
    if (!vapidKey) {
      throw new Error('VAPID key not found');
    }
    
    // Test getting token
    const token = await getToken(messaging, { vapidKey });
    console.log('Token obtained successfully:', !!token);
    console.log('Token length:', token?.length);
    
    return { success: true, token: token?.substring(0, 20) + '...' };
  } catch (error) {
    console.error('VAPID key test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}; 