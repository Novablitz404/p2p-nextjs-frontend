import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Get platform stats from Firestore
    const statsDoc = await dbAdmin.collection('platformConfig').doc('stats').get();
    const platformStats = statsDoc.exists ? statsDoc.data() : { allTimeVolume: 0 };

    // Get real-time counts using Firebase Admin SDK
    const usersSnapshot = await dbAdmin.collection('users').get();
    
    // Calculate total value of all assets currently being traded
    const ordersSnapshot = await dbAdmin.collection('orders').where('status', '==', 'OPEN').get();
    let totalAssetsValue = 0;
    
    // Process each order to calculate its current value
    for (const doc of ordersSnapshot.docs) {
      const orderData = doc.data();
      if (orderData.remainingAmount && orderData.markupPercentage && orderData.tokenSymbol && orderData.fiatCurrency) {
        try {
          // Fetch live market price for this token
          const priceResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/getTokenPrice?symbol=${orderData.tokenSymbol}&currency=${orderData.fiatCurrency}`);
          if (priceResponse.ok) {
            const priceData = await priceResponse.json();
            const marketPrice = priceData.price;
            
            // Calculate final price with markup
            const finalPrice = marketPrice * (1 + orderData.markupPercentage / 100);
            
            // Calculate the total value of this order's remaining amount
            const orderValue = orderData.remainingAmount * finalPrice;
            totalAssetsValue += orderValue;
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${orderData.tokenSymbol}:`, error);
          // Skip this order if we can't get the price
        }
      }
    }

    // Calculate 24h volume from trades
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentTradesSnapshot = await dbAdmin.collection('trades')
      .where('createdAt', '>=', twentyFourHoursAgo)
      .where('status', 'in', ['RELEASED', 'FIAT_PAID'])
      .get();

    let volume24h = 0;
    recentTradesSnapshot.forEach(doc => {
      const tradeData = doc.data();
      if (tradeData.amount && tradeData.price) {
        volume24h += parseFloat(tradeData.amount) * parseFloat(tradeData.price);
      }
    });

    const stats = {
      allTimeVolume: platformStats?.allTimeVolume || 0,
      assetsOnPlatform: Math.round(totalAssetsValue * 100) / 100, // Round to 2 decimal places
      volume24h: Math.round(volume24h * 100) / 100, // Round to 2 decimal places
    };

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('Failed to fetch platform stats:', error);
    return NextResponse.json({ error: 'Failed to fetch platform stats' }, { status: 500 });
  }
} 