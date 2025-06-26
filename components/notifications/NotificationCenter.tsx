'use client';

import { useNotification } from '@/lib/NotificationProvider';
import { AppNotification } from '@/types';
import { X, Trash2 } from 'lucide-react';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
    const { notifications, markAsRead, clearAll } = useNotification();

    const handleNotificationClick = (notification: AppNotification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
    };

    return (
        <>
            {/* --- THIS IS THE CHANGE: Added duration and easing for a smooth fade --- */}
            <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            
            {/* --- THIS IS THE CHANGE: Added duration and easing for a smooth slide --- */}
            <div className={`fixed top-0 right-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Notifications</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-slate-700"><X size={20}/></button>
                    </div>
                    
                    {notifications.length > 0 && (
                        <button onClick={clearAll} className="text-sm text-red-400 hover:underline flex items-center gap-1 mb-4">
                            <Trash2 size={14}/> Clear All
                        </button>
                    )}

                    <div className="flex-grow overflow-y-auto space-y-3 -mr-2 pr-2">
                        {notifications.length === 0 ? (
                            <p className="text-center text-gray-500 mt-10">You have no notifications.</p>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 rounded-lg border border-slate-700 cursor-pointer ${n.read ? 'bg-slate-800/50' : 'bg-slate-700/50'}`}>
                                    <p className={`text-sm ${n.read ? 'text-gray-400' : 'text-white'}`}>{n.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {n.timestamp ? n.timestamp.toDate().toLocaleString() : 'Pending...'}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotificationCenter;