// Test Firebase project configuration
export const testFirebaseProjectConfig = async () => {
  const results: any = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    vapidKey: {
      present: !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      length: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.length,
      startsWithB: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.startsWith('B'),
      preview: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.substring(0, 20) + '...',
    },
    domain: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    issues: []
  };

  // Check for common issues
  if (results.projectId !== 'p2p-dex-ramp') {
    results.issues.push('Project ID mismatch - should be "p2p-dex-ramp"');
  }

  if (results.messagingSenderId !== '641517280810') {
    results.issues.push('Messaging Sender ID mismatch - should be "641517280810"');
  }

  if (!results.vapidKey.present) {
    results.issues.push('VAPID key is missing');
  } else if (!results.vapidKey.startsWithB) {
    results.issues.push('VAPID key should start with "B"');
  } else if (results.vapidKey.length < 80) {
    results.issues.push('VAPID key seems too short');
  }

  if (results.domain !== 'www.rampz.io' && results.domain !== 'rampz.io') {
    results.issues.push(`Domain ${results.domain} might not be authorized in Firebase Console`);
  }

  results.allGood = results.issues.length === 0;

  return results;
};

export const getFirebaseConsoleChecklist = () => {
  return {
    title: 'Firebase Console Configuration Checklist',
    steps: [
      {
        step: 1,
        title: 'Enable Cloud Messaging API',
        description: 'Go to Firebase Console → Project Settings → Cloud Messaging → Enable "Cloud Messaging API"',
        critical: true
      },
      {
        step: 2,
        title: 'Verify VAPID Key',
        description: 'Go to Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Copy the VAPID key and ensure it matches your environment variable',
        critical: true
      },
      {
        step: 3,
        title: 'Add Domain to Authorized Domains',
        description: 'Go to Firebase Console → Project Settings → General → Your apps → Add "www.rampz.io" to authorized domains',
        critical: true
      },
      {
        step: 4,
        title: 'Check Project Configuration',
        description: 'Verify Project ID is "p2p-dex-ramp" and Messaging Sender ID is "641517280810"',
        critical: false
      },
      {
        step: 5,
        title: 'Test with Firebase Console',
        description: 'Try sending a test message from Firebase Console to verify the configuration',
        critical: false
      }
    ]
  };
}; 