'use client';

import { useState } from 'react';
import { Smartphone, Chrome, X } from 'lucide-react';

interface MobileNotificationInstructionsProps {
  onClose: () => void;
}

const MobileNotificationInstructions = ({ onClose }: MobileNotificationInstructionsProps) => {
  const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'safari' | 'firefox' | null>(null);

  const browserInstructions = {
    chrome: [
      'Tap the three dots (⋮) in the top right',
      'Tap "Settings"',
      'Tap "Site settings"',
      'Tap "Notifications"',
      'Find this website and tap it',
      'Change to "Allow"',
      'Refresh the page'
    ],
    safari: [
      'Tap the "AA" button in the address bar',
      'Tap "Website Settings"',
      'Tap "Notifications"',
      'Change to "Allow"',
      'Refresh the page'
    ],
    firefox: [
      'Tap the menu button (☰)',
      'Tap "Settings"',
      'Tap "Site permissions"',
      'Tap "Notifications"',
      'Find this website and tap it',
      'Change to "Allow"',
      'Refresh the page'
    ]
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Enable Notifications on Mobile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Select your browser to see specific instructions:
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedBrowser('chrome')}
              className={`p-3 rounded-lg border transition-colors ${
                selectedBrowser === 'chrome' 
                  ? 'border-blue-500 bg-blue-500/20' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <Chrome className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <span className="text-xs text-white">Chrome</span>
            </button>
            
            <button
              onClick={() => setSelectedBrowser('safari')}
              className={`p-3 rounded-lg border transition-colors ${
                selectedBrowser === 'safari' 
                  ? 'border-blue-500 bg-blue-500/20' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="w-8 h-8 mx-auto mb-2 text-blue-500 flex items-center justify-center">
                <span className="text-lg font-bold">S</span>
              </div>
              <span className="text-xs text-white">Safari</span>
            </button>
            
            <button
              onClick={() => setSelectedBrowser('firefox')}
              className={`p-3 rounded-lg border transition-colors ${
                selectedBrowser === 'firefox' 
                  ? 'border-blue-500 bg-blue-500/20' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="w-8 h-8 mx-auto mb-2 text-orange-500 flex items-center justify-center">
                <span className="text-lg font-bold">F</span>
              </div>
              <span className="text-xs text-white">Firefox</span>
            </button>
          </div>
        </div>

        {selectedBrowser && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">
              {selectedBrowser === 'chrome' && 'Chrome Instructions'}
              {selectedBrowser === 'safari' && 'Safari Instructions'}
              {selectedBrowser === 'firefox' && 'Firefox Instructions'}
            </h3>
            
            <div className="space-y-3">
              {browserInstructions[selectedBrowser].map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-300">{step}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                <strong>Note:</strong> After enabling notifications, you may need to refresh the page or restart your browser for the changes to take effect.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNotificationInstructions; 