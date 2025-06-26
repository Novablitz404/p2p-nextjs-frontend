'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { TradePlan, MatchedOrder } from '@/types/index';
import { HelpCircle } from 'lucide-react';
import Spinner from '../ui/Spinner';
import Tooltip from '../ui/Tooltip'; // We will use our updated tooltip

interface ProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (finalTradePlan: TradePlan) => void;
    tradePlan: TradePlan | null;
}

const ProposalModal = ({ isOpen, onClose, onConfirm, tradePlan }: ProposalModalProps) => {
    const [liveMarketPrice, setLiveMarketPrice] = useState<number | null>(null);
    const [isPriceLoading, setIsPriceLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !tradePlan || tradePlan.matches.length === 0) {
            return;
        }

        const { tokenSymbol, fiatCurrency } = tradePlan.matches[0];

        const fetchPrice = async () => {
            setIsPriceLoading(false); // Set to false initially
            try {
                const response = await fetch(`/api/getTokenPrice?symbol=${tokenSymbol}&currency=${fiatCurrency}`);
                const data = await response.json();
                setLiveMarketPrice(data.price);
            } catch (error) {
                console.error("Failed to fetch live price:", error);
                setLiveMarketPrice(null);
            } finally {
                setIsPriceLoading(false);
            }
        };
        
        fetchPrice();
        const intervalId = setInterval(fetchPrice, 60000);
        return () => clearInterval(intervalId);
    }, [isOpen, tradePlan]);

    const liveCalculatedValues = useMemo(() => {
        if (!liveMarketPrice || !tradePlan) {
            return { totalFiat: 0, avgPrice: 0, finalMatches: [] };
        }

        let totalFiatCost = 0;
        const finalMatches: MatchedOrder[] = tradePlan.matches.map(match => {
            const finalRate = liveMarketPrice * (1 + match.markupPercentage / 100);
            const fiatCost = match.amountToTake * finalRate;
            totalFiatCost += fiatCost;
            return { ...match, price: finalRate, fiatCost: fiatCost };
        });
        
        const avgPrice = tradePlan.totalCrypto > 0 ? totalFiatCost / tradePlan.totalCrypto : 0;
        return { totalFiat: totalFiatCost, avgPrice, finalMatches };
    }, [liveMarketPrice, tradePlan]);

    const { totalFiat, avgPrice, finalMatches } = liveCalculatedValues;
    
    const handleConfirm = () => {
        if (!tradePlan || finalMatches.length === 0) return;
        
        const finalTradePlan: TradePlan = {
            ...tradePlan,
            matches: finalMatches,
            totalFiat,
            avgPrice,
        };
        onConfirm(finalTradePlan);
    };

    if (!tradePlan) return null;

    const { tokenSymbol, fiatCurrency } = tradePlan.matches[0];
    const uniqueSellers = [...new Set(tradePlan.matches.map(m => m.seller))];

    const formatCurrency = (value: number) => {
        // This defensive check ensures we don't try to format non-numbers
        if (typeof value !== 'number' || isNaN(value)) {
            return '...';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: fiatCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Live Trade Proposal">
            <div className="text-center">
                <p className="text-gray-300 mb-2">You are creating a trade for</p>
                <p className="text-5xl font-bold text-white mb-6">{tradePlan.totalCrypto.toFixed(2)} {tokenSymbol}</p>
            </div>

            <div className="my-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">You are trading with:</h4>
                <p className="text-center text-white font-semibold">{uniqueSellers.length} highly-rated seller(s)</p>
            </div>
            
            <div className="bg-slate-900 rounded-lg p-4 space-y-3 border border-slate-700">
                <div className="flex justify-between items-center text-gray-300">
                    <div className="flex items-center gap-1.5">
                        <span>Estimated Fiat Cost</span>
                        <Tooltip text="This is the total amount of money you will need to send to the seller(s) to complete the trade.">
                            <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                        </Tooltip>
                    </div>
                    <span className="font-semibold text-white h-6 flex items-center">
                        {isPriceLoading ? <Spinner /> : `~ ${formatCurrency(totalFiat)}`}
                    </span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                     <div className="flex items-center gap-1.5">
                        <span>Average Price</span>
                        <Tooltip text="This is the effective 'all-in' rate you are paying per token, calculated from the total fiat cost and total crypto amount.">
                            <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                        </Tooltip>
                    </div>
                    <span className="font-semibold text-white h-6 flex items-center">
                        {isPriceLoading ? <Spinner /> : `${formatCurrency(avgPrice)} / ${tokenSymbol}`}
                    </span>
                </div>
                <div className="text-xs text-center text-emerald-400 animate-pulse pt-2">
                    Price updates with the market. Final price is locked on confirmation.
                </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
                <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-slate-600 hover:bg-slate-500 font-semibold">Cancel</button>
                <button onClick={handleConfirm} disabled={isPriceLoading || !liveMarketPrice} className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                    Confirm & Lock Price
                </button>
            </div>
        </Modal>
    );
};

export default ProposalModal;