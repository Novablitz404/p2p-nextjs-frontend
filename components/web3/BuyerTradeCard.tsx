'use client';

import React, { useState, useEffect } from 'react';
import { Trade } from '@/types';


interface BuyerTradeCardProps {
    trade: Trade;
    releaseTimeout: number | null;
    isProcessing: boolean;
    onClick?: () => void;
}

const BuyerTradeCard = ({ trade, releaseTimeout, isProcessing, onClick }: BuyerTradeCardProps) => {
    // The internal logic for countdown and status info remains useful for display
    const [isDisputable, setIsDisputable] = useState(false);
    const [countdown, setCountdown] = useState('');

    // This effect manages the countdown timer for the buyer's dispute button
    useEffect(() => {
        // Only run the timer if the trade is in the FIAT_PAID state
        if (trade.status !== 'FIAT_PAID' || releaseTimeout === null) {
            setIsDisputable(false);
            return;
        }

        const deadline = (trade.createdAt.seconds + releaseTimeout) * 1000;
        const intervalId = setInterval(() => {
            const timeLeft = deadline - Date.now();
            if (timeLeft <= 0) {
                setIsDisputable(true);
                setCountdown("Ready to dispute");
                clearInterval(intervalId);
            } else {
                const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
                const seconds = Math.floor((timeLeft / 1000) % 60);
                setCountdown(`${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [trade.status, trade.createdAt, releaseTimeout]);

    const getStatusInfo = () => {
        switch (trade.status) {
            case 'LOCKED':
                return { text: 'Awaiting Your Payment', pill: 'bg-blue-500/20 text-blue-400' };
            case 'FIAT_PAID':
                return { text: 'Waiting for Seller to Release', pill: 'bg-yellow-500/20 text-yellow-400' };
            case 'REQUESTING_SCREENSHOT':
                return { text: 'New Screenshot Requested', pill: 'bg-orange-500/20 text-orange-400' };
            default:
                return { text: trade.status, pill: 'bg-gray-700' };
        }
    };
    const currentStatus = getStatusInfo();

    return (
        <div 
            onClick={onClick} 
            className={`bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3 ${onClick ? 'cursor-pointer hover:border-emerald-500/50 transition-all' : ''}`}
        >
            <div className="flex justify-between items-start">
                <h3 className="font-semibold text-white">
                    Buying {trade.amount} {trade.tokenSymbol}
                </h3>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${currentStatus.pill}`}>
                    {currentStatus.text}
                </span>
            </div>
            <p className="text-sm text-gray-400">Seller: <span className="font-mono">{trade.seller.substring(0, 10)}...</span></p>

            {/* --- THIS IS THE CHANGE: The entire button container div has been deleted --- */}
        </div>
    );
};

export default BuyerTradeCard;