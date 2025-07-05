import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Get platform stats from Firestore
    const statsDoc = await dbAdmin.collection('platformConfig').doc('stats').get();
    const platformStats = statsDoc.exists ? statsDoc.data() : { allTimeVolume: 0 };

    // Get real-time counts using Firebase Admin SDK
    const usersSnapshot = await dbAdmin.collection('users').get();
    const completedTradesSnapshot = await dbAdmin.collection('trades').where('status', '==', 'RELEASED').get();
    const activeTradesSnapshot = await dbAdmin.collection('trades').where('status', 'in', ['LOCKED', 'FIAT_PAID', 'DISPUTED']).get();

    // Calculate success rate
    const totalTrades = completedTradesSnapshot.size + activeTradesSnapshot.size;
    const successRate = totalTrades > 0 ? (completedTradesSnapshot.size / totalTrades) * 100 : 0;

    const stats = {
      allTimeVolume: platformStats?.allTimeVolume || 0,
      totalUsers: usersSnapshot.size,
      successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    };

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('Failed to fetch platform stats:', error);
    return NextResponse.json({ error: 'Failed to fetch platform stats' }, { status: 500 });
  }
} 