'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification } from '@/types';
import { useWeb3 } from '@/lib/Web3Provider';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';

interface NotificationContextType {
    notifications: AppNotification[];
    addNotification: (notification: { type: 'success' | 'error' | 'info'; message: string; link?: string }) => void;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    unreadCount: number;
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
  const { address } = useWeb3();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Subscribe to Firestore notifications for the current user
  useEffect(() => {
    if (!address) {
      setNotifications([]);
      return;
    }
    const q = query(
      collection(db, `users/${address}/notifications`),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as AppNotification[]
      );
    });
    return () => unsubscribe();
  }, [address]);

  // The rest of the local notification logic can be kept for local toasts, but not for the notification center
  const addNotification = (notification: { type: 'success' | 'error' | 'info'; message: string; link?: string }) => {
    // This can be used for local toasts only, not for persistent notifications
    // Optionally, you can remove this or keep for legacy code
  };

  const markAsRead = async (id: string) => {
    if (!address) return;
    try {
      const notifRef = doc(db, `users/${address}/notifications`, id);
      await updateDoc(notifRef, { read: true });
    } catch (e) {
      // fallback to local update if Firestore fails
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };
  
  const clearAll = async () => {
    if (!address) {
      setNotifications([]);
      return;
    }
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        const notifRef = doc(db, `users/${address}/notifications`, n.id);
        batch.delete(notifRef);
      });
      await batch.commit();
    } catch (e) {
      setNotifications([]);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    clearAll,
    unreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};