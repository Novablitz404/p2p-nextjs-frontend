// p2p-nextjs-frontend/components/web3/DisputeCard.tsx

'use client';

import { Trade } from '@/types';
import Spinner from '../ui/Spinner';
import { format } from 'date-fns';
import { Clock, User, AlertTriangle } from 'lucide-react';

// This interface now matches the usage in your original DisputesPage
interface DisputeCardProps {
    trade: Trade;
    isProcessing: boolean;
    // The onResolve prop expects a function that takes the winner's address
    onResolve: (winnerAddress: string) => void;
}

const DisputeCard = ({ trade, isProcessing, onResolve }: DisputeCardProps) => {
    const getResolutionTime = () => {
        if (!trade.disputeRaisedAt || !trade.disputeResolvedAt) return null;
        
        const raisedTime = trade.disputeRaisedAt.toDate().getTime();
        const resolvedTime = trade.disputeResolvedAt.toDate().getTime();
        const resolutionTimeMs = resolvedTime - raisedTime;
        
        const hours = Math.floor(resolutionTimeMs / (1000 * 60 * 60));
        const minutes = Math.floor((resolutionTimeMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const resolutionTime = getResolutionTime();

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg text-white">Dispute #{trade.onChainId}</span>
                <span className="text-xs text-gray-400">
                    {trade.disputeRaisedAt ? format(trade.disputeRaisedAt.toDate(), 'PPp') : 'N/A'}
                </span>
            </div>
            
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p><span className="font-semibold text-gray-300">Buyer:</span></p>
                        <p className="font-mono text-gray-400 text-xs">{trade.buyer}</p>
                    </div>
                    <div>
                        <p><span className="font-semibold text-gray-300">Seller:</span></p>
                        <p className="font-mono text-gray-400 text-xs">{trade.seller}</p>
                    </div>
                </div>
                
                <div className="text-sm">
                    <p><span className="font-semibold text-gray-300">Amount:</span> {trade.amount} {trade.tokenSymbol}</p>
                    <p><span className="font-semibold text-gray-300">Raised by:</span> 
                        <span className="text-gray-400 ml-1">
                            {trade.disputeRaisedBy === trade.buyer ? 'Buyer' : 'Seller'}
                        </span>
                    </p>
                </div>

                {/* Dispute Explanation */}
                {trade.disputeExplanation && (
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-semibold text-gray-300">Dispute Reason</span>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{trade.disputeExplanation}</p>
                    </div>
                )}

                {trade.proofOfPaymentURL && (
                    <div className="mt-3">
                        <div className="text-xs text-gray-400 mb-1">Buyer Proof of Payment:</div>
                        <a href={trade.proofOfPaymentURL} target="_blank" rel="noopener noreferrer">
                            <img src={trade.proofOfPaymentURL} alt="Proof of Payment" className="max-w-xs max-h-40 rounded border border-slate-700" />
                        </a>
                    </div>
                )}

                {/* Arbitrator Information */}
                {trade.arbitratorAddress && (
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-semibold text-gray-300">Arbitrator</span>
                        </div>
                        <p className="font-mono text-gray-400 text-xs">{trade.arbitratorAddress}</p>
                        {resolutionTime && (
                            <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs text-emerald-400">Resolved in {resolutionTime}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700 flex gap-4">
                <button 
                    // Call the onResolve function with the buyer's address
                    onClick={() => onResolve(trade.buyer)}
                    disabled={isProcessing}
                    className="w-full py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 font-semibold"
                >
                    {isProcessing ? <Spinner /> : 'Resolve for Buyer'}
                </button>
                <button 
                    // Call the onResolve function with the seller's address
                    onClick={() => onResolve(trade.seller)}
                    disabled={isProcessing}
                    className="w-full py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 font-semibold"
                >
                    {isProcessing ? <Spinner /> : 'Resolve for Seller'}
                </button>
            </div>
        </div>
    );
};

export default DisputeCard;