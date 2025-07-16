'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

const DEFAULT_PRICES: TokenPrice[] = [
  { symbol: 'BTC', price: 43250.50, change24h: 2.34, volume24h: 28450000000 },
  { symbol: 'ETH', price: 2650.75, change24h: -1.25, volume24h: 15800000000 },
  { symbol: 'USDT', price: 1.00, change24h: 0.01, volume24h: 45200000000 },
  { symbol: 'BNB', price: 315.20, change24h: 3.45, volume24h: 8900000000 },
  { symbol: 'SOL', price: 98.45, change24h: 5.67, volume24h: 3200000000 },
  { symbol: 'XRP', price: 0.52, change24h: -0.89, volume24h: 2100000000 },
  { symbol: 'ADA', price: 0.48, change24h: 1.23, volume24h: 890000000 },
  { symbol: 'AVAX', price: 35.80, change24h: 4.12, volume24h: 1200000000 },
  { symbol: 'DOT', price: 7.25, change24h: -2.15, volume24h: 450000000 },
  { symbol: 'MATIC', price: 0.85, change24h: 6.78, volume24h: 680000000 },
];

const PriceCarousel = () => {
  const [prices, setPrices] = useState<TokenPrice[]>(DEFAULT_PRICES);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/getTokenPrices');
        if (!response.ok) throw new Error('Failed to fetch token prices');
        const data = await response.json();
        if (Array.isArray(data.prices) && data.prices.length > 0) {
          setPrices(data.prices);
        } else {
          setPrices(DEFAULT_PRICES);
        }
      } catch (error) {
        console.error('Failed to fetch token prices:', error);
        setPrices(DEFAULT_PRICES);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every 60s
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(4)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(1)}B`;
    }
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    }
    return `$${(volume / 1000).toFixed(1)}K`;
  };

  return (
    <div className="relative bg-slate-900/50 border-b border-slate-800/50 backdrop-blur-sm z-20 -mt-4">
      <div className="w-full px-2 sm:px-4">
        <div className="relative overflow-hidden">
          {/* CSS-based infinite scroll animation */}
          <div 
            className="flex gap-2 sm:gap-3 animate-scroll"
            style={{
              animation: 'scroll 30s linear infinite',
              width: 'max-content',
            }}
          >
            {/* Duplicate items for seamless infinite loop */}
            {[...prices, ...prices, ...prices].map((token, index) => (
              <div
                key={`${token.symbol}-${index}`}
                className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-800/50 border border-slate-700/30 rounded-md backdrop-blur-sm"
              >
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{token.symbol[0]}</span>
                  </div>
                  <span className="text-xs font-semibold text-white">{token.symbol}</span>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-white">
                    {formatPrice(token.price)}
                  </span>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {token.change24h >= 0 ? (
                      <TrendingUp className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-red-400" />
                    )}
                    <span className={`text-xs font-medium ${
                      token.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                {/* Volume - hidden on mobile */}
                <div className="hidden lg:block border-l border-slate-700/30 pl-2">
                  <span className="text-xs text-gray-400">Vol</span>
                  <div className="text-xs font-medium text-white">
                    {formatVolume(token.volume24h)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        /* Pause animation on hover for desktop */
        @media (hover: hover) {
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        }
        
        /* Reduce animation speed on mobile for better performance */
        @media (max-width: 768px) {
          .animate-scroll {
            animation-duration: 45s;
          }
        }
      `}</style>
    </div>
  );
};

export default PriceCarousel; 