'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Link from 'next/link';

interface RiskWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const SellerRiskWarningModal = React.memo(({ isOpen, onClose, onConfirm }: RiskWarningModalProps) => {
    const [scamWarningAgreed, setScamWarningAgreed] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);

    const canConfirm = scamWarningAgreed && termsAgreed;

    const handleConfirm = () => {
        console.log('SellerRiskWarningModal: handleConfirm called', { canConfirm, scamWarningAgreed, termsAgreed });
        if (canConfirm) {
            console.log('SellerRiskWarningModal: calling onConfirm');
            onConfirm();
        } else {
            console.log('SellerRiskWarningModal: cannot confirm - conditions not met');
        }
    };

    // Debug logging - only log when props actually change
    useEffect(() => {
        console.log('SellerRiskWarningModal render:', { isOpen, canConfirm, scamWarningAgreed, termsAgreed });
    }, [isOpen, canConfirm, scamWarningAgreed, termsAgreed]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Before You Create an Order...">
            <div className="space-y-3 text-xs text-gray-300">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <h3 className="text-base font-bold text-yellow-400 mb-1">Warning: Risk of Scams</h3>
                    <p className="mb-2">As a seller, you must <span className="font-bold text-white">always verify that you have received the full payment</span> in your own bank or payment app before releasing your crypto.</p>
                    <p>Do not trust screenshots from the buyer as proof, as they can be easily faked. Log in to your payment account independently to confirm the transaction.</p>
                </div>
                
                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <input 
                        type="checkbox" 
                        checked={scamWarningAgreed} 
                        onChange={(e) => {
                            console.log('Scam warning checkbox changed:', e.target.checked);
                            setScamWarningAgreed(e.target.checked);
                        }} 
                        className="mt-0.5 h-4 w-4 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 flex-shrink-0" 
                    />
                    <span>I understand the risks of P2P trading and will verify all payments independently before releasing assets.</span>
                </label>
                
                <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <input 
                        type="checkbox" 
                        checked={termsAgreed} 
                        onChange={(e) => {
                            console.log('Terms checkbox changed:', e.target.checked);
                            setTermsAgreed(e.target.checked);
                        }} 
                        className="mt-0.5 h-4 w-4 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 flex-shrink-0" 
                    />
                    <span>I agree to the platform's <Link href="/terms" className="text-emerald-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>.</span>
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
                        Agree & Create Order
                    </button>
                </div>
            </div>
        </Modal>
    );
});

SellerRiskWarningModal.displayName = 'SellerRiskWarningModal';

export default SellerRiskWarningModal;