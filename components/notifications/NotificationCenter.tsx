'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useNotification } from '@/lib/NotificationProvider';
import { AppNotification } from '@/types';
import { X, Trash2, CheckCircle, Circle, Check, Bell } from 'lucide-react';
import Link from 'next/link';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

const ANIMATION_DURATION = 300; // ms

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
    const { notifications, markAsRead, clearAll, unreadCount } = useNotification();
    const popupRef = useRef<HTMLDivElement>(null);
    const [show, setShow] = useState(isOpen);
    const [animateOpen, setAnimateOpen] = useState(false);

    // Keep mounted for exit animation
    useEffect(() => {
        if (isOpen) {
            setShow(true);
            setAnimateOpen(false);
            // Trigger open animation after mount
            requestAnimationFrame(() => setAnimateOpen(true));
        } else {
            setAnimateOpen(false);
            const timeout = setTimeout(() => setShow(false), ANIMATION_DURATION);
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);

    // Close popup when clicking outside
    useEffect(() => {
        if (!show) return;
        function handleClick(e: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [show, onClose]);

    if (!show) return null;

    const handleNotificationClick = (notification: AppNotification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        onClose();
    };

    const markAllAsRead = () => {
        notifications.forEach(notification => {
            if (!notification.read) {
                markAsRead(notification.id);
            }
        });
    };

    const renderNotificationContent = (notification: AppNotification) => (
        <div className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-lg ${
            notification.read 
                ? 'bg-slate-800/30 border-slate-600/30' 
                : 'bg-slate-700/50 border-slate-500/50 hover:bg-slate-700/70'
        }`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {notification.read ? (
                        <CheckCircle size={16} className="text-emerald-400" />
                    ) : (
                        <Circle size={16} className="text-blue-400" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                        notification.read ? 'text-gray-400' : 'text-white'
                    }`}>
                        {notification.message}
                    </p>
            <p className="text-xs text-gray-500 mt-1">
                        {notification.timestamp ? notification.timestamp.toDate().toLocaleString() : 'Just now'}
            </p>
                </div>
                {!notification.read && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                        }}
                        className="flex-shrink-0 p-1 rounded-full hover:bg-slate-600/50 transition-colors"
                        title="Mark as read"
                    >
                        <Check size={14} className="text-gray-400 hover:text-white" />
                    </button>
                )}
            </div>
        </div>
    );

    const popupClasses = `absolute right-0 mt-2 w-80 max-h-[28rem] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border border-slate-600/50 shadow-2xl rounded-xl z-[9999] transition-all duration-300 ease-out ` +
        (animateOpen && isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none');

    return (
        <div
            ref={popupRef}
            className={popupClasses}
            style={{ transformOrigin: 'top right' }}
        >
            <div className="p-4 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-600/30">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-white">Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full text-gray-400 hover:bg-slate-700/50 hover:text-white transition-colors"
                    >
                        <X size={18}/>
                    </button>
                </div>
                {/* Action Buttons */}
                    {notifications.length > 0 && (
                    <div className="flex gap-2 mb-3 pb-2 border-b border-slate-600/30">
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            >
                                <CheckCircle size={14} />
                                Mark all read
                            </button>
                        )}
                        <button 
                            onClick={clearAll} 
                            className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <Trash2 size={14}/>
                            Clear all
                        </button>
                    </div>
                    )}
                {/* Notifications List */}
                <div className="flex-grow overflow-y-auto space-y-2 pr-1" style={{ maxHeight: '18rem' }}>
                        {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                            <div className="w-12 h-12 bg-slate-700/50 rounded-full flex items-center justify-center mb-2">
                                <Bell size={20} className="text-gray-400" />
                            </div>
                            <p className="text-gray-400 font-medium">No notifications yet</p>
                            <p className="text-xs text-gray-500 mt-1">We'll notify you when something important happens</p>
                        </div>
                        ) : (
                            notifications.map(n => (
                            <div key={n.id} className="group">
                                    {n.link ? (
                                        <Link href={n.link} onClick={() => handleNotificationClick(n)}>
                                            {renderNotificationContent(n)}
                                        </Link>
                                    ) : (
                                    <div 
                                        onClick={() => handleNotificationClick(n)}
                                        className="cursor-pointer"
                                    >
                                            {renderNotificationContent(n)}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
    );
};

export default NotificationCenter;