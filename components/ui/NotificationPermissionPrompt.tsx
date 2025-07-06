'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, CheckCircle, X, Monitor } from 'lucide-react';

interface NotificationPermissionPromptProps {
  onClose?: () => void;
  onEnable?: () => void;
}

const NotificationPermissionPrompt = ({ onClose, onEnable }: NotificationPermissionPromptProps) => {
  const [step, setStep] = useState(1);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const handleRequestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setStep(3); // Success step
        onEnable?.();
      } else if (result === 'denied') {
        setStep(4); // Manual enable step
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setStep(4); // Manual enable step
    }
  };

  const handleManualEnable = () => {
    setStep(5); // Instructions step
  };

  // Check if user is on mobile
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  if (permission === 'granted') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
        {step === 1 && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Bell className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Enable Push Notifications</h2>
            <p className="text-gray-300 mb-6">
              Get notified about new trades, matches, and important updates even when you're not using the app.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRequestPermission}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
              >
                Enable Notifications
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Notifications Enabled!</h2>
            <p className="text-gray-300 mb-6">
              You'll now receive push notifications for new trades and important updates.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
            >
              Great!
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Smartphone className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Permission Denied</h2>
            <p className="text-gray-300 mb-6">
              To enable notifications, you'll need to manually allow them in your browser settings.
            </p>
            <button
              onClick={handleManualEnable}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              Show Instructions
            </button>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">How to Enable Notifications</h2>
            
            {isMobile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-blue-300">Mobile Instructions</span>
                </div>
                <div className="space-y-4 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-semibold text-white">Open Browser Settings</p>
                      <p>Tap the menu (⋮) in your browser and go to Settings</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="font-semibold text-white">Find Site Settings</p>
                      <p>Look for "Site settings" or "Permissions"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="font-semibold text-white">Allow Notifications</p>
                      <p>Find this website and set notifications to "Allow"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                    <div>
                      <p className="font-semibold text-white">Refresh the Page</p>
                      <p>Reload the page and try again</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Monitor className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-blue-300">Desktop Instructions</span>
                </div>
                <div className="space-y-4 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="font-semibold text-white">Click the Lock Icon</p>
                      <p>Click the lock icon in the address bar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                    <div>
                      <p className="font-semibold text-white">Change Notifications</p>
                      <p>Change notifications from "Block" to "Allow"</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                    <div>
                      <p className="font-semibold text-white">Refresh the Page</p>
                      <p>Reload the page and try again</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt; 