'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Link from 'next/link';

interface BuyerRiskWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const BuyerRiskWarningModal = ({ isOpen, onClose, onConfirm }: BuyerRiskWarningModalProps) => {
    const [scamWarningAgreed, setScamWarningAgreed] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);

    const canConfirm = scamWarningAgreed && termsAgreed;

    const handleConfirm = () => {
        if (canConfirm) {
            onConfirm();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Before You Buy...">
            <div className="space-y-4 text-sm text-gray-300">
                <h3 className="text-lg font-bold text-yellow-400">Warning: P2P Trading Risks</h3>
                <p>You are entering into a trade directly with another user. Rampz facilitates the connection but is not a party to the trade itself.</p>
                <p>Ensure you are sending the <span className="font-bold text-white">exact amount</span> to the <span className="font-bold text-white">correct payment details</span> provided by the seller in the next step. Sending to the wrong account may result in a loss of funds.</p>
                
                <label className="flex items-start gap-3 cursor-pointer mt-4 p-2 rounded-lg hover:bg-slate-700/50">
                    <input 
                        type="checkbox" 
                        checked={scamWarningAgreed} 
                        onChange={(e) => setScamWarningAgreed(e.target.checked)} 
                        className="mt-1 h-4 w-4 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 flex-shrink-0" 
                    />
                    <span>I understand that I am responsible for making the correct payment. I will not send funds to any details other than those displayed in the trade screen.</span>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-700/50">
                    <input 
                        type="checkbox" 
                        checked={termsAgreed} 
                        onChange={(e) => setTermsAgreed(e.target.checked)} 
                        className="mt-1 h-4 w-4 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 flex-shrink-0" 
                    />
                    <span>I agree to the platform's <Link href="/terms" className="text-emerald-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>.</span>
                </label>

                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="py-2 px-4 font-semibold rounded-lg bg-slate-600 hover:bg-slate-500">Cancel</button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={!canConfirm} 
                        className="py-2 px-4 font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Agree & Continue
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BuyerRiskWarningModal;