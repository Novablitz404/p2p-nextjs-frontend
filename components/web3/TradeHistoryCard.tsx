'use client';

import { Trade } from '@/types';
import { MessageSquarePlus, Eye, User, Hash, DollarSign, Calendar } from 'lucide-react';
import { DEFAULT_CHAIN_ID, SUPPORTED_NETWORKS } from '@/constants';
import TokenLogo from '../ui/TokenLogo';
import Modal from '../ui/Modal';
import { useState } from 'react';

interface TradeHistoryCardProps {
    trade: Trade;
    currentUserAddress: string;
    onLeaveReview: (trade: Trade) => void;
    chainId: number;
}

// Currency symbol mapping (same as TradeCard)
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
    
    if (currency === 'JPY') {
        return `${symbol}${Math.round(amount).toLocaleString()}`;
    }
    
    return `${symbol}${amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    })}`;
};

// Helper to shorten transaction hashes
const shortHash = (hash: string) => {
    if (!hash) return '';
    return hash.length > 12 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;
};

const TradeHistoryCard = ({ trade, currentUserAddress, onLeaveReview, chainId }: TradeHistoryCardProps) => {
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const isBuyer = trade.buyer.toLowerCase() === currentUserAddress.toLowerCase();

    // --- Renders a badge based on the trade's final status ---
    const statusInfo: { [key: string]: { text: string; pill: string; } } = {
        RELEASED: { text: 'Completed', pill: 'bg-green-500/20 text-green-400' },
        CANCELED: { text: 'Canceled', pill: 'bg-slate-600 text-slate-400' },
    };
    const currentStatus = statusInfo[trade.status] || { text: trade.status, pill: 'bg-gray-700' };

    // Get block explorer URL for the current chain
    const explorerUrl = SUPPORTED_NETWORKS.find(n => n.chainId === chainId)?.blockExplorerUrls[0];

    const fiatAmount = trade.amount * trade.price;

    return (
        <>
            <div className={[
                "relative bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl p-6 flex flex-col gap-4 transition-all duration-200",
                "hover:shadow-2xl hover:border-emerald-500/30"
            ].join(' ')}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                        {/* Token logo avatar */}
                        <TokenLogo symbol={trade.tokenSymbol} address={trade.tokenAddress} className="w-9 h-9 rounded-full" size={36} />
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
                    <button
                        onClick={() => setIsDetailsModalOpen(true)}
                        className="flex items-center text-sm font-semibold text-gray-400 hover:text-white transition-colors rounded-full px-3 py-1 bg-slate-700/60 shadow hover:bg-slate-600/60"
                    >
                        View Details <Eye size={14} className="ml-1.5" />
                    </button>
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

            {/* Trade Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Trade Details">
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Basic Trade Info */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <div className="flex items-center gap-3 mb-4">
                            <TokenLogo symbol={trade.tokenSymbol} address={trade.tokenAddress} className="w-8 h-8" size={32} />
                            <div>
                                <h3 className="text-lg font-bold text-white">
                                    {isBuyer ? 'Bought' : 'Sold'}: {trade.amount} {trade.tokenSymbol}
                                </h3>
                                <p className="text-sm text-gray-400">Trade #{trade.onChainId}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <DollarSign size={16} className="text-emerald-400" />
                                <div>
                                    <p className="text-gray-400">Price</p>
                                    <p className="font-semibold text-white">{formatCurrency(trade.price, trade.fiatCurrency)} / {trade.tokenSymbol}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign size={16} className="text-emerald-400" />
                                <div>
                                    <p className="text-gray-400">Total Value</p>
                                    <p className="font-semibold text-white">{formatCurrency(fiatAmount, trade.fiatCurrency)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Participants */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                            <User size={16} />
                            Participants
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400">Buyer</p>
                                <p className="font-mono text-sm text-white">{trade.buyer}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Seller</p>
                                <p className="font-mono text-sm text-white">{trade.seller}</p>
                            </div>
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                            <Calendar size={16} />
                            Timeline
                        </h4>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-gray-400">Created</p>
                                <p className="text-sm text-white">
                                    {trade.createdAt ? trade.createdAt.toDate().toLocaleString() : 'N/A'}
                                </p>
                            </div>
                            {trade.fiatSentAt && (
                                <div>
                                    <p className="text-xs text-gray-400">Payment Confirmed</p>
                                    <p className="text-sm text-white">
                                        {trade.fiatSentAt.toDate().toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {trade.disputeRaisedAt && (
                                <div>
                                    <p className="text-xs text-gray-400">Dispute Raised</p>
                                    <p className="text-sm text-white">
                                        {trade.disputeRaisedAt.toDate().toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {trade.disputeResolvedAt && (
                                <div>
                                    <p className="text-xs text-gray-400">Dispute Resolved</p>
                                    <p className="text-sm text-white">
                                        {trade.disputeResolvedAt.toDate().toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transaction Hashes */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                        <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                            <Hash size={16} />
                            Transactions
                        </h4>
                        <div className="space-y-2">
                            {trade.creationTxHash && (
                                <div>
                                    <p className="text-xs text-gray-400">Creation Tx</p>
                                    {explorerUrl ? (
                                        <a
                                            href={`${explorerUrl}/tx/${trade.creationTxHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-xs text-emerald-400 hover:text-emerald-200 hover:underline break-all transition-colors"
                                            title={trade.creationTxHash}
                                        >
                                            {shortHash(trade.creationTxHash)}
                                        </a>
                                    ) : (
                                        <p className="font-mono text-xs text-white break-all">{shortHash(trade.creationTxHash)}</p>
                                    )}
                                </div>
                            )}
                            {trade.releaseTxHash && (
                                <div>
                                    <p className="text-xs text-gray-400">Release Tx</p>
                                    {explorerUrl ? (
                                        <a
                                            href={`${explorerUrl}/tx/${trade.releaseTxHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-xs text-emerald-400 hover:text-emerald-200 hover:underline break-all transition-colors"
                                            title={trade.releaseTxHash}
                                        >
                                            {shortHash(trade.releaseTxHash)}
                                        </a>
                                    ) : (
                                        <p className="font-mono text-xs text-white break-all">{shortHash(trade.releaseTxHash)}</p>
                                    )}
                                </div>
                            )}
                            {trade.cancellationTxHash && (
                                <div>
                                    <p className="text-xs text-gray-400">Cancellation Tx</p>
                                    {explorerUrl ? (
                                        <a
                                            href={`${explorerUrl}/tx/${trade.cancellationTxHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono text-xs text-emerald-400 hover:text-emerald-200 hover:underline break-all transition-colors"
                                            title={trade.cancellationTxHash}
                                        >
                                            {shortHash(trade.cancellationTxHash)}
                                        </a>
                                    ) : (
                                        <p className="font-mono text-xs text-white break-all">{shortHash(trade.cancellationTxHash)}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Info */}
                    {trade.disputeExplanation && (
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">Dispute Explanation</h4>
                            <p className="text-sm text-white whitespace-pre-wrap">{trade.disputeExplanation}</p>
                        </div>
                    )}

                    {trade.arbitratorAddress && (
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <h4 className="text-sm font-semibold text-gray-400 mb-3">Arbitrator</h4>
                            <p className="font-mono text-sm text-white">{trade.arbitratorAddress}</p>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default TradeHistoryCard;