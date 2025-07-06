import { NextResponse } from 'next/server';

export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  
  if (!vapidPublicKey) {
    return new NextResponse('VAPID key not configured', { status: 500 });
  }
  
  return new NextResponse(vapidPublicKey, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
} 