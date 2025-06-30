import { NextRequest, NextResponse } from 'next/server';

const coinIdMap: { [symbol: string]: string } = {
    'ETH': 'ethereum',
    'USDT': 'tether',
    'USDC': 'usd-coin',
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const tokenSymbol = searchParams.get('symbol');
    const currency = searchParams.get('currency')?.toLowerCase(); // ADD: Get currency from request

    if (!tokenSymbol || !currency) {
        return NextResponse.json({ error: 'Token symbol and currency are required.' }, { status: 400 });
    }

    const coinId = coinIdMap[tokenSymbol];
    if (!coinId) {
        return NextResponse.json({ error: `Token symbol '${tokenSymbol}' is not supported.` }, { status: 404 });
    }

    // UPDATE: Use the currency in the API call
    const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${currency}`;

    try {
        const response = await fetch(coingeckoUrl, {
            next: { revalidate: 60 }
        });

        if (!response.ok) {
            throw new Error(`CoinGecko API responded with status ${response.status}`);
        }

        const data = await response.json();
        const price = data[coinId]?.[currency]; // UPDATE: Get price for the specific currency

        if (price === undefined) {
            throw new Error(`Price for '${coinId}' in '${currency}' not found.`);
        }

        return NextResponse.json({ price });

    } catch (error) {
        console.error('API Error fetching token price:', error);
        return NextResponse.json({ error: 'Failed to fetch token price.' }, { status: 500 });
    }
}