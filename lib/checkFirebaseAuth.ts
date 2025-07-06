import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

export const checkFirebaseAuthConfig = async () => {
  try {
    // Initialize Firebase if not already done
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
    
    return {
      authDomain: firebaseConfig.authDomain,
      currentDomain,
      domainMatch: firebaseConfig.authDomain === currentDomain,
      authInitialized: !!auth,
      issues: [],
      recommendations: []
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      issues: ['Failed to initialize Firebase Auth'],
      recommendations: []
    };
  }
};

export const getFirebaseAuthInstructions = () => {
  return {
    title: 'Firebase Authentication Setup Instructions',
    steps: [
      {
        step: 1,
        title: 'Enable Authentication',
        description: 'Go to Firebase Console → Authentication → Get started (if not enabled)',
        critical: true
      },
      {
        step: 2,
        title: 'Add Authorized Domains',
        description: 'Go to Authentication → Settings → Authorized domains → Add BOTH "www.rampz.io" AND "p2p-dex-ramp.firebaseapp.com"',
        critical: true
      },
      {
        step: 3,
        title: 'Alternative: Update Environment Variable',
        description: 'Change NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN to "www.rampz.io" in your Vercel environment variables',
        critical: false
      },
      {
        step: 4,
        title: 'Verify Domain Match',
        description: 'Make sure your auth domain matches your website domain',
        critical: false
      }
    ]
  };
}; 