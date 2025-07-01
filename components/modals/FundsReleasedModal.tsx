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
                <div className="flex justify-center items-center mb-4 text-yellow-400">
                    <PartyPopper size={48} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Funds Released!</h2>
                <p className="text-gray-300">
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
                        className="w-full flex items-center justify-center px-4 py-3 font-semibold bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                    >
                        View Trade History
                    </Link>
                    <button
                        onClick={onClose}
                        className="w-full flex items-center justify-center px-4 py-3 font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                        Awesome!
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FundsReleasedModal;