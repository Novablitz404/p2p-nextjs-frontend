'use client';

import { useState, useEffect, useMemo } from 'react';
import Spinner from '../ui/Spinner';
import { Order } from '@/types';
import { Trash2 } from 'lucide-react';

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
        <div className={`bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-3`}>
           <div className="flex justify-between items-start">
               <div>
                   <span className="font-bold text-lg text-white">
                       Selling: {order.totalAmount.toLocaleString()} {order.tokenSymbol}
                   </span>
                   
                   <div className="text-sm">
                       {/* --- THIS IS THE FIX --- */}
                       {/* We check the status before rendering the value */}
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

               <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${currentStatus.pill}`}>
                   {currentStatus.text}
               </span>
           </div>

           <p className="text-sm text-gray-400">
               Accepting: {order.paymentMethods.join(', ')}
           </p>

           <div>
               <div className="w-full bg-slate-700 rounded-full h-2">
                 <div className="bg-red-500 h-2 rounded-full" style={{ width: `${filledPercentage}%` }}></div>
               </div>
               <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                   <span>Filled: {(order.totalAmount - order.remainingAmount).toFixed(2)}</span>
                   <span>Remaining: {order.remainingAmount.toFixed(2)}</span>
               </div>
           </div>

           <div className="!mt-4 pt-3 border-t border-slate-700/50 min-h-[40px] flex items-center justify-center gap-2">
               {order.status === 'PENDING' && order.orderType === 'ERC20' && onFund &&
                   <button 
                       onClick={onFund} 
                       disabled={isProcessing} 
                       className="w-full text-sm font-semibold py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 flex justify-center items-center"
                   >
                       {isProcessing ? <Spinner text="Processing..."/> : "Fund Escrow"}
                   </button>
               }
               {(order.status === 'OPEN' || order.status === 'PENDING') && onCancelOrder &&
                    <button 
                       onClick={onCancelOrder} 
                       disabled={isProcessing} 
                       className="w-full text-sm font-semibold py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/40 disabled:opacity-50 flex justify-center items-center"
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