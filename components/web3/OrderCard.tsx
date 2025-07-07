'use client';

import { useState, useEffect, useMemo } from 'react';
import Spinner from '../ui/Spinner';
import { Order } from '@/types';
import { Trash2 } from 'lucide-react';
import TokenLogo from '../ui/TokenLogo';

interface OrderCardProps {
    order: Order;
    onFund?: () => void;
    onCancelOrder?: () => void;
    isProcessing?: boolean;
}

const currencySymbols: { [key: string]: string } = {
    PHP: '₱',
    USD: '$',
    EUR: '€',
    IDR: 'Rp',
};

const OrderCard = ({ order, onFund, onCancelOrder, isProcessing }: OrderCardProps) => {
    const [liveMarketPrice, setLiveMarketPrice] = useState<number | null>(null);
    const [isPriceLoading, setIsPriceLoading] = useState(true);

    useEffect(() => {
        const { tokenSymbol, fiatCurrency } = order;

        const fetchPrice = async () => {
            try {
                const response = await fetch(`/api/getTokenPrice?symbol=${tokenSymbol}&currency=${fiatCurrency}`);
                if (!response.ok) throw new Error('Failed to fetch live price');
                const data = await response.json();
                setLiveMarketPrice(data.price);
            } catch (error) {
                console.error(`Failed to fetch price for ${tokenSymbol}:`, error);
                setLiveMarketPrice(null);
            } finally {
                setIsPriceLoading(false);
            }
        };

        fetchPrice();
        const intervalId = setInterval(fetchPrice, 60000);

        return () => clearInterval(intervalId);
    }, [order.tokenSymbol, order.fiatCurrency]);

    const finalPriceRate = useMemo(() => {
        if (liveMarketPrice === null) return null;
        return liveMarketPrice * (1 + order.markupPercentage / 100);
    }, [liveMarketPrice, order.markupPercentage]);

    const totalLiveFiatValue = useMemo(() => {
        if (finalPriceRate === null) return null;
        // The live value should reflect what's currently available
        return order.remainingAmount * finalPriceRate;
    }, [order.remainingAmount, finalPriceRate]);


    const filledPercentage = order.totalAmount > 0 
        ? ((order.totalAmount - order.remainingAmount) / order.totalAmount) * 100 
        : 0;
    
    const statusInfo: { [key: string]: { text: string; pill: string; } } = {
        PENDING: { text: 'Pending Funds', pill: 'bg-orange-500/20 text-orange-400 border border-orange-500/30'},
        OPEN: { text: 'Open', pill: 'bg-green-500/20 text-green-400 border border-green-500/30' },
        CLOSED: { text: 'Closed', pill: 'bg-red-500/20 text-red-400 border border-red-500/30' },
        CANCELED: { text: 'Canceled', pill: 'bg-slate-600 text-slate-400 border border-slate-500/30' },
    };
    
    const currentStatus = statusInfo[order.status] || {text: order.status, pill: 'text-gray-300 bg-gray-900/80'};
    const currencySymbol = currencySymbols[order.fiatCurrency] || order.fiatCurrency;

    return (
        <div className={[
            "relative bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl p-6 flex flex-col gap-4 transition-all duration-200",
            "hover:shadow-2xl hover:border-emerald-500/30"
        ].join(' ')}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                    <span className="font-bold text-lg text-white block mb-1 flex items-center gap-2">
                        <TokenLogo symbol={order.tokenSymbol} address={order.tokenAddress} className="h-6 w-6 inline-block align-middle mr-1" size={24} />
                        {order.totalAmount.toLocaleString()} {order.tokenSymbol}
                    </span>
                    <div className="text-sm">
                        {order.status === 'CLOSED' ? (
                            <>
                                <span className="text-gray-400">Value: </span>
                                <span className="font-semibold text-white">Sold</span>
                            </>
                        ) : order.status === 'CANCELED' ? (
                            <>
                                <span className="text-gray-400">Value: </span>
                                <span className="font-semibold text-white">Canceled</span>
                            </>
                        ) : (
                            <>
                                <span className="text-gray-400">Price: </span>
                                <span className="font-semibold text-white h-6 inline-flex items-center">
                                    {isPriceLoading ? <Spinner /> : (
                                        totalLiveFiatValue !== null ? (
                                            <>
                                                <span className="relative flex h-2 w-2 mr-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                </span>
                                                {currencySymbol}{totalLiveFiatValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </>
                                        ) : (
                                            <span className="text-red-400 text-xs">Price Unavailable</span>
                                        )
                                    )}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentStatus.pill} shadow-sm uppercase tracking-wide ml-4 mt-1`} style={{minWidth: 70, textAlign: 'center'}}>{currentStatus.text}</span>
            </div>

            <div className="flex flex-wrap gap-2 items-center mb-1">
                <span className="text-xs text-gray-400">Accepting:</span>
                {order.paymentMethods.map((method, idx) => (
                    <span key={method + idx} className="flex items-center gap-1 bg-slate-700/60 text-emerald-300 px-2 py-0.5 rounded-full text-xs font-semibold shadow hover:bg-emerald-500/20 hover:text-emerald-200 transition-all cursor-pointer">
                        {method}
                    </span>
                ))}
            </div>

            <div className="mb-2">
                <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${filledPercentage}%` }}></div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                    <span>Filled: <span className="font-bold text-white">{(order.totalAmount - order.remainingAmount).toFixed(2)}</span></span>
                    <span>Remaining: <span className="font-bold text-white">{order.remainingAmount.toFixed(2)}</span></span>
                </div>
            </div>

            <div className="pt-3 border-t border-slate-700/40 min-h-[40px] flex items-center justify-center gap-2">
                {order.status === 'PENDING' && order.orderType === 'ERC20' && onFund &&
                    <button 
                        onClick={onFund} 
                        disabled={isProcessing} 
                        className="w-full text-sm font-bold py-2 rounded-xl bg-yellow-500/90 text-white hover:bg-yellow-400/90 active:scale-95 transition-all duration-150 shadow-lg disabled:opacity-50 flex justify-center items-center"
                    >
                        {isProcessing ? <Spinner text="Processing..."/> : "Fund Escrow"}
                    </button>
                }
                {(order.status === 'OPEN' || order.status === 'PENDING') && onCancelOrder &&
                    <button 
                        onClick={onCancelOrder} 
                        disabled={isProcessing} 
                        className="w-full text-sm font-bold py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/40 active:scale-95 transition-all duration-150 shadow-lg disabled:opacity-50 flex justify-center items-center"
                    >
                        <Trash2 size={16} className="mr-2"/>
                        {isProcessing ? <Spinner/> : "Cancel Order"}
                    </button>
                }
                {order.status === 'CLOSED' &&
                    <p className="text-center text-xs text-slate-500">This order is fully completed.</p>
                }
                {order.status === 'CANCELED' &&
                    <p className="text-center text-xs text-slate-500">This order was canceled</p>
                }
                {order.status === 'OPEN' && !onCancelOrder &&
                    <p className="text-center text-xs text-slate-500">This order is open on the market.</p>
                }
            </div>
        </div>
    );
};

export default OrderCard;