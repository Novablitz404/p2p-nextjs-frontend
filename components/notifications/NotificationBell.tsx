'use client';

import { useState } from 'react';
import { useNotification } from '@/lib/NotificationProvider';
import { Bell, Settings } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const NotificationBell = () => {
    const { unreadCount } = useNotification();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            
            <NotificationCenter 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
            />
        </div>
    );
};

export default NotificationBell;