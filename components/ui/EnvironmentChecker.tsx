'use client';

import { useState } from 'react';

const EnvironmentChecker = () => {
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkEnvironmentVariables = () => {
    setIsLoading(true);
    
    const info = {
      vapidKey: {
        present: !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        length: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.length,
        startsWithB: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.startsWith('B'),
        preview: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 20) + '...',
      },
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      apiKey: {
        present: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        preview: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...',
      },
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      appId: {
        present: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      },
      nodeEnv: process.env.NODE_ENV,
    };
    
    setEnvInfo(info);
    setIsLoading(false);
  };

  return (
    <div className="bg-slate-700 rounded p-4">
      <h3 className="text-lg font-semibold text-white mb-2">Environment Variables Check</h3>
      
      <button
        onClick={checkEnvironmentVariables}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-colors mb-4"
      >
        {isLoading ? 'Checking...' : 'Check Environment Variables'}
      </button>
      
      {envInfo && (
        <div className="space-y-4">
          <div className="bg-slate-600 rounded p-3">
            <h4 className="font-semibold text-white mb-2">VAPID Key</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Present: {envInfo.vapidKey.present ? '✅ Yes' : '❌ No'}</div>
              <div>Length: {envInfo.vapidKey.length || 'N/A'}</div>
              <div>Starts with 'B': {envInfo.vapidKey.startsWithB ? '✅ Yes' : '❌ No'}</div>
              <div>Preview: {envInfo.vapidKey.preview || 'N/A'}</div>
            </div>
          </div>
          
          <div className="bg-slate-600 rounded p-3">
            <h4 className="font-semibold text-white mb-2">Firebase Config</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Project ID: {envInfo.projectId || '❌ Missing'}</div>
              <div>Messaging Sender ID: {envInfo.messagingSenderId || '❌ Missing'}</div>
              <div>API Key: {envInfo.apiKey.present ? '✅ Present' : '❌ Missing'}</div>
              <div>Auth Domain: {envInfo.authDomain || '❌ Missing'}</div>
              <div>Storage Bucket: {envInfo.storageBucket || '❌ Missing'}</div>
              <div>App ID: {envInfo.appId.present ? '✅ Present' : '❌ Missing'}</div>
            </div>
          </div>
          
          <div className="bg-slate-600 rounded p-3">
            <h4 className="font-semibold text-white mb-2">Environment</h4>
            <div className="text-sm text-gray-300">
              <div>Node Environment: {envInfo.nodeEnv}</div>
            </div>
          </div>
          
          {!envInfo.vapidKey.present && (
            <div className="bg-red-900/20 border border-red-500 rounded p-3">
              <h4 className="font-semibold text-red-400 mb-2">⚠️ Issue Found</h4>
              <div className="text-sm text-red-300">
                <p>VAPID key is missing from environment variables!</p>
                <p className="mt-2">To fix this:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Go to your Vercel dashboard</li>
                  <li>Navigate to Settings → Environment Variables</li>
                  <li>Add: NEXT_PUBLIC_FIREBASE_VAPID_KEY</li>
                  <li>Set the value to your VAPID key from Firebase Console</li>
                  <li>Redeploy your project</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnvironmentChecker; 