'use client';

import { useState, useEffect } from 'react';
import { messagingService } from '@/lib/messaging';
import { getNotificationPermissionStatus } from '@/lib/notificationUtils';
import { testVapidKey } from '@/lib/testVapidKey';
import { runFirebaseDiagnostics, getFirebaseProjectInfo } from '@/lib/firebaseDiagnostics';
import { verifyVapidKeyWithProject, getFirebaseConsoleInstructions } from '@/lib/verifyVapidKey';
import { testFirebaseProjectConfig, getFirebaseConsoleChecklist } from '@/lib/firebaseProjectTest';
import { checkFirebaseAuthConfig, getFirebaseAuthInstructions } from '@/lib/checkFirebaseAuth';
import { runComprehensivePushTest, getPushNotificationTroubleshooting } from '@/lib/pushNotificationTest';
import { testVapidSetup, getVapidInstructions } from '@/lib/testVapidSetup';
import EnvironmentChecker from './EnvironmentChecker';

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

  const forceServiceWorkerControl = async () => {
    try {
      if ('serviceWorker' in navigator) {
        // Unregister the current service worker
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (registration) {
          await registration.unregister();
          console.log('Service worker unregistered');
        }
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Re-register the service worker
        const newRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        console.log('Service worker re-registered');
        
        // Reload the page to ensure the service worker takes control
        window.location.reload();
      }
    } catch (error) {
      console.error('Force service worker control failed:', error);
    }
  };

  const testVapidKeyConfig = async () => {
    try {
      const result = await testVapidKey();
      console.log('VAPID key test result:', result);
      
      if (result.success) {
        alert(`✅ VAPID Key Test: SUCCESS\n\nToken: ${result.token}\n\nDetails: ${JSON.stringify(result.details, null, 2)}`);
      } else {
        alert(`❌ VAPID Key Test: FAILED\n\nError: ${result.error}\n\nDetails: ${JSON.stringify(result.details, null, 2)}`);
      }
    } catch (error) {
      console.error('VAPID key test failed:', error);
      alert(`❌ VAPID key test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showFirebaseConsoleInstructions = () => {
    const instructions = getFirebaseConsoleInstructions();
    let report = `📋 ${instructions.title}\n\n`;
    
    instructions.steps.forEach((step: any) => {
      report += `${step.step}. ${step.title}\n`;
      report += `   ${step.description}\n\n`;
    });
    
    alert(report);
  };

  const runFirebaseProjectTest = async () => {
    try {
      const results = await testFirebaseProjectConfig();
      console.log('Firebase project test results:', results);
      
      let report = `🔧 FIREBASE PROJECT CONFIGURATION TEST\n\n`;
      report += `Project ID: ${results.projectId}\n`;
      report += `Messaging Sender ID: ${results.messagingSenderId}\n`;
      report += `Domain: ${results.domain}\n`;
      report += `VAPID Key: ${results.vapidKey.present ? 'Present' : 'Missing'}\n`;
      report += `VAPID Length: ${results.vapidKey.length}\n`;
      report += `VAPID Format: ${results.vapidKey.startsWithB ? 'Correct' : 'Incorrect'}\n\n`;
      
      if (results.allGood) {
        report += `✅ All configuration looks good!\n\n`;
        report += `If you're still getting errors, the issue is likely in Firebase Console:\n`;
        report += `1. Cloud Messaging API not enabled\n`;
        report += `2. Domain not authorized\n`;
        report += `3. VAPID key mismatch in Firebase Console\n`;
      } else {
        report += `❌ Issues found:\n`;
        results.issues.forEach((issue: string, index: number) => {
          report += `${index + 1}. ${issue}\n`;
        });
      }
      
      alert(report);
    } catch (error) {
      console.error('Firebase project test failed:', error);
      alert(`❌ Firebase project test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showFirebaseConsoleChecklist = () => {
    const checklist = getFirebaseConsoleChecklist();
    let report = `📋 ${checklist.title}\n\n`;
    
    checklist.steps.forEach((step: any) => {
      const critical = step.critical ? ' 🔴' : ' 🔵';
      report += `${step.step}.${critical} ${step.title}\n`;
      report += `   ${step.description}\n\n`;
    });
    
    alert(report);
  };

  const checkFirebaseAuth = async () => {
    try {
      const authConfig = await checkFirebaseAuthConfig();
      console.log('Firebase Auth config:', authConfig);
      
      let report = `🔐 FIREBASE AUTHENTICATION CONFIG\n\n`;
      report += `Auth Domain: ${authConfig.authDomain}\n`;
      report += `Current Domain: ${authConfig.currentDomain}\n`;
      report += `Domain Match: ${authConfig.domainMatch ? '✅ Yes' : '❌ No'}\n`;
      report += `Auth Initialized: ${authConfig.authInitialized ? '✅ Yes' : '❌ No'}\n\n`;
      
      if (authConfig.error) {
        report += `❌ Error: ${authConfig.error}\n\n`;
      }
      
      if (authConfig.issues.length > 0) {
        report += `⚠️ Issues:\n`;
        authConfig.issues.forEach((issue: string) => {
          report += `  - ${issue}\n`;
        });
        report += '\n';
      }
      
      if (authConfig.domainMatch && authConfig.authInitialized) {
        report += `✅ Firebase Auth looks good!\n`;
        report += `The authorized domains should be automatically handled.\n`;
      } else {
        report += `⚠️ You may need to add authorized domains manually.\n`;
        report += `Check the Firebase Console instructions.\n`;
      }
      
      alert(report);
    } catch (error) {
      console.error('Firebase Auth check failed:', error);
      alert(`❌ Firebase Auth check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const showFirebaseAuthInstructions = () => {
    const instructions = getFirebaseAuthInstructions();
    let report = `📋 ${instructions.title}\n\n`;
    
    instructions.steps.forEach((step: any) => {
      const critical = step.critical ? ' 🔴' : ' 🔵';
      report += `${step.step}.${critical} ${step.title}\n`;
      report += `   ${step.description}\n\n`;
    });
    
    alert(report);
  };

  const runComprehensivePushTestLocal = async () => {
    try {
      setIsLoading(true);
      const results = await runComprehensivePushTest();
      console.log('Comprehensive push test results:', results);
      
      let report = `🚀 COMPREHENSIVE PUSH NOTIFICATION TEST\n\n`;
      report += `Progress: ${results.step}/${results.totalSteps}\n`;
      report += `Success: ${results.success ? '✅ Yes' : '❌ No'}\n\n`;
      
      // Show step details
      for (let i = 1; i <= results.step; i++) {
        const stepDetail = results.details[`step${i}`];
        if (stepDetail) {
          report += `Step ${i}: ${stepDetail}\n`;
        }
      }
      
      if (results.success) {
        report += `\n✅ ALL TESTS PASSED!\n`;
        report += `FCM Token: ${results.details.fcmToken}\n`;
        report += `Token Length: ${results.details.fcmTokenLength}\n`;
        report += `\nPush notifications should work correctly now!`;
      } else {
        report += `\n❌ TEST FAILED AT STEP ${results.step}\n`;
        if (results.errors.length > 0) {
          const lastError = results.errors[results.errors.length - 1];
          report += `Error: ${lastError.error}\n`;
          report += `Details: ${lastError.details}\n`;
        }
        
        // Get troubleshooting steps
        const troubleshooting = getPushNotificationTroubleshooting(results);
        report += `\n🔧 TROUBLESHOOTING STEPS:\n`;
        troubleshooting.steps.forEach((step: any) => {
          report += `${step.step} ${step.title}\n`;
          report += `   ${step.description}\n`;
          report += `   Action: ${step.action}\n\n`;
        });
      }
      
      alert(report);
    } catch (error) {
      console.error('Comprehensive push test failed:', error);
      alert(`❌ Comprehensive push test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runVapidTest = async () => {
    try {
      setIsLoading(true);
      const results = await testVapidSetup();
      console.log('VAPID test results:', results);
      
      let report = `🔑 VAPID SETUP TEST\n\n`;
      report += `Progress: ${results.step}/${results.totalSteps}\n`;
      report += `Success: ${results.success ? '✅ Yes' : '❌ No'}\n\n`;
      
      // Show step details
      for (let i = 1; i <= results.step; i++) {
        const stepDetail = results.details[`step${i}`];
        if (stepDetail) {
          report += `Step ${i}: ${stepDetail}\n`;
        }
      }
      
      if (results.success) {
        report += `\n✅ VAPID SETUP LOOKS GOOD!\n`;
        if (results.details.vapidKeyPresent) {
          report += `VAPID Key: ${results.details.vapidKeyPreview}\n`;
          report += `Key Length: ${results.details.vapidKeyLength}\n`;
        }
        if (results.details.alreadySubscribed) {
          report += `Already Subscribed: Yes\n`;
          report += `Endpoint: ${results.details.subscriptionEndpoint}\n`;
        } else {
          report += `Already Subscribed: No\n`;
        }
        report += `\nYou can now test push notifications!`;
      } else {
        report += `\n❌ VAPID SETUP FAILED AT STEP ${results.step}\n`;
        if (results.errors.length > 0) {
          const lastError = results.errors[results.errors.length - 1];
          report += `Error: ${lastError.error}\n`;
          report += `Details: ${lastError.details}\n`;
        }
        
        report += `\n🔧 NEXT STEPS:\n`;
        report += `1. Add VAPID keys to environment variables\n`;
        report += `2. Deploy the updated code\n`;
        report += `3. Test again\n`;
      }
      
      alert(report);
    } catch (error) {
      console.error('VAPID test failed:', error);
      alert(`❌ VAPID test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showVapidInstructions = () => {
    const instructions = getVapidInstructions();
    let report = `📋 ${instructions.title}\n\n`;
    
    instructions.steps.forEach((step: any) => {
      const critical = step.critical ? ' 🔴' : ' 🔵';
      report += `${step.step}.${critical} ${step.title}\n`;
      report += `   ${step.description}\n\n`;
    });
    
    alert(report);
  };

  const runComprehensiveDiagnostics = async () => {
    try {
      setIsLoading(true);
      const diagnostics = await runFirebaseDiagnostics();
      console.log('Comprehensive diagnostics:', diagnostics);
      
      // Create a detailed report
      let report = '🔍 FIREBASE DIAGNOSTICS REPORT\n\n';
      
      // Environment
      report += `📱 Environment: ${diagnostics.environment.nodeEnv}\n`;
      report += `🌐 User Agent: ${diagnostics.environment.userAgent.substring(0, 50)}...\n\n`;
      
      // Firebase Config
      report += `🔥 Firebase Project: ${diagnostics.firebase.config.projectId}\n`;
      report += `📧 Messaging Sender ID: ${diagnostics.firebase.config.messagingSenderId}\n`;
      report += `🔑 VAPID Key: ${diagnostics.firebase.vapidKey.present ? 'Present' : 'Missing'}\n`;
      report += `📏 VAPID Length: ${diagnostics.firebase.vapidKey.length}\n`;
      report += `✅ VAPID Format: ${diagnostics.firebase.vapidKey.startsWithB ? 'Correct' : 'Incorrect'}\n\n`;
      
      // Browser Support
      report += `🔧 Service Worker Support: ${diagnostics.browser.serviceWorker ? 'Yes' : 'No'}\n`;
      report += `🔔 Notification Support: ${diagnostics.browser.notifications ? 'Yes' : 'No'}\n`;
      report += `📋 Permission: ${diagnostics.browser.permission}\n\n`;
      
      // Service Worker
      if (diagnostics.serviceWorker) {
        report += `⚙️ Service Worker:\n`;
        report += `  - Exists: ${diagnostics.serviceWorker.exists}\n`;
        report += `  - Active: ${diagnostics.serviceWorker.active}\n`;
        report += `  - Controller: ${diagnostics.serviceWorker.controller}\n`;
        report += `  - State: ${diagnostics.serviceWorker.state}\n\n`;
      }
      
      // FCM Test
      if (diagnostics.fcmTest) {
        report += `🚀 FCM Test: ${diagnostics.fcmTest.success ? 'SUCCESS' : 'FAILED'}\n`;
        if (diagnostics.fcmTest.success) {
          report += `  - Token Length: ${diagnostics.fcmTest.tokenLength}\n`;
          report += `  - Token Preview: ${diagnostics.fcmTest.tokenPreview}\n`;
        } else {
          report += `  - Error: ${diagnostics.fcmTest.error}\n`;
          report += `  - Error Type: ${diagnostics.fcmTest.errorType}\n`;
        }
        report += '\n';
      }
      
      // Network
      if (diagnostics.network) {
        report += `🌐 Network: FCM Reachable: ${diagnostics.network.fcmReachable ? 'Yes' : 'No'}\n\n`;
      }
      
      // Errors
      if (diagnostics.errors.length > 0) {
        report += `❌ ERRORS:\n`;
        diagnostics.errors.forEach((error: string, index: number) => {
          report += `  ${index + 1}. ${error}\n`;
        });
      }
      
      // Add VAPID verification
      const vapidVerification = await verifyVapidKeyWithProject();
      report += `\n🔑 VAPID VERIFICATION:\n`;
      report += `  - Valid: ${vapidVerification.valid ? 'Yes' : 'No'}\n`;
      if (vapidVerification.valid) {
        report += `  - Message: ${vapidVerification.message}\n`;
        report += `  - Next Steps:\n`;
        vapidVerification.nextSteps?.forEach((step: string) => {
          report += `    ${step}\n`;
        });
      } else {
        report += `  - Error: ${vapidVerification.error}\n`;
        report += `  - Suggestion: ${vapidVerification.suggestion}\n`;
      }
      
      alert(report);
    } catch (error) {
      console.error('Diagnostics failed:', error);
      alert(`❌ Diagnostics failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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

            {/* Environment Variables Check */}
            <EnvironmentChecker />

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-600 flex-wrap">
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
                onClick={forceServiceWorkerControl}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Force Service Worker Control
              </button>
              <button
                onClick={runFirebaseProjectTest}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
              >
                🔍 Test Project Config
              </button>
              <button
                onClick={showFirebaseConsoleChecklist}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                📋 Firebase Console Checklist
              </button>
              <button
                onClick={checkFirebaseAuth}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
              >
                🔐 Check Firebase Auth
              </button>
              <button
                onClick={showFirebaseAuthInstructions}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
              >
                📋 Auth Setup Guide
              </button>
              <button
                onClick={runComprehensivePushTestLocal}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
              >
                🚀 Comprehensive Push Test
              </button>
              <button
                onClick={runVapidTest}
                className="px-4 py-2 bg-lime-500 hover:bg-lime-600 text-white rounded-lg transition-colors"
              >
                🔑 Test VAPID Setup
              </button>
              <button
                onClick={showVapidInstructions}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
              >
                📋 VAPID Instructions
              </button>
              <button
                onClick={testVapidKeyConfig}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Test VAPID Key
              </button>
              <button
                onClick={runComprehensiveDiagnostics}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
              >
                🔍 Run Full Diagnostics
              </button>
              <button
                onClick={showFirebaseConsoleInstructions}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                📋 Firebase Console Guide
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