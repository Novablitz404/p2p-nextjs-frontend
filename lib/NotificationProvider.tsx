'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface NotificationContextType {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendTestNotification: () => void;
  vapidPublicKey: string | null;
  addNotification: (userId: string, notification: { type: 'success' | 'error' | 'info'; message: string; link?: string }) => void;
  unreadCount: number;
  pushEnabled: boolean;
  showPermissionPrompt: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Also export useNotification for backward compatibility
export const useNotification = useNotifications;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        
        // Get VAPID public key from environment - use the same name as other files
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        setVapidPublicKey(vapidKey || null);

        // Check if already subscribed
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      }
    };

    checkSupport();
  }, []);

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

  const subscribe = async () => {
    try {
      if (!isSupported) {
        throw new Error('Push notifications not supported');
      }

      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push notifications with VAPID
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log('Push subscription:', subscription);

      // Send subscription to server
      const response = await fetch('/api/saveSubscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }

      setIsSubscribed(true);
      console.log('Successfully subscribed to push notifications');

    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          
          // Notify server about unsubscription
          await fetch('/api/removeSubscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription)
          });

          setIsSubscribed(false);
          console.log('Successfully unsubscribed from push notifications');
        }
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  };

  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from Rampz',
        icon: '/RampzLogo.png',
        badge: '/RampzLogo.png',
        tag: 'test'
      });
    }
  };

  // Add the addNotification method that components expect
  const addNotification = (userId: string, notification: { type: 'success' | 'error' | 'info'; message: string; link?: string }) => {
    // For now, just log the notification
    console.log('Notification:', { userId, ...notification });
    
    // You can implement actual notification logic here
    // For example, save to Firestore, show toast, etc.
  };

  // Add missing properties
  const pushEnabled = isSubscribed && permission === 'granted';
  
  const showPermissionPrompt = () => {
    if (permission === 'default') {
      Notification.requestPermission();
    }
  };

  const value: NotificationContextType = {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendTestNotification,
    vapidPublicKey,
    addNotification,
    unreadCount,
    pushEnabled,
    showPermissionPrompt
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};