// p2p-nextjs-frontend/components/web3/DisputeCard.tsx

'use client';

import { Trade } from '@/types';
import Spinner from '../ui/Spinner';
import { format } from 'date-fns';

// This interface now matches the usage in your original DisputesPage
interface DisputeCardProps {
    trade: Trade;
    isProcessing: boolean;
    // The onResolve prop expects a function that takes the winner's address
    onResolve: (winnerAddress: string) => void;
}

const DisputeCard = ({ trade, isProcessing, onResolve }: DisputeCardProps) => {
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg text-white">Dispute #{trade.onChainId}</span>
                <span className="text-xs text-gray-400">
                    {trade.createdAt ? format(trade.createdAt.toDate(), 'PPp') : 'N/A'}
                </span>
            </div>
            <div className="space-y-2 text-sm">
                <p><span className="font-semibold text-gray-300">Buyer:</span> <span className="font-mono text-gray-400">{trade.buyer}</span></p>
                <p><span className="font-semibold text-gray-300">Seller:</span> <span className="font-mono text-gray-400">{trade.seller}</span></p>
                <p><span className="font-semibold text-gray-300">Amount:</span> {trade.amount} {trade.tokenSymbol}</p>
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