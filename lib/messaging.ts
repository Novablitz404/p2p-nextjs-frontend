import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { db } from './firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export class MessagingService {
  private static instance: MessagingService;
  private token: string | null = null;

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!messaging) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    if (!messaging) {
      console.error('Messaging not available');
      return null;
    }
    
    if (!VAPID_KEY) {
      console.error('VAPID_KEY not found in environment variables');
      return null;
    }

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log('Running in development mode - push notifications may have limitations');
    }

    try {
      console.log('Getting FCM token with VAPID key:', VAPID_KEY.substring(0, 10) + '...');
      
      // Enhanced service worker registration
      if ('serviceWorker' in navigator) {
        try {
          // First, try to get existing registration
          let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          
          if (!registration) {
            console.log('Service worker not found, attempting to register...');
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
              scope: '/',
              updateViaCache: 'none'
            });
            console.log('Service worker registered successfully');
          }
          
          if (registration) {
            console.log('Service worker status:', registration.active ? 'Active' : 'Inactive');
            
            // Wait for the service worker to be ready
            if (registration.installing || registration.waiting) {
              console.log('Waiting for service worker to activate...');
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error('Service worker activation timeout'));
                }, 10000); // 10 second timeout
                
                const worker = registration.installing || registration.waiting;
                if (worker) {
                  worker.addEventListener('statechange', () => {
                    if (worker.state === 'activated') {
                      clearTimeout(timeout);
                      resolve(true);
                    } else if (worker.state === 'redundant') {
                      clearTimeout(timeout);
                      reject(new Error('Service worker became redundant'));
                    }
                  });
                } else {
                  clearTimeout(timeout);
                  resolve(true);
                }
              });
            }
            
            // Ensure service worker is controlling the page
            if (registration.active && !navigator.serviceWorker.controller) {
              console.log('Service worker is active but not controlling the page');
              // Reload the page to ensure service worker takes control
              if (isDevelopment) {
                console.log('In development: Consider reloading the page to ensure service worker control');
              }
            }
          } else {
            console.error('Failed to register service worker');
            return null;
          }
        } catch (error) {
          console.error('Service worker registration error:', error);
          return null;
        }
      }
      
      // Try to get FCM token with timeout
      const tokenPromise = getToken(messaging, { vapidKey: VAPID_KEY });
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('FCM token request timeout')), 15000);
      });
      
      this.token = await Promise.race([tokenPromise, timeoutPromise]) as string;
      console.log('FCM token obtained:', this.token ? 'Success' : 'Failed');
      return this.token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      
      // Provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes('push service error')) {
          console.error('Push service error - this might be due to:');
          console.error('1. Network connectivity issues');
          console.error('2. Firebase project configuration');
          console.error('3. VAPID key issues');
          console.error('4. Service worker not properly registered');
          
          if (isDevelopment) {
            console.log('💡 Tip: Push notifications work better in production. This error is common in development.');
          } else {
            console.log('💡 Tip: Check your Firebase project settings and VAPID key configuration');
          }
        } else if (error.message.includes('permission')) {
          console.error('Permission denied for notifications');
        } else if (error.message.includes('service worker')) {
          console.error('Service worker registration failed');
        } else if (error.message.includes('timeout')) {
          console.error('FCM token request timed out');
        }
      }
      
      return null;
    }
  }

  async saveTokenToFirestore(userId: string): Promise<void> {
    if (!this.token) return;

    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        fcmToken: this.token,
        lastTokenUpdate: new Date(),
      }, { merge: true });
      console.log('FCM token saved to Firestore');
    } catch (error) {
      console.error('Error saving FCM token to Firestore:', error);
    }
  }

  async removeTokenFromFirestore(userId: string): Promise<void> {
    if (!userId) {
      console.log('No userId provided for token removal');
      return;
    }
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: null,
      });
      console.log('FCM token removed from Firestore');
    } catch (error) {
      console.error('Error removing FCM token from Firestore:', error);
    }
  }

  setupForegroundHandler(callback: (payload: any) => void): void {
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      callback(payload);
    });
  }

  async initialize(userId: string): Promise<void> {
    console.log('Initializing messaging service for user:', userId);
    
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return;
    }
    console.log('Notification permission granted');

    // Try to get token with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && !this.token) {
      console.log(`Attempt ${retryCount + 1} to get FCM token...`);
      await this.getToken();
      
      if (!this.token) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${retryCount * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
        }
      }
    }
    
    if (this.token) {
      console.log('Saving FCM token to Firestore...');
      await this.saveTokenToFirestore(userId);
    } else {
      console.error('Failed to get FCM token after all retries');
      console.log('This might be due to development environment limitations');
      console.log('Push notifications will work in production');
    }
  }

  async cleanup(userId: string): Promise<void> {
    if (userId) {
      await this.removeTokenFromFirestore(userId);
    }
    this.token = null;
  }
}

export const messagingService = MessagingService.getInstance(); 