'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppNotification } from '@/types';

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
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  clearAll: () => void;
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

      // Register service worker with retry logic
      let registration: ServiceWorkerRegistration | undefined;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registered:', registration);
          break;
        } catch (error) {
          retries++;
          console.warn(`Service Worker registration attempt ${retries} failed:`, error);
          if (retries >= maxRetries) {
            throw new Error('Failed to register service worker after multiple attempts');
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      if (!registration) {
        throw new Error('Service Worker registration failed');
      }

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
    // Create a new notification with proper structure
    const newNotification: AppNotification = {
      id: Date.now().toString(),
      type: notification.type,
      message: notification.message,
      timestamp: { toDate: () => new Date() } as any, // Mock timestamp for now
      read: false,
      link: notification.link
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    console.log('Notification added:', newNotification);
  };

  // Add missing properties
  const pushEnabled = isSubscribed && permission === 'granted';
  
  const showPermissionPrompt = () => {
    if (permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Add notification management functions
  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      const newUnreadCount = updated.filter(n => !n.read).length;
      setUnreadCount(newUnreadCount);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
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
    showPermissionPrompt,
    notifications,
    markAsRead,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};