'use client';

import React, { createContext, useContext, useState } from 'react';
import { AppNotification } from '@/types';

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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = (notification: { type: 'success' | 'error' | 'info'; message: string; link?: string }) => {
    const newNotification: AppNotification = {
      id: Date.now().toString(),
      type: notification.type,
      message: notification.message,
      timestamp: { toDate: () => new Date() } as any, // Mock timestamp for now
      read: false,
      link: notification.link
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAll = () => {
    setNotifications([]);
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