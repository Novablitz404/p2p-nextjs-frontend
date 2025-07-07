'use client';

import { useState } from 'react';
import { useNotification } from '@/lib/NotificationProvider';
import { Bell } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const NotificationBell = () => {
    const { unreadCount } = useNotification();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(true)}
                className="relative p-2.5 text-gray-400 hover:text-white transition-all duration-200 hover:bg-slate-700/50 rounded-lg group"
            >
                <Bell size={20} className="transition-transform duration-200 group-hover:scale-110" />
            {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
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