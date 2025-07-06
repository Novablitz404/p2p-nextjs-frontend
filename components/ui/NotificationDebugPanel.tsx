'use client';

import { useState, useEffect } from 'react';
import { messagingService } from '@/lib/messaging';
import { getNotificationPermissionStatus } from '@/lib/notificationUtils';
import { testVapidKey } from '@/lib/testVapidKey';

interface NotificationDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDebugPanel = ({ isOpen, onClose }: NotificationDebugPanelProps) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const gatherDebugInfo = async () => {
    setIsLoading(true);
    const info: any = {};

    try {
      // Basic environment info
      info.environment = {
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      };

      // Notification support
      const permissionStatus = getNotificationPermissionStatus();
      info.notificationSupport = permissionStatus;

      // Service worker info
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          info.serviceWorker = {
            exists: !!registration,
            active: registration?.active ? true : false,
            state: registration?.active?.state || 'none',
            controller: !!navigator.serviceWorker.controller,
          };
        } catch (error) {
          info.serviceWorker = { error: error instanceof Error ? error.message : 'Unknown error' };
        }
      } else {
        info.serviceWorker = { supported: false };
      }

      // Firebase config
      info.firebase = {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? 'Present' : 'Missing',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Missing',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'Missing',
      };

      // Network info
      info.network = {
        online: navigator.onLine,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
      };

    } catch (error) {
      info.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const testNotification = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Test Notification', {
          body: 'This is a test notification',
          icon: '/RampzLogo.png',
        });
      }
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  const reloadServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (registration) {
          await registration.update();
          console.log('Service worker update triggered');
        }
      }
    } catch (error) {
      console.error('Service worker reload failed:', error);
    }
  };

  const testVapidKeyConfig = async () => {
    try {
      const result = await testVapidKey();
      console.log('VAPID key test result:', result);
      alert(`VAPID Key Test: ${result.success ? 'SUCCESS' : 'FAILED'}\n${result.error || result.token || ''}`);
    } catch (error) {
      console.error('VAPID key test failed:', error);
      alert('VAPID key test failed');
    }
  };

  useEffect(() => {
    if (isOpen) {
      gatherDebugInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Notification Debug Panel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-300 mt-2">Gathering debug information...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Environment Info */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Environment</h3>
              <div className="bg-slate-700 rounded p-3 text-sm">
                <pre className="text-gray-300">{JSON.stringify(debugInfo.environment, null, 2)}</pre>
              </div>
            </div>

            {/* Notification Support */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Notification Support</h3>
              <div className="bg-slate-700 rounded p-3 text-sm">
                <pre className="text-gray-300">{JSON.stringify(debugInfo.notificationSupport, null, 2)}</pre>
              </div>
            </div>

            {/* Service Worker */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Service Worker</h3>
              <div className="bg-slate-700 rounded p-3 text-sm">
                <pre className="text-gray-300">{JSON.stringify(debugInfo.serviceWorker, null, 2)}</pre>
              </div>
            </div>

            {/* Firebase Config */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Firebase Configuration</h3>
              <div className="bg-slate-700 rounded p-3 text-sm">
                <pre className="text-gray-300">{JSON.stringify(debugInfo.firebase, null, 2)}</pre>
              </div>
            </div>

            {/* Network Info */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Network</h3>
              <div className="bg-slate-700 rounded p-3 text-sm">
                <pre className="text-gray-300">{JSON.stringify(debugInfo.network, null, 2)}</pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-600">
              <button
                onClick={gatherDebugInfo}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Refresh Debug Info
              </button>
              <button
                onClick={testNotification}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Test Notification
              </button>
              <button
                onClick={reloadServiceWorker}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
              >
                Reload Service Worker
              </button>
              <button
                onClick={testVapidKeyConfig}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Test VAPID Key
              </button>
            </div>

            {/* Error Info */}
            {debugInfo.error && (
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
                <div className="bg-red-900/20 border border-red-500 rounded p-3 text-sm">
                  <pre className="text-red-300">{debugInfo.error}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDebugPanel; 