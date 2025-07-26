import { NextRequest, NextResponse } from 'next/server';
import { fetchTokenPrice } from '@/lib/config';

// Simple in-memory cache for API responses
const cache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 1 minute cache
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

// Rate limiting for external API calls
let lastApiCall = 0;

async function getCachedPrice(key: string, fetchFn: () => Promise<number>): Promise<number> {
    const now = Date.now();
    const cached = cache.get(key);
    
    // Return cached value if still valid
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.price;
    }
    
    // Rate limiting: ensure minimum delay between API calls
    const timeSinceLastCall = now - lastApiCall;
    if (timeSinceLastCall < RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastCall));
    }
    
    try {
        const price = await fetchFn();
        lastApiCall = Date.now();
        
        // Cache the result
        cache.set(key, { price, timestamp: now });
        return price;
    } catch (error) {
        // If API fails, return cached value if available
        if (cached) {
            console.warn('API failed, using cached value:', error);
            return cached.price;
        }
        throw error;
    }
}

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
        
        const cacheKey = `USD_${currency}`;
        
        try {
            const price = await getCachedPrice(cacheKey, async () => {
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
                return rate;
            });
            
            return NextResponse.json({ price });
        } catch (error) {
            console.error('API Error fetching USD rate:', error);
            // Return a fallback response instead of error
            return NextResponse.json({ 
                price: 1, // Fallback to 1:1 rate
                warning: 'Using fallback rate due to API unavailability'
            });
        }
    }

    // Token price fetching
    const cacheKey = `${tokenSymbol}_${currency}`;
    
    try {
        const price = await getCachedPrice(cacheKey, async () => {
            return await fetchTokenPrice(tokenSymbol, currency);
        });
        
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