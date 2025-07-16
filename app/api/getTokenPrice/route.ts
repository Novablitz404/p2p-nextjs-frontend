import { NextRequest, NextResponse } from 'next/server';
import { fetchTokenPrice } from '@/lib/config';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tokenSymbol = searchParams.get('symbol');
    const currency = searchParams.get('currency')?.toLowerCase(); // ADD: Get currency from request

    if (!tokenSymbol || !currency) {
        return NextResponse.json({ error: 'Token symbol and currency are required.' }, { status: 400 });
    }

    // Special case: USD to fiat
    if (tokenSymbol.toUpperCase() === 'USD') {
        if (currency.toUpperCase() === 'USD') {
            return NextResponse.json({ price: 1 });
        }
        try {
            // Use CoinGecko to get USD to currency rate
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=usd&vs_currencies=${currency}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch USD rate');
            const data = await res.json();
            const rate = data.usd?.[currency];
            if (!rate) throw new Error('No rate found');
            return NextResponse.json({ price: rate });
        } catch (error) {
            console.error('API Error fetching USD rate:', error);
            return NextResponse.json({ error: 'Failed to fetch USD rate.' }, { status: 500 });
        }
    }

    try {
        const price = await fetchTokenPrice(tokenSymbol, currency);
        return NextResponse.json({ price });

    } catch (error) {
        console.error('API Error fetching token price:', error);
        return NextResponse.json({ error: 'Failed to fetch token price.' }, { status: 500 });
    }
}