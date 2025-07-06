// Utility to verify VAPID key against Firebase project
export const verifyVapidKeyWithProject = async () => {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  
  console.log('🔍 VAPID Key Verification:');
  console.log('Project ID:', projectId);
  console.log('Messaging Sender ID:', messagingSenderId);
  console.log('VAPID Key starts with:', vapidKey?.substring(0, 20));
  console.log('VAPID Key length:', vapidKey?.length);
  
  // Check if VAPID key format is correct
  if (!vapidKey?.startsWith('B')) {
    return {
      valid: false,
      error: 'VAPID key should start with "B"',
      suggestion: 'Check your Firebase Console → Project Settings → Cloud Messaging → Web Push certificates'
    };
  }
  
  if (vapidKey.length < 80) {
    return {
      valid: false,
      error: 'VAPID key seems too short',
      suggestion: 'Make sure you copied the complete VAPID key from Firebase Console'
    };
  }
  
  // Check if project configuration matches
  if (projectId !== 'p2p-dex-ramp') {
    return {
      valid: false,
      error: 'Project ID mismatch',
      suggestion: 'VAPID key might be from a different Firebase project'
    };
  }
  
  if (messagingSenderId !== '641517280810') {
    return {
      valid: false,
      error: 'Messaging Sender ID mismatch',
      suggestion: 'VAPID key might be from a different Firebase project'
    };
  }
  
  return {
    valid: true,
    message: 'VAPID key format and project configuration look correct',
    nextSteps: [
      '1. Verify in Firebase Console that Cloud Messaging API is enabled',
      '2. Check that your domain (www.rampz.io) is authorized',
      '3. Ensure the VAPID key in Firebase Console matches your .env.local file'
    ]
  };
};

export const getFirebaseConsoleInstructions = () => {
  return {
    title: 'Firebase Console Verification Steps',
    steps: [
      {
        step: 1,
        title: 'Check Cloud Messaging API',
        description: 'Go to Firebase Console → Project Settings → Cloud Messaging → Make sure "Cloud Messaging API" is enabled'
      },
      {
        step: 2,
        title: 'Verify VAPID Key',
        description: 'Go to Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Copy the VAPID key and compare with your .env.local file'
      },
      {
        step: 3,
        title: 'Check Authorized Domains',
        description: 'Go to Firebase Console → Project Settings → General → Your apps → Add your domain (www.rampz.io) to authorized domains'
      },
      {
        step: 4,
        title: 'Verify Project Configuration',
        description: 'Make sure your Firebase project ID is "p2p-dex-ramp" and messaging sender ID is "641517280810"'
      }
    ]
  };
}; 