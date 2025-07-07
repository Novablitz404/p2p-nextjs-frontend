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
        <div className={[
            "relative bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl p-6 flex flex-col gap-4 transition-all duration-200",
            "hover:shadow-2xl hover:border-emerald-500/30"
        ].join(' ')}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    {/* Buyer/Seller avatar (blockie or initials) */}
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-emerald-300 font-bold text-lg shadow-inner">
                        {isBuyer ? 'B' : 'S'}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white mb-0.5">
                            {isBuyer ? 'Bought' : 'Sold'}: {trade.amount} {trade.tokenSymbol}
                        </p>
                        <p className="text-xs text-gray-400">
                            {trade.createdAt ? trade.createdAt.toDate().toLocaleString() : '...'}
                        </p>
                    </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${currentStatus.pill} shadow-sm uppercase tracking-wide`}>{currentStatus.text}</span>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-700/40 flex items-center justify-center gap-4">
                {explorerUrl && transactionHash && (
                    <a
                        href={`${explorerUrl}/tx/${transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm font-semibold text-emerald-400 hover:text-emerald-200 hover:underline transition-colors rounded-full px-3 py-1 bg-slate-700/60 shadow"
                    >
                        {linkText} <ExternalLink size={14} className="ml-1.5" />
                    </a>
                )}
                {isBuyer && trade.status === 'RELEASED' && !trade.reviewLeft && (
                    <button
                        onClick={() => onLeaveReview(trade)}
                        className="flex items-center text-sm font-semibold text-blue-400 hover:text-blue-200 hover:underline transition-colors rounded-full px-3 py-1 bg-slate-700/60 shadow"
                    >
                        Leave a Review <MessageSquarePlus size={14} className="ml-1.5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TradeHistoryCard;