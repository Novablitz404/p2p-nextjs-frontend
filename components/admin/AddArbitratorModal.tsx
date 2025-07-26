// p2p-nextjs-frontend/components/admin/AddArbitratorModal.tsx

'use client';

import React, { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { isAddress } from 'viem';
import { config } from '@/lib/config';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { useToastHelpers } from '@/components/ui/ToastProvider';
import Modal from '../ui/Modal';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';
import { Shield, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import Spinner from '../ui/Spinner';

interface AddArbitratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddArbitratorModal = ({ isOpen, onClose, onSuccess }: AddArbitratorModalProps) => {
    const { address, chainId } = useWeb3();
    const { success, error: showError } = useToastHelpers();
    const [arbitratorAddress, setArbitratorAddress] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const { writeContractAsync, isPending, reset } = useWriteContract();

    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };

    const validateAddress = (address: string) => {
        if (!address) return { isValid: false, message: 'Address is required' };
        if (!isAddress(address)) return { isValid: false, message: 'Invalid Ethereum address format' };
        if (address === '0x0000000000000000000000000000000000000000') return { isValid: false, message: 'Zero address is not allowed' };
        return { isValid: true, message: 'Valid address' };
    };

    const addressValidation = validateAddress(arbitratorAddress);

    const handleAdd = async () => {
        if (!addressValidation.isValid) {
            showError('Invalid Address', addressValidation.message);
            return;
        }
        
        setIsValidating(true);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'addArbitrator',
                args: [arbitratorAddress as `0x${string}`],
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Arbitrator Added', 'Arbitrator has been successfully added to the platform!');
            setArbitratorAddress('');
            onSuccess();
            onClose();
        } catch (err: any) {
            showError('Error', `Failed to add arbitrator: ${err.shortMessage || err.message}`);
        } finally {
            setIsValidating(false);
            reset();
        }
    };

    const handleClose = () => {
        if (!isPending && !isValidating) {
            setArbitratorAddress('');
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Add New Arbitrator">
            <div className="space-y-6">
                {/* Header with icon */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Add New Arbitrator</h3>
                    <p className="text-sm text-gray-400">
                        Add a trusted arbitrator to help resolve disputes and maintain platform integrity.
                    </p>
                </div>

                {/* Address Input */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                        Arbitrator Address
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={arbitratorAddress}
                            onChange={(e) => setArbitratorAddress(e.target.value)}
                            placeholder="0x1234...5678"
                            className={`w-full px-4 py-3 bg-slate-800 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                                arbitratorAddress ? 
                                    (addressValidation.isValid ? 'border-emerald-500/50' : 'border-red-500/50') : 
                                    'border-slate-600'
                            }`}
                            disabled={isPending || isValidating}
                        />
                        {arbitratorAddress && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {addressValidation.isValid ? (
                                    <CheckCircle size={20} className="text-emerald-400" />
                                ) : (
                                    <AlertCircle size={20} className="text-red-400" />
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Validation Message */}
                    {arbitratorAddress && (
                        <div className={`text-sm ${
                            addressValidation.isValid ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                            {addressValidation.message}
                        </div>
                    )}
                </div>

                {/* Information Box */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-start gap-3">
                        <UserPlus size={20} className="text-blue-400 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-white mb-2">Arbitrator Responsibilities</h4>
                            <ul className="text-xs text-gray-400 space-y-1">
                                <li>• Resolve disputes between buyers and sellers</li>
                                <li>• Review evidence and make fair decisions</li>
                                <li>• Maintain platform integrity and trust</li>
                                <li>• Follow established dispute resolution protocols</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                        disabled={isPending || isValidating}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={isPending || isValidating || !addressValidation.isValid}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isPending || isValidating ? (
                            <>
                                <Spinner />
                                {isValidating ? 'Validating...' : 'Adding...'}
                            </>
                        ) : (
                            <>
                                <Shield size={18} />
                                Add Arbitrator
                            </>
                        )}
                    </button>
                </div>

                {/* Warning */}
                <div className="text-xs text-gray-500 text-center">
                    Only add trusted addresses as arbitrators. This action cannot be undone.
                </div>
            </div>
        </Modal>
    );
};

export default AddArbitratorModal;