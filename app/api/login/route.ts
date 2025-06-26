// p2p-nextjs-frontend/app/api/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { verifyMessage } from 'viem';

// Firebase Admin initialization (no changes needed here)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { address, signature, isSmartWallet } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required.' }, { status: 400 });
    }

    if (isSmartWallet === false) {
      if (!signature) {
          return NextResponse.json({ error: 'Signature is required for standard wallets.' }, { status: 400 });
      }
      
      const message = "Please sign this message to log in to the P2P DEX Ramp.";
      
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message: message,
        signature: signature,
      });

      if (!isValid) {
        return NextResponse.json({ error: 'Signature verification failed.' }, { status: 403 });
      }
    }
    // If isSmartWallet is true or undefined, we trust the connection and proceed.

    const firebaseToken = await admin.auth().createCustomToken(address.toLowerCase());
    return NextResponse.json({ token: firebaseToken });

  } catch (error: any) {
    console.error('Login API error:', error);
    // Provide a more specific error message from the backend
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}