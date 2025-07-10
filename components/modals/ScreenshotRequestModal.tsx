'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import { Trade } from '@/types';
import Spinner from '../ui/Spinner';

interface ScreenshotRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, deadlineMinutes: number) => Promise<void>;
    trade: Trade | null;
    isProcessing: boolean;
}

const ScreenshotRequestModal = ({ isOpen, onClose, onConfirm, trade, isProcessing }: ScreenshotRequestModalProps) => {
    const [reason, setReason] = useState('');
    const [deadlineMinutes, setDeadlineMinutes] = useState(10);

    const handleClose = () => {
        if (!isProcessing) {
            setReason('');
            setDeadlineMinutes(10);
            onClose();
        }
    };

    const handleConfirm = async () => {
        if (!reason.trim()) {
            alert('Please provide a reason for requesting a new screenshot.');
            return;
        }
        await onConfirm(reason.trim(), deadlineMinutes);
    };

    if (!trade) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Request New Screenshot">
            <div className="space-y-5">
                <div className="bg-slate-700/60 border border-slate-600/40 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">Trade Details</h4>
                    <div className="space-y-2 text-sm">
                        <p><span className="text-gray-300">Trade ID:</span> <span className="text-white font-mono">#{trade.onChainId}</span></p>
                        <p><span className="text-gray-300">Amount:</span> <span className="text-white">{trade.amount} {trade.tokenSymbol}</span></p>
                        <p><span className="text-gray-300">Buyer:</span> <span className="text-white font-mono">{trade.buyer.substring(0, 10)}...{trade.buyer.substring(trade.buyer.length - 4)}</span></p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Reason for Request *
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explain why you need a new screenshot (e.g., 'Current screenshot is unclear', 'Wrong payment method shown', etc.)"
                            className="w-full bg-slate-800/70 border border-slate-600 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none resize-none"
                            rows={4}
                            disabled={isProcessing}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Deadline (minutes)
                        </label>
                        <select
                            value={deadlineMinutes}
                            onChange={(e) => setDeadlineMinutes(Number(e.target.value))}
                            className="w-full bg-slate-800/70 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                            disabled={isProcessing}
                        >
                            <option value={5}>5 minutes</option>
                            <option value={10}>10 minutes</option>
                            <option value={15}>15 minutes</option>
                        </select>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                        <p className="text-sm text-yellow-300">
                            <strong>Note:</strong> The buyer will have {deadlineMinutes} minutes to upload a new screenshot. 
                            If they don't respond, you can escalate this to a dispute.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        onClick={handleClose}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 transition-colors font-semibold text-white disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing || !reason.trim()}
                        className="px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 transition-colors font-semibold text-white disabled:opacity-50 flex items-center gap-2"
                    >
                        {isProcessing ? <Spinner /> : 'Request New Screenshot'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ScreenshotRequestModal; 