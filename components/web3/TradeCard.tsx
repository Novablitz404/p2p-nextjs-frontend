'use client';

import { useState, useEffect } from 'react';
import { Trade } from '@/types';
import Spinner from '../ui/Spinner';

interface TradeCardProps {
    trade: Trade;
    onRelease: (trade: Trade) => void;
    onDispute: (trade: Trade) => void;
    disputeTimeout: number | null;
    isProcessing: boolean;
    onViewProof?: (url: string) => void;
}

const TradeCard = ({ trade, onRelease, onDispute, disputeTimeout, isProcessing, onViewProof }: TradeCardProps) => {
    const [isDisputable, setIsDisputable] = useState(false);
    const [countdown, setCountdown] = useState('');

    const trackingCode = trade.creationTxHash ? 
        `${trade.creationTxHash.slice(-4).toUpperCase()}-${trade.onChainId}` : 
        trade.onChainId;

    useEffect(() => {
        if (trade.status !== 'LOCKED' || disputeTimeout === null) {
            setIsDisputable(false);
            return;
        };

        const deadline = (trade.createdAt.seconds + disputeTimeout) * 1000;
        
        const intervalId = setInterval(() => {
            const timeLeft = deadline - Date.now();

            if (timeLeft <= 0) {
                setIsDisputable(true);
                setCountdown("Ready to dispute");
                clearInterval(intervalId);
            } else {
                setIsDisputable(false);
                const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
                const seconds = Math.floor((timeLeft / 1000) % 60);
                setCountdown(`${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [trade.status, trade.createdAt, disputeTimeout]);

    const statusInfo = {
        LOCKED: { text: 'Waiting for Payment', pill: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
        FIAT_PAID: { text: 'Payment Confirmed', pill: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    };

    const currentStatus = statusInfo[trade.status as keyof typeof statusInfo] || { text: trade.status, pill: 'bg-gray-700' };
    const fiatAmount = trade.amount * trade.price;

    return (
        <div className={`bg-slate-800 p-4 rounded-lg border ${trade.status === 'FIAT_PAID' ? 'border-emerald-500/50' : 'border-blue-500/50'} space-y-3`}>
            <div className="flex justify-between items-start">
                <h3 className="font-semibold text-white">
                    Trade #{trackingCode}: {trade.amount} {trade.tokenSymbol}
                </h3>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${currentStatus.pill}`}>
                    {currentStatus.text}
                </span>
            </div>
            <p className="text-sm text-gray-400">Buyer: <span className="font-mono">{trade.buyer.substring(0, 10)}...{trade.buyer.substring(trade.buyer.length - 4)}</span></p>

            <div className="text-sm border-t border-slate-700/50 pt-3 mt-3">
                <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-semibold text-white">₱{trade.price.toFixed(2)} / {trade.tokenSymbol}</span>
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-gray-400">Receiving:</span>
                    <span className="font-bold text-emerald-400">₱{fiatAmount.toFixed(2)}</span>
                </div>
            </div>

            <div className="!mt-4 pt-3 border-t border-slate-700/50 flex flex-col sm:flex-row gap-2">
                {trade.proofOfPaymentURL && onViewProof && (
                    <button
                        onClick={() => onViewProof(trade.proofOfPaymentURL!)}
                        className="w-full text-sm font-semibold py-2 rounded-lg bg-slate-600 text-white hover:bg-slate-500 disabled:opacity-50 flex justify-center items-center"
                    >
                        View Screenshot
                    </button>
                )}
                
                {trade.status === 'FIAT_PAID' && (
                    <button
                        onClick={() => onRelease(trade)}
                        disabled={isProcessing}
                        className="w-full text-sm font-semibold py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex justify-center items-center"
                    >
                        {isProcessing ? <Spinner /> : "Release Funds to Buyer"}
                    </button>
                )}

                {trade.status === 'LOCKED' && (
                     <button
                        onClick={() => onDispute(trade)}
                        disabled={!isDisputable || isProcessing}
                        className="w-full text-xs font-semibold py-2 px-1 rounded-lg bg-red-600/80 text-red-100 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isProcessing ? <Spinner /> : (isDisputable ? 'Dispute (Buyer Not Paid)' : `Dispute in: ${countdown}`)}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TradeCard;