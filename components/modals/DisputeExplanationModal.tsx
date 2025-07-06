'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import { Trade } from '@/types';

interface DisputeExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (explanation: string) => Promise<void>;
    trade: Trade | null;
    isProcessing: boolean;
}

const DisputeExplanationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    trade, 
    isProcessing 
}: DisputeExplanationModalProps) => {
    const [explanation, setExplanation] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!explanation.trim()) {
            setError('Please provide an explanation for the dispute.');
            return;
        }
        
        if (explanation.trim().length < 10) {
            setError('Please provide a more detailed explanation (at least 10 characters).');
            return;
        }

        setError('');
        await onConfirm(explanation.trim());
        setExplanation('');
    };

    const handleClose = () => {
        setExplanation('');
        setError('');
        onClose();
    };

    if (!trade) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Explain Your Dispute">
            <div className="space-y-4">
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Trade Details</h4>
                    <div className="space-y-1 text-sm">
                        <p><span className="text-gray-300">Trade ID:</span> <span className="text-white font-mono">#{trade.onChainId}</span></p>
                        <p><span className="text-gray-300">Amount:</span> <span className="text-white">{trade.amount} {trade.tokenSymbol}</span></p>
                        <p><span className="text-gray-300">Amount to Pay:</span> <span className="text-white">
                            {trade.fiatCurrency === 'PHP'
                                ? (trade.amount * trade.price).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })
                                : `${(trade.amount * trade.price).toFixed(2)} ${trade.fiatCurrency}`}
                        </span></p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dispute Explanation *
                    </label>
                    <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Please explain the nature of your dispute. Be specific about what went wrong and provide any relevant details that will help the arbitrator understand your case..."
                        className="w-full h-32 bg-slate-900 text-white rounded-lg p-3 border border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                        disabled={isProcessing}
                    />
                    {error && (
                        <p className="text-red-400 text-sm mt-1">{error}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                        Minimum 10 characters. Be clear and specific about the issue.
                    </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-yellow-400 mb-1">Important</h4>
                    <p className="text-xs text-gray-300">
                        Disputes are reviewed by arbitrators who will make a final decision. 
                        Provide clear evidence and explanation to support your case.
                    </p>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                    <button 
                        onClick={handleClose}
                        disabled={isProcessing}
                        className="px-6 py-2.5 rounded-lg bg-slate-600 hover:bg-slate-500 font-semibold transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isProcessing || !explanation.trim()}
                        className="px-6 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 transition-colors font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Raising Dispute...' : 'Raise Dispute'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DisputeExplanationModal; 