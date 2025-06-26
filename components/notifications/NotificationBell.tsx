'use client';

import { useNotification } from '@/lib/NotificationProvider';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
    onClick: () => void;
}

const NotificationBell = ({ onClick }: NotificationBellProps) => {
    const { unreadCount } = useNotification();

    return (
        <button onClick={onClick} className="relative p-2 text-gray-400 hover:text-white">
            <Bell size={20} />
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-xs text-white items-center justify-center">
                        {unreadCount}
                    </span>
                </span>
            )}
        </button>
    );
};

export default NotificationBell;