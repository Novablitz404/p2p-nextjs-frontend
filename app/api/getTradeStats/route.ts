// p2p-nextjs-frontend/app/api/getTradeStats/route.ts

import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { dbAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const todayTimestamp = Timestamp.fromDate(today);
    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

    // Query for completed trades
    const completedQuery = dbAdmin.collection('trades')
      .where('status', '==', 'RELEASED')
      .where('createdAt', '>=', sevenDaysAgoTimestamp)
      .where('createdAt', '<=', todayTimestamp);

    // Query for cancelled trades
    const cancelledQuery = dbAdmin.collection('trades')
      .where('status', '==', 'CANCELED')
      .where('createdAt', '>=', sevenDaysAgoTimestamp)
      .where('createdAt', '<=', todayTimestamp);

    const [completedSnap, cancelledSnap] = await Promise.all([
      completedQuery.get(),
      cancelledQuery.get(),
    ]);

    const completedTrades = completedSnap.docs.map(doc => doc.data());
    const cancelledTrades = cancelledSnap.docs.map(doc => doc.data());

    // Initialize daily data structure
    const dailyData: { [key: string]: { "Completed": number, "Cancelled": number } } = {};

    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyData[key] = { "Completed": 0, "Cancelled": 0 };
    }

    // Tally completed trades
    completedTrades.forEach(trade => {
        const dateKey = (trade.createdAt as Timestamp).toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyData[dateKey]) {
            dailyData[dateKey]["Completed"]++;
        }
    });

    // Tally cancelled trades
    cancelledTrades.forEach(trade => {
        const dateKey = (trade.createdAt as Timestamp).toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dailyData[dateKey]) {
            dailyData[dateKey]["Cancelled"]++;
        }
    });

    const chartData = Object.keys(dailyData)
      .map(date => ({ Date: date, ...dailyData[date] }))
      .reverse();

    return NextResponse.json(chartData);

  } catch (error: any) {
    console.error('Failed to fetch trade stats:', error);
    return NextResponse.json({ error: 'Failed to fetch trade stats' }, { status: 500 });
  }
}