'use client';

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Link from 'next/link';

interface BuyerRiskWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const BuyerRiskWarningModal = React.memo(({ isOpen, onClose, onConfirm }: BuyerRiskWarningModalProps) => {
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
            <div className="space-y-3 text-xs text-gray-300">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <h3 className="text-base font-bold text-yellow-400 mb-1">Warning: P2P Trading Risks</h3>
                    <p className="mb-2">You are trading directly with another user. Rampz connects you but is not a party to the trade.</p>
                    <p>Send the <span className="font-bold text-white">exact amount</span> to the <span className="font-bold text-white">correct payment details</span> provided by the seller. Sending to the wrong account may result in loss of funds.</p>
                </div>
                
                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <input 
                        type="checkbox" 
                        checked={scamWarningAgreed} 
                        onChange={(e) => setScamWarningAgreed(e.target.checked)} 
                        className="mt-0.5 h-4 w-4 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 flex-shrink-0" 
                    />
                    <span>I understand I am responsible for making the correct payment. I will only use the payment details shown in the trade screen.</span>
                </label>
                
                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <input 
                        type="checkbox" 
                        checked={termsAgreed} 
                        onChange={(e) => setTermsAgreed(e.target.checked)} 
                        className="mt-0.5 h-4 w-4 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 flex-shrink-0" 
                    />
                    <span>I agree to the <Link href="/terms" className="text-emerald-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>.</span>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                    <button 
                        onClick={onClose} 
                        className="py-2 px-4 font-bold rounded-lg bg-slate-700/60 border border-slate-600/40 hover:bg-slate-600/80 transition-all duration-200 text-xs"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={!canConfirm} 
                        className="py-2 px-4 font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 text-xs"
                    >
                        Agree & Continue
                    </button>
                </div>
            </div>
        </Modal>
    );
});

BuyerRiskWarningModal.displayName = 'BuyerRiskWarningModal';

export default BuyerRiskWarningModal;