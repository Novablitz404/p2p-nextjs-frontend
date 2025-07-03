'use client';

import { Order } from '@/types';
import { ArrowRight, Zap, TrendingUp, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import Spinner from './Spinner';

interface PublicOrderCardProps {
    order: Order;
}

const currencySymbols: { [key: string]: string } = {
    PHP: '₱',
    USD: '$',
    EUR: '€',
    THB: '฿',
};

const PublicOrderCard = ({ order }: PublicOrderCardProps) => {
    const [liveMarketPrice, setLiveMarketPrice] = useState<number | null>(null);
    const [isPriceLoading, setIsPriceLoading] = useState(true);

    useEffect(() => {
        const fetchPrice = async () => {
            if (!liveMarketPrice) {
                setIsPriceLoading(true);
            }
            try {
                const response = await fetch(`/api/getTokenPrice?symbol=${order.tokenSymbol}&currency=${order.fiatCurrency}`);
                if (!response.ok) throw new Error('Price fetch failed');
                const data = await response.json();
                setLiveMarketPrice(data.price);
            } catch (error) {
                console.error(`Failed to fetch price for ${order.tokenSymbol}:`, error);
                setLiveMarketPrice(null);
            } finally {
                setIsPriceLoading(false);
            }
        };

        fetchPrice();
        const intervalId = setInterval(fetchPrice, 60000);
        return () => clearInterval(intervalId);
        
    }, [order.tokenSymbol, order.fiatCurrency, liveMarketPrice]);

    const finalPriceRate = useMemo(() => {
        if (liveMarketPrice === null) return null;
        return liveMarketPrice * (1 + order.markupPercentage / 100);
    }, [liveMarketPrice, order.markupPercentage]);

    const totalLiveFiatValue = useMemo(() => {
        if (finalPriceRate === null) return null;
        return order.remainingAmount * finalPriceRate;
    }, [order.remainingAmount, finalPriceRate]);

    const currencySymbol = currencySymbols[order.fiatCurrency] || order.fiatCurrency;

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col justify-between space-y-3 transition-all hover:border-emerald-500/50 hover:bg-slate-800">
            <div className="mb-2">
                <div className="flex justify-between items-start">
                   <div>
                       <span className="font-bold text-lg text-white">
                           Selling {order.remainingAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} {order.tokenSymbol}
                       </span>
                       <div className="text-sm text-gray-400 h-5 flex items-center mt-1">
                           {isPriceLoading ? <Spinner /> : (
                               totalLiveFiatValue !== null ? (
                                    <div className="flex items-center">
                                        {/* --- THIS IS THE FIX --- */}
                                        <span className="mr-2">Price:</span>
                                        <span className="relative flex h-2 w-2 mr-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="font-semibold text-white">
                                            {currencySymbol}{totalLiveFiatValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </span>
                                    </div>
                               ) : (
                                   <span className="text-red-500 text-xs">Price unavailable</span>
                               )
                           )}
                       </div>
                   </div>
                   <img 
                        src={`https://effigy.im/a/${order.tokenAddress}.svg`} 
                        alt={`${order.tokenSymbol} logo`}
                        className="h-8 w-8 rounded-full bg-slate-700"
                    />
               </div>
            </div>
            
            <div className="!mt-auto pt-3 border-t border-slate-700/50 space-y-3">
                <div className="flex justify-between items-center text-sm text-slate-400">
                     <div className="flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-cyan-400" />
                        <span>Markup: <span className="font-semibold text-white">{order.markupPercentage.toFixed(2)}%</span></span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <CreditCard size={14} className="text-purple-400" />
                        <span className="font-semibold text-white">{order.paymentMethods.join(', ')}</span>
                    </div>
                </div>
                 <Link href="/dapp" className="w-full flex items-center justify-center text-sm px-4 py-2 rounded-lg font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                       Trade <ArrowRight size={16} className="ml-1.5" />
                 </Link>
            </div>
        </div>
   );
};

export default PublicOrderCard;