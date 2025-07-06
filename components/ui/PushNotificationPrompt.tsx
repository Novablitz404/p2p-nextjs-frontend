'use client';

import { useState } from 'react';
import { useNotification } from '@/lib/NotificationProvider';
import { Bell, X } from 'lucide-react';

interface PushNotificationPromptProps {
  onClose?: () => void;
}

const PushNotificationPrompt = ({ onClose }: PushNotificationPromptProps) => {
  const { pushEnabled } = useNotification();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // The NotificationProvider will handle the rest
        console.log('Push notifications enabled');
      } else {
        console.log('Push notifications denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (pushEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Bell className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold mb-1">Enable Push Notifications</h3>
          <p className="text-gray-300 text-sm mb-3">
            Get notified about new trades, matches, and important updates even when you're not using the app.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnableNotifications}
              disabled={isRequesting}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm rounded-md transition-colors"
            >
              {isRequesting ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-sm rounded-md transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PushNotificationPrompt; 