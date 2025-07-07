import { NextRequest, NextResponse } from 'next/server';
import { fetchTokenPrice } from '@/lib/config';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tokenSymbol = searchParams.get('symbol');
    const currency = searchParams.get('currency')?.toLowerCase(); // ADD: Get currency from request

    if (!tokenSymbol || !currency) {
        return NextResponse.json({ error: 'Token symbol and currency are required.' }, { status: 400 });
    }

    try {
        const price = await fetchTokenPrice(tokenSymbol, currency);
        return NextResponse.json({ price });

    } catch (error) {
        console.error('API Error fetching token price:', error);
        return NextResponse.json({ error: 'Failed to fetch token price.' }, { status: 500 });
    }
}