import { NextRequest, NextResponse } from 'next/server';
import { fetchTokenPrice } from '@/lib/config';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tokenSymbol = searchParams.get('symbol');
    const currency = searchParams.get('currency')?.toLowerCase();

    if (!tokenSymbol || !currency) {
        return NextResponse.json({ error: 'Token symbol and currency are required.' }, { status: 400 });
    }

    // Special case: USD to fiat
    if (tokenSymbol.toUpperCase() === 'USD') {
        if (currency.toUpperCase() === 'USD') {
            return NextResponse.json({ price: 1 });
        }
        try {
            // Use CoinGecko to get USD to currency rate with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=${currency}`;
            const res = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const data = await res.json();
            const rate = data.usd?.[currency];
            if (!rate) throw new Error('No rate found');
            return NextResponse.json({ price: rate });
        } catch (error) {
            console.error('API Error fetching USD rate:', error);
            // Return a fallback response instead of error
            return NextResponse.json({ 
                price: 1, // Fallback to 1:1 rate
                warning: 'Using fallback rate due to API unavailability'
            });
        }
    }

    try {
        const price = await fetchTokenPrice(tokenSymbol, currency);
        return NextResponse.json({ price });

    } catch (error) {
        console.error('API Error fetching token price:', error);
        // Return a fallback response instead of error
        return NextResponse.json({ 
            price: 0, // Fallback price
            warning: 'Using fallback price due to API unavailability'
        });
    }
}