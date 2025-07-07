'use client';

import { Order } from '@/types';
import { ArrowRight, Zap, TrendingUp, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import Spinner from './Spinner';
import TokenLogo from './TokenLogo';

interface PublicOrderCardProps {
    order: Order;
}

const currencySymbols: { [key: string]: string } = {
    PHP: '₱',
    USD: '$',
    EUR: '€',
    THB: '฿',
    IDR: 'Rp',
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
        <div className="group bg-gradient-to-br from-slate-800/50 to-slate-800/30 p-6 rounded-2xl border border-slate-700/50 flex flex-col justify-between space-y-6 transition-all duration-300 hover:border-emerald-500/50 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-emerald-500/10 hover:scale-105 backdrop-blur-sm">
            {/* Header */}
                <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                            <TokenLogo symbol={order.tokenSymbol} address={order.tokenAddress} className="h-8 w-8 rounded-full bg-slate-700 ring-2 ring-slate-600" size={32} />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
                        </div>
                        <span className="text-sm text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            {order.tokenSymbol}
                       </span>
                    </div>
                    
                    <h3 className="font-bold text-xl text-white mb-2">
                        {order.remainingAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} {order.tokenSymbol}
                    </h3>
                    
                    <div className="text-sm text-gray-400 flex items-center">
                        {isPriceLoading ? (
                            <div className="flex items-center">
                                <Spinner />
                                <span className="ml-2">Loading price...</span>
                            </div>
                        ) : (
                               totalLiveFiatValue !== null ? (
                                    <div className="flex items-center">
                                        <span className="relative flex h-2 w-2 mr-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                    <span className="font-semibold text-white text-lg">
                                            {currencySymbol}{totalLiveFiatValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                        </span>
                                    <span className="text-gray-500 ml-2">total value</span>
                                    </div>
                               ) : (
                                <span className="text-red-400 text-xs">Price unavailable</span>
                               )
                           )}
                       </div>
               </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-cyan-400" />
                        <span className="text-xs text-gray-400 font-medium">Markup</span>
                    </div>
                    <span className="font-bold text-white text-lg">{order.markupPercentage.toFixed(2)}%</span>
                </div>
                
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                    <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={16} className="text-purple-400" />
                        <span className="text-xs text-gray-400 font-medium">Payment</span>
                    </div>
                    <span className="font-bold text-white text-sm">{order.paymentMethods.slice(0, 2).join(', ')}{order.paymentMethods.length > 2 ? '...' : ''}</span>
                </div>
            </div>
            
            {/* Action Button */}
            <Link 
                href="/dapp" 
                className="w-full flex items-center justify-center text-sm px-6 py-4 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/25 transform hover:scale-105"
            >
                <Zap className="w-4 h-4 mr-2" />
                Start Trading
                <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
   );
};

export default PublicOrderCard;