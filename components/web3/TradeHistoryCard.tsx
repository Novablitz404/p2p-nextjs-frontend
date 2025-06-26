'use client';

import { Trade } from '@/types';
import { ExternalLink, MessageSquarePlus } from 'lucide-react';
import { DEFAULT_CHAIN_ID, SUPPORTED_NETWORKS } from '@/constants';

interface TradeHistoryCardProps {
    trade: Trade;
    currentUserAddress: string;
    onLeaveReview: (trade: Trade) => void;
}

const TradeHistoryCard = ({ trade, currentUserAddress, onLeaveReview }: TradeHistoryCardProps) => {
    const isBuyer = trade.buyer.toLowerCase() === currentUserAddress.toLowerCase();

    // --- Renders a badge based on the trade's final status ---
    const statusInfo: { [key: string]: { text: string; pill: string; } } = {
        RELEASED: { text: 'Completed', pill: 'bg-green-500/20 text-green-400' },
        CANCELED: { text: 'Canceled', pill: 'bg-slate-600 text-slate-400' },
    };
    const currentStatus = statusInfo[trade.status] || { text: trade.status, pill: 'bg-gray-700' };

    // --- Dynamically generate the correct block explorer URL ---
    const explorerUrl = SUPPORTED_NETWORKS.find(n => n.chainId === DEFAULT_CHAIN_ID)?.blockExplorerUrls[0];

    // --- Determine which transaction hash to use ---
    let transactionHash: string | null | undefined = null;
    let linkText = "View Transaction";

    if (trade.status === 'RELEASED' && trade.releaseTxHash) {
        transactionHash = trade.releaseTxHash;
    } else if (trade.status === 'CANCELED' && trade.cancellationTxHash) {
        transactionHash = trade.cancellationTxHash;
        linkText = "View Cancellation Tx";
    }

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col justify-between">
            <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-bold text-white">
                            {isBuyer ? 'Bought' : 'Sold'}: {trade.amount} {trade.tokenSymbol}
                        </p>
                        <p className="text-xs text-gray-400">
                           {trade.createdAt ? trade.createdAt.toDate().toLocaleString() : '...'}
                        </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${currentStatus.pill}`}>
                        {currentStatus.text}
                    </span>
                </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-700/50 flex items-center justify-center gap-4">
                {/* --- This link now works for both Completed and Canceled trades --- */}
                {explorerUrl && transactionHash && (
                    <a href={`${explorerUrl}/tx/${transactionHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                        {linkText} <ExternalLink size={14} className="ml-1.5" />
                    </a>
                )}
                
                {isBuyer && trade.status === 'RELEASED' && !trade.reviewLeft && (
                    <button onClick={() => onLeaveReview(trade)} className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors">
                        Leave a Review <MessageSquarePlus size={14} className="ml-1.5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TradeHistoryCard;