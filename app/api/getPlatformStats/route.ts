import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { fetchTokenPrice } from '@/lib/config';

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
      if (orderData.remainingAmount && orderData.markupPercentage && orderData.tokenSymbol) {
        try {
          // Always fetch the price in USD, regardless of the order's fiat currency
          const marketPrice = await fetchTokenPrice(orderData.tokenSymbol, 'USD');
          // Calculate final price with markup
          const finalPrice = marketPrice * (1 + orderData.markupPercentage / 100);
          // Calculate the total value of this order's remaining amount in USD
          const orderValue = orderData.remainingAmount * finalPrice;
          totalAssetsValue += orderValue;
        } catch (error) {
          console.error(`Failed to fetch USD price for ${orderData.tokenSymbol}:`, error);
          // Skip this order if we can't get the price
        }
      }
    }

    // Calculate 24h volume from trades (in USD, using stored usdValue if available)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let volume24h = 0;
    const recentTradesSnapshot = await dbAdmin.collection('trades')
      .where('createdAt', '>=', twentyFourHoursAgo)
      .where('status', 'in', ['RELEASED', 'FIAT_PAID'])
      .get();
    for (const doc of recentTradesSnapshot.docs) {
      const tradeData = doc.data();
      if (typeof tradeData.usdValue === 'number') {
        volume24h += tradeData.usdValue;
      } else if (tradeData.amount && tradeData.tokenSymbol) {
        try {
          // Fallback for legacy trades: fetch current USD price
          const marketPrice = await fetchTokenPrice(tradeData.tokenSymbol, 'USD');
          const tradeValueUSD = parseFloat(tradeData.amount) * marketPrice;
          volume24h += tradeValueUSD;
        } catch (error) {
          console.error(`Failed to fetch USD price for ${tradeData.tokenSymbol}:`, error);
        }
      }
    }

    // Calculate all-time volume from all trades (in USD, using stored usdValue if available)
    let allTimeVolume = 0;
    const allTradesSnapshot = await dbAdmin.collection('trades')
      .where('status', 'in', ['RELEASED', 'FIAT_PAID'])
      .get();
    for (const doc of allTradesSnapshot.docs) {
      const tradeData = doc.data();
      if (typeof tradeData.usdValue === 'number') {
        allTimeVolume += tradeData.usdValue;
      } else if (tradeData.amount && tradeData.tokenSymbol) {
        try {
          // Fallback for legacy trades: fetch current USD price
          const marketPrice = await fetchTokenPrice(tradeData.tokenSymbol, 'USD');
          const tradeValueUSD = parseFloat(tradeData.amount) * marketPrice;
          allTimeVolume += tradeValueUSD;
        } catch (error) {
          console.error(`Failed to fetch USD price for ${tradeData.tokenSymbol}:`, error);
        }
      }
    }

    const stats = {
      allTimeVolume: Math.round(allTimeVolume * 100) / 100,
      assetsOnPlatform: Math.round(totalAssetsValue * 100) / 100, // Round to 2 decimal places
      volume24h: Math.round(volume24h * 100) / 100, // Round to 2 decimal places
    };

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('Failed to fetch platform stats:', error);
    return NextResponse.json({ error: 'Failed to fetch platform stats' }, { status: 500 });
  }
} 