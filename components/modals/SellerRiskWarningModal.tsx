'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Link from 'next/link';

interface RiskWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const SellerRiskWarningModal = ({ isOpen, onClose, onConfirm }: RiskWarningModalProps) => {
    const [scamWarningAgreed, setScamWarningAgreed] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);

    const canConfirm = scamWarningAgreed && termsAgreed;

    const handleConfirm = () => {
        if (canConfirm) {
            onConfirm();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Before You Create an Order...">
            <div className="space-y-4 text-sm text-gray-300">
                <h3 className="text-lg font-bold text-yellow-400">Warning: Risk of Scams</h3>
                <p>As a seller, you must <span className="font-bold text-white">always verify that you have received the full payment</span> in your own bank or payment app before releasing your crypto.</p>
                <p>Do not trust screenshots from the buyer as proof, as they can be easily faked. Log in to your payment account independently to confirm the transaction.</p>
                
                <label className="flex items-start gap-3 cursor-pointer mt-4 p-2 rounded-lg hover:bg-slate-700/50">
                    <input 
                        type="checkbox" 
                        checked={scamWarningAgreed} 
                        onChange={(e) => setScamWarningAgreed(e.target.checked)} 
                        className="mt-1 h-4 w-4 rounded bg-slate-700 border-slate-600 text-emerald-500 focus:ring-emerald-500 flex-shrink-0" 
                    />
                    <span>I understand the risks of P2P trading and will verify all payments independently before releasing assets.</span>
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
                        Agree & Create Order
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SellerRiskWarningModal;