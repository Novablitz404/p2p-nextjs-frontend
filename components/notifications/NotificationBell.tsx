'use client';

import { useState } from 'react';
import { useNotification } from '@/lib/NotificationProvider';
import { Bell, Settings, Bug } from 'lucide-react';
import NotificationDebugPanel from '@/components/ui/NotificationDebugPanel';

interface NotificationBellProps {
    onClick: () => void;
}

const NotificationBell = ({ onClick }: NotificationBellProps) => {
    const { unreadCount, pushEnabled, showPermissionPrompt } = useNotification();
    const [showDebugPanel, setShowDebugPanel] = useState(false);

    return (
        <div className="flex items-center gap-2">
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
            
            {!pushEnabled && (
                <button 
                    onClick={showPermissionPrompt}
                    className="p-1 text-yellow-400 hover:text-yellow-300"
                    title="Enable push notifications"
                >
                    <Settings size={16} />
                </button>
            )}
            
            {/* Debug button - always show for troubleshooting */}
            <button 
                onClick={() => setShowDebugPanel(true)}
                className="p-1 text-blue-400 hover:text-blue-300"
                title="Debug notifications"
            >
                <Bug size={16} />
            </button>
            
            <NotificationDebugPanel 
                isOpen={showDebugPanel}
                onClose={() => setShowDebugPanel(false)}
            />
        </div>
    );
};

export default NotificationBell;