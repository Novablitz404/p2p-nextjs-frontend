'use client';

import { useState, useEffect } from 'react';
import { Trade } from '@/types';
import Spinner from '../ui/Spinner';

interface TradeCardProps {
    trade: Trade;
    onRelease: (trade: Trade) => void;
    onDispute: (trade: Trade) => void;
    onRequestScreenshot?: (trade: Trade) => void;
    disputeTimeout: number | null;
    isProcessing: boolean;
    onViewProof?: (url: string) => void;
}

// Currency symbol mapping
const currencySymbols: { [key: string]: string } = {
    PHP: '₱',
    USD: '$',
    EUR: '€',
    IDR: 'Rp',
    THB: '฿',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
};

// Format currency with proper comma separators
const formatCurrency = (amount: number, currency: string): string => {
    const symbol = currencySymbols[currency] || currency;
    
    // Special handling for JPY (no decimals)
    if (currency === 'JPY') {
        return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    
    // For other currencies, use 2 decimal places with comma separators
    return `${symbol}${amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })}`;
};

const TradeCard = ({ trade, onRelease, onDispute, onRequestScreenshot, disputeTimeout, isProcessing, onViewProof }: TradeCardProps) => {
    const [isDisputable, setIsDisputable] = useState(false);
    const [countdown, setCountdown] = useState('');
    const [isScreenshotDeadlineElapsed, setIsScreenshotDeadlineElapsed] = useState(false);
    const [screenshotCountdown, setScreenshotCountdown] = useState('');

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

    // Handle screenshot request deadline
    useEffect(() => {
        if (trade.status !== 'REQUESTING_SCREENSHOT' || !trade.screenshotRequestDeadline) {
            setIsScreenshotDeadlineElapsed(false);
            return;
        }

        const deadline = trade.screenshotRequestDeadline.seconds * 1000;
        
        const intervalId = setInterval(() => {
            const timeLeft = deadline - Date.now();

            if (timeLeft <= 0) {
                setIsScreenshotDeadlineElapsed(true);
                setScreenshotCountdown("Deadline elapsed");
                clearInterval(intervalId);
            } else {
                setIsScreenshotDeadlineElapsed(false);
                const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
                const seconds = Math.floor((timeLeft / 1000) % 60);
                setScreenshotCountdown(`${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [trade.status, trade.screenshotRequestDeadline]);

    const statusInfo = {
        LOCKED: { text: 'Waiting for Payment', pill: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
        FIAT_PAID: { text: 'Payment Confirmed', pill: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
        REQUESTING_SCREENSHOT: { text: 'Screenshot Requested', pill: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
    };

    const currentStatus = statusInfo[trade.status as keyof typeof statusInfo] || { text: trade.status, pill: 'bg-gray-700' };
    const fiatAmount = trade.amount * trade.price;

    return (
        <div className={[
            "relative bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl p-6 flex flex-col gap-4 transition-all duration-200",
            trade.status === 'FIAT_PAID' ? 'hover:border-emerald-500/30' : 'hover:border-blue-500/30'
        ].join(' ')}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    {/* Buyer avatar (blockie or initials) */}
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-emerald-300 font-bold text-lg shadow-inner">
                        {trade.buyer ? trade.buyer.slice(2, 4).toUpperCase() : '?'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-base mb-0.5">
                            Trade #{trackingCode}: {trade.amount} {trade.tokenSymbol}
                        </h3>
                        <p className="text-xs text-gray-400">Buyer: <span className="font-mono">{trade.buyer.substring(0, 10)}...{trade.buyer.substring(trade.buyer.length - 4)}</span></p>
                    </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentStatus.pill} shadow-sm uppercase tracking-wide`}>{currentStatus.text}</span>
            </div>

            <div className="text-sm border-t border-slate-700/40 pt-3 mt-2">
                <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="font-semibold text-white">{formatCurrency(trade.price, trade.fiatCurrency)} / {trade.tokenSymbol}</span>
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-gray-400">Receiving:</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(fiatAmount, trade.fiatCurrency)}</span>
                </div>
            </div>

            <div className="!mt-4 pt-3 border-t border-slate-700/40 flex flex-col sm:flex-row gap-2 animate-fade-in">
                {trade.proofOfPaymentURL && onViewProof && (
                    <button
                        onClick={() => onViewProof(trade.proofOfPaymentURL!)}
                        className="w-full text-sm font-semibold py-2 rounded-xl bg-slate-700/80 text-white hover:bg-emerald-500/20 hover:text-emerald-300 active:scale-95 transition-all duration-150 shadow disabled:opacity-50 flex justify-center items-center"
                    >
                        View Screenshot
                    </button>
                )}
                {trade.status === 'FIAT_PAID' && onRequestScreenshot && (
                    <button
                        onClick={() => onRequestScreenshot(trade)}
                        disabled={isProcessing}
                        className="w-full text-sm font-semibold py-2 rounded-xl bg-yellow-600/80 text-yellow-100 hover:bg-yellow-500/80 active:scale-95 transition-all duration-150 shadow disabled:opacity-50 flex justify-center items-center"
                    >
                        Request New Screenshot
                    </button>
                )}
                {trade.status === 'REQUESTING_SCREENSHOT' && onRequestScreenshot && !isScreenshotDeadlineElapsed && (
                    <button
                        onClick={() => onRequestScreenshot(trade)}
                        disabled={isProcessing}
                        className="w-full text-sm font-semibold py-2 rounded-xl bg-yellow-600/80 text-yellow-100 hover:bg-yellow-500/80 active:scale-95 transition-all duration-150 shadow disabled:opacity-50 flex justify-center items-center"
                    >
                        Request New Screenshot ({screenshotCountdown})
                    </button>
                )}
                {trade.status === 'REQUESTING_SCREENSHOT' && isScreenshotDeadlineElapsed && (
                    <button
                        onClick={() => onDispute(trade)}
                        disabled={isProcessing}
                        className="w-full text-sm font-bold py-2 rounded-xl bg-red-600/80 text-red-100 hover:bg-red-500 active:scale-95 transition-all duration-150 shadow-lg disabled:opacity-50 flex justify-center items-center"
                    >
                        {isProcessing ? <Spinner /> : "Dispute"}
                    </button>
                )}
                {trade.status === 'FIAT_PAID' && (
                    <button
                        onClick={() => onRelease(trade)}
                        disabled={isProcessing}
                        className="w-full text-sm font-bold py-2 rounded-xl bg-emerald-500/90 text-white hover:bg-emerald-400/90 active:scale-95 transition-all duration-150 shadow-lg disabled:opacity-50 flex justify-center items-center"
                    >
                        {isProcessing ? <Spinner /> : "Release Funds to Buyer"}
                    </button>
                )}
                {trade.status === 'LOCKED' && (
                    <button
                        onClick={() => onDispute(trade)}
                        disabled={!isDisputable || isProcessing}
                        className="w-full text-xs font-bold py-2 px-1 rounded-xl bg-red-600/80 text-red-100 hover:bg-red-500 active:scale-95 transition-all duration-150 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                    >
                        {isProcessing ? <Spinner /> : (isDisputable ? 'Dispute (Buyer Not Paid)' : `Dispute in: ${countdown}`)}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TradeCard;