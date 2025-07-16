import { NextResponse } from 'next/server';
import { fetchTokenPrice } from '@/lib/config';

// List of tokens to show in the carousel
const TOKENS = [
  { symbol: 'BTC', coingecko: 'bitcoin' },
  { symbol: 'ETH', coingecko: 'ethereum' },
  { symbol: 'USDT', coingecko: 'tether' },
  { symbol: 'BNB', coingecko: 'binancecoin' },
  { symbol: 'SOL', coingecko: 'solana' },
  { symbol: 'XRP', coingecko: 'ripple' },
  { symbol: 'ADA', coingecko: 'cardano' },
  { symbol: 'AVAX', coingecko: 'avalanche-2' },
  { symbol: 'DOT', coingecko: 'polkadot' },
  { symbol: 'MATIC', coingecko: 'matic-network' },
];

export async function GET() {
  try {
    // Build CoinGecko API URL
    const ids = TOKENS.map(t => t.coingecko).join(',');
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch from CoinGecko');
    const data = await res.json();

    // Map CoinGecko data to our format
    const prices = TOKENS.map(token => {
      const cg = data.find((d: any) => d.id === token.coingecko);
      if (!cg) return null;
      return {
        symbol: token.symbol,
        price: cg.current_price,
        change24h: cg.price_change_percentage_24h,
        volume24h: cg.total_volume,
      };
    }).filter(Boolean);

    return NextResponse.json({ prices });
  } catch (error) {
    return NextResponse.json({ prices: [] }, { status: 500 });
  }
} 