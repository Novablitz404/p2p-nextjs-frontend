import { NextResponse } from 'next/server';

export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  
  if (!vapidPublicKey) {
    return NextResponse.json({ 
      success: false, 
      error: 'VAPID key not configured' 
    }, { status: 500 });
  }

  try {
    // Test VAPID key conversion
    const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const rawData = Buffer.from(base64, 'base64');
      return new Uint8Array(rawData);
    };

    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
    
    return NextResponse.json({
      success: true,
      vapidKey: {
        present: true,
        length: vapidPublicKey.length,
        startsWithB: vapidPublicKey.startsWith('B'),
        convertedLength: convertedKey.length,
        preview: vapidPublicKey.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      vapidKey: {
        present: true,
        length: vapidPublicKey.length,
        startsWithB: vapidPublicKey.startsWith('B'),
        preview: vapidPublicKey.substring(0, 20) + '...'
      }
    }, { status: 500 });
  }
} 