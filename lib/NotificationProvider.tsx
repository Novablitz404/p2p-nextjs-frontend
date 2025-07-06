'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useWeb3 } from './Web3Provider'; // To get the current user's address
import { db } from './firebase';
import { collection, query, onSnapshot, orderBy, limit, doc, updateDoc, writeBatch, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { AppNotification } from '@/types';
import { messagingService } from './messaging';
import NotificationPermissionPrompt from '@/components/ui/NotificationPermissionPrompt';

export interface ModalNotification {
    isOpen: boolean;
    title: string;
    message: string;
}

export interface NotificationContextType {
    notifications: AppNotification[];
    addNotification: (userId: string, notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
    markAsRead: (id: string) => void;
    clearAll: () => void;
    unreadCount: number;
    modalNotification: ModalNotification | null;
    closeModalNotification: () => void;
    pushEnabled: boolean;
    showPermissionPrompt: () => void;
    hidePermissionPrompt: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { address } = useWeb3();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [modalNotification, setModalNotification] = useState<ModalNotification | null>(null);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

    useEffect(() => {
        setAudio(new Audio('/Ramp Notification.mp3'));
    }, []);

    // Initialize push notifications when user connects
    useEffect(() => {
        if (address) {
            messagingService.initialize(address).then(() => {
                setPushEnabled(true);
            });
            
            // Setup foreground message handler
            messagingService.setupForegroundHandler((payload) => {
                console.log('Received foreground push notification:', payload);
                // Play sound for foreground notifications
                audio?.play().catch(e => console.error("Error playing sound:", e));
            });
        } else {
            if (address) {
                messagingService.cleanup(address).then(() => {
                    setPushEnabled(false);
                });
            } else {
                setPushEnabled(false);
            }
        }
    }, [address, audio]);

    useEffect(() => {
        if (!address) {
            setNotifications([]);
            return;
        }

        const notificationsRef = collection(db, 'users', address, 'notifications');
        const q = query(notificationsRef, orderBy("timestamp", "desc"), limit(30));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as AppNotification));

            setNotifications(prevNotifications => {
                const newUnread = fetchedNotifications.find(n => 
                    !n.read && !prevNotifications.some(existing => existing.id === n.id)
                );
                
                if (newUnread) {
                    audio?.play().catch(e => console.error("Error playing sound:", e));
                    
                    let title = 'New Notification';
                    if (newUnread.type === 'success') title = 'Success!';
                    if (newUnread.type === 'error') title = 'Error';
                    if (newUnread.type === 'info') title = 'Information';
                    
                    setModalNotification({ isOpen: true, title: title, message: newUnread.message });
                }
                return fetchedNotifications;
            });
        });

        return () => unsubscribe();
    }, [address, audio]);

    const addNotification = useCallback(async (userId: string, notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        const notificationsRef = collection(db, 'users', userId, 'notifications');
        await addDoc(notificationsRef, {
            ...notification,
            read: false,
            timestamp: serverTimestamp(),
        });
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        if (!address) return;
        const notificationRef = doc(db, 'users', address, 'notifications', id);
        await updateDoc(notificationRef, { read: true });
    }, [address]);

    const clearAll = useCallback(async () => {
        if (!address || notifications.length === 0) return;
        const batch = writeBatch(db);
        notifications.forEach(n => {
            const docRef = doc(db, 'users', address, 'notifications', n.id);
            batch.delete(docRef);
        });
        await batch.commit();
    }, [address, notifications]);
    
    const closeModalNotification = useCallback(() => {
        setModalNotification(null);
    }, []);

    const handleShowPermissionPrompt = useCallback(() => {
        setShowPermissionPrompt(true);
    }, []);

    const handleHidePermissionPrompt = useCallback(() => {
        setShowPermissionPrompt(false);
    }, []);

    const handleNotificationEnabled = useCallback(() => {
        setShowPermissionPrompt(false);
        // Re-initialize messaging service
        if (address) {
            messagingService.initialize(address).then(() => {
                setPushEnabled(true);
            });
        }
    }, [address]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const value = { 
        notifications, 
        addNotification, 
        markAsRead, 
        clearAll, 
        unreadCount, 
        modalNotification, 
        closeModalNotification,
        pushEnabled,
        showPermissionPrompt: handleShowPermissionPrompt,
        hidePermissionPrompt: handleHidePermissionPrompt
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
            {showPermissionPrompt && (
                <NotificationPermissionPrompt
                    onClose={handleHidePermissionPrompt}
                    onEnable={handleNotificationEnabled}
                />
            )}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};