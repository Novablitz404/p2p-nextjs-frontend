'use client';

import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Trade } from '@/types';
import Spinner from '../ui/Spinner';
import { Eye, EyeOff } from 'lucide-react';

interface PaymentInstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeTrade: Trade | null;
    onConfirmFiat: () => void;
    onCancelTrade: () => void;
    onUploadProof: (file: File) => Promise<void>;
    onDeleteProof: () => Promise<void>;
    onDispute: () => Promise<void>;      
    onNewScreenshotUploaded: () => Promise<void>;
    isConfirmingFiat: boolean; 
    releaseTimeout: number | null; 
}

const currencySymbols: { [key: string]: string } = {
    'PHP': '₱',
    'USD': '$',
    'EUR': '€',
    'IDR': 'Rp',
};


const PaymentInstructionsModal = ({ isOpen, onClose, activeTrade, onConfirmFiat, onCancelTrade, onUploadProof, onDeleteProof, onDispute, onNewScreenshotUploaded, isConfirmingFiat, releaseTimeout }: PaymentInstructionsModalProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDisputable, setIsDisputable] = useState(false);
    const [countdown, setCountdown] = useState('');
    const [areDetailsVisible, setAreDetailsVisible] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setAreDetailsVisible(false); // Reset visibility when modal opens/closes
        }
    }, [isOpen]);

    useEffect(() => {
        if (!activeTrade || activeTrade.status !== 'FIAT_PAID' || releaseTimeout === null || !activeTrade.fiatSentAt) {
            setIsDisputable(false);
            return;
        }

        const deadline = (activeTrade.fiatSentAt.seconds + releaseTimeout) * 1000;
        
        const intervalId = setInterval(() => {
            const timeLeft = deadline - Date.now();
            if (timeLeft <= 0) {
                setIsDisputable(true);
                setCountdown("Ready to dispute");
                clearInterval(intervalId);
            } else {
                const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
                const seconds = Math.floor((timeLeft / 1000) % 60);
                setCountdown(`${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [activeTrade, releaseTimeout]);

    if (!activeTrade) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadClick = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        await onUploadProof(selectedFile);
        setIsUploading(false);
        setSelectedFile(null);
        const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    };
    
    const fiatCost = activeTrade.amount * activeTrade.price;
    const paymentDetails = activeTrade.sellerPaymentDetails;
    const currencySymbol = currencySymbols[activeTrade.fiatCurrency] || `${activeTrade.fiatCurrency} `;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Action Required: Send Payment">
            <p className="text-gray-300 mb-4">Please send the exact fiat amount to the seller's details below. After sending, upload proof and click "I Have Paid Seller".</p>
            
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <p className="font-semibold text-white mb-3 flex justify-between items-center">
                    <span>Pay To:</span>
                    <button onClick={() => setAreDetailsVisible(!areDetailsVisible)} className="text-gray-400 hover:text-white p-1">
                        {areDetailsVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </p>
                {paymentDetails ? (
                    areDetailsVisible ? (
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-gray-400">Channel:</span> <span className="font-semibold text-white">{paymentDetails.channel}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Name:</span> <span className="font-semibold text-white">{paymentDetails.accountName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Number:</span> <span className="font-mono text-white">{paymentDetails.accountNumber}</span></div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-3 text-sm italic">Click the eye icon to reveal payment details.</div>
                    )
                ) : ( <p className="text-yellow-400 text-sm">Seller has not provided payment details.</p> )}
                
                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                    <span className="font-semibold text-white">Amount to Pay:</span>
                    <span className="font-bold text-emerald-400 text-xl">
                        {currencySymbol}{fiatCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

                {activeTrade.status === 'LOCKED' && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Proof of Payment</label>
                    {activeTrade.proofOfPaymentURL ? (
                        <div className="flex gap-2">
                            <a href={activeTrade.proofOfPaymentURL} target="_blank" rel="noopener noreferrer" className="w-full text-center px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-sm font-semibold">
                                View Fullscreen
                            </a>
                            <button onClick={onDeleteProof} className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold">
                                Delete & Re-upload
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input id="file-upload-input" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-300 hover:file:bg-emerald-500/20"/>
                            <button onClick={handleUploadClick} disabled={!selectedFile || isUploading} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 flex-shrink-0">
                                {isUploading ? <Spinner/> : "Upload"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTrade.status === 'REQUESTING_SCREENSHOT' && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-3">
                        <h3 className="text-base font-bold text-orange-400 mb-1">New Screenshot Required</h3>
                        <p className="text-sm text-gray-300 mb-2">
                            {activeTrade.screenshotRequestReason || 'The seller has requested a new screenshot of your payment proof.'}
                        </p>
                        {activeTrade.screenshotRequestDeadline && (
                            <p className="text-xs text-orange-300">
                                Deadline: {new Date(activeTrade.screenshotRequestDeadline.seconds * 1000).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Upload New Proof of Payment</label>
                    {activeTrade.proofOfPaymentURL ? (
                        <div className="flex gap-2">
                            <a href={activeTrade.proofOfPaymentURL} target="_blank" rel="noopener noreferrer" className="w-full text-center px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-sm font-semibold">
                                View Current Screenshot
                            </a>
                            <button onClick={onDeleteProof} className="w-full px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold">
                                Delete & Re-upload
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input id="file-upload-input" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-300 hover:file:bg-emerald-500/20"/>
                            <button onClick={handleUploadClick} disabled={!selectedFile || isUploading} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 flex-shrink-0">
                                {isUploading ? <Spinner/> : "Upload"}
                            </button>
                        </div>
                    )}
                </div>
            )}
           
            <div className="mt-6 flex flex-col space-y-3">
                {activeTrade.status === 'LOCKED' && (
                    <>
                        {/* --- THIS IS THE FIX --- */}
                        <button 
                            onClick={onConfirmFiat} 
                            disabled={isConfirmingFiat || !activeTrade.proofOfPaymentURL} 
                            className="w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {isConfirmingFiat ? <Spinner text="Confirming..." /> : "I Have Paid Seller"}
                        </button>
                        <button onClick={onCancelTrade} className="w-full py-2 rounded-lg text-sm text-gray-400 hover:bg-slate-700" disabled={isConfirmingFiat}>
                            Cancel Trade
                        </button>
                    </>
                )}

                {activeTrade.status === 'FIAT_PAID' && (
                    <div className="text-center p-4 bg-slate-900 rounded-lg border border-slate-700">
                        <p className="font-semibold text-yellow-400">Waiting for Seller to Release...</p>
                        <p className="text-xs text-gray-400 mt-1">If the seller doesn't respond in a timely manner, you may raise a dispute.</p>
                        
                        <button 
                            onClick={onDispute}
                            disabled={!isDisputable}
                            className="mt-4 w-full text-sm font-semibold py-2 px-1 rounded-lg bg-red-600/80 text-red-100 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDisputable ? 'Raise a Dispute' : `Dispute available in: ${countdown}`}
                        </button>
                    </div>
                )}

                {activeTrade.status === 'REQUESTING_SCREENSHOT' && (
                    <>
                        <button 
                            onClick={async () => {
                                // Don't call onConfirmFiat since smart contract already has Fiat_Sent status
                                // Just update Firestore to reflect the new screenshot was uploaded
                                if (activeTrade) {
                                    await onNewScreenshotUploaded();
                                }
                            }} 
                            disabled={!activeTrade.proofOfPaymentURL} 
                            className="w-full px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            New Screenshot Uploaded
                        </button>
                        <button onClick={onCancelTrade} className="w-full py-2 rounded-lg text-sm text-gray-400 hover:bg-slate-700">
                            Cancel Trade
                        </button>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default PaymentInstructionsModal;