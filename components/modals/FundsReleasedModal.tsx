'use client';

import Modal from '../ui/Modal';
import { Trade } from '@/types';
import { PartyPopper } from 'lucide-react';
import Link from 'next/link';

interface FundsReleasedModalProps {
    isOpen: boolean;
    onClose: () => void;
    trade: Trade | null;
}

const FundsReleasedModal = ({ isOpen, onClose, trade }: FundsReleasedModalProps) => {
    if (!isOpen || !trade) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Trade Complete!">
            <div className="text-center">
                <div className="flex justify-center items-center mb-6 text-yellow-400">
                    <div className="p-4 bg-yellow-400/10 rounded-full">
                        <PartyPopper size={48} strokeWidth={1.5} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Funds Released!</h2>
                <p className="text-gray-300 text-lg">
                    You have successfully received{' '}
                    <span className="font-bold text-emerald-400">
                        {trade.amount.toLocaleString()} {trade.tokenSymbol}
                    </span>
                    .
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                     <Link
                        href="/dapp/trades"
                        onClick={onClose}
                        className="w-full flex items-center justify-center px-6 py-3 font-bold bg-slate-700/60 border border-slate-600/40 text-white rounded-xl hover:bg-slate-600/80 transition-all duration-200"
                    >
                        View Trade History
                    </Link>
                    <button
                        onClick={onClose}
                        className="w-full flex items-center justify-center px-6 py-3 font-bold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
                    >
                        Awesome!
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FundsReleasedModal;