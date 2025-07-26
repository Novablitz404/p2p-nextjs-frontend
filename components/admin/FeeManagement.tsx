// p2p-nextjs-frontend/components/admin/FeeManagement.tsx

'use client';

import React, { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { isAddress } from 'viem';
import { config } from '@/lib/config';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { useToastHelpers } from '@/components/ui/ToastProvider';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';
import { DollarSign, Wallet, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import Spinner from '../ui/Spinner';

interface FeeManagementProps {
    currentFee: number;
    currentRecipient: string;
    onUpdate: () => void;
}

const FeeManagement = ({ currentFee, currentRecipient, onUpdate }: FeeManagementProps) => {
    const { address, chainId } = useWeb3();
    const { success, error: showError } = useToastHelpers();
    const [newFee, setNewFee] = useState(currentFee.toString());
    const [newRecipient, setNewRecipient] = useState(currentRecipient);
    const [isUpdatingFee, setIsUpdatingFee] = useState(false);
    const [isUpdatingRecipient, setIsUpdatingRecipient] = useState(false);

    const { writeContractAsync, isPending, reset } = useWriteContract();

    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };

    const validateFee = (fee: string) => {
        const feeNumber = parseFloat(fee);
        if (isNaN(feeNumber)) return { isValid: false, message: 'Please enter a valid number' };
        if (feeNumber < 0) return { isValid: false, message: 'Fee cannot be negative' };
        if (feeNumber > 10) return { isValid: false, message: 'Fee cannot exceed 10%' };
        return { isValid: true, message: 'Valid fee rate' };
    };

    const validateRecipient = (recipient: string) => {
        if (!recipient) return { isValid: false, message: 'Recipient address is required' };
        if (!isAddress(recipient)) return { isValid: false, message: 'Invalid Ethereum address format' };
        if (recipient === '0x0000000000000000000000000000000000000000') return { isValid: false, message: 'Zero address is not allowed' };
        return { isValid: true, message: 'Valid recipient address' };
    };

    const feeValidation = validateFee(newFee);
    const recipientValidation = validateRecipient(newRecipient);

    const handleUpdateFee = async () => {
        if (!feeValidation.isValid) {
            showError('Invalid Fee', feeValidation.message);
            return;
        }

        setIsUpdatingFee(true);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setPlatformFeeBps',
                args: [BigInt(Math.floor(parseFloat(newFee) * 100))], // Convert to basis points
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Fee Updated', 'Platform fee has been successfully updated!');
            onUpdate();
        } catch (err: any) {
            showError('Error', `Failed to update fee: ${err.shortMessage || err.message}`);
        } finally {
            setIsUpdatingFee(false);
            reset();
        }
    };

    const handleUpdateRecipient = async () => {
        if (!recipientValidation.isValid) {
            showError('Invalid Address', recipientValidation.message);
            return;
        }

        setIsUpdatingRecipient(true);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setFeeRecipient',
                args: [newRecipient as `0x${string}`],
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Recipient Updated', 'Fee recipient has been successfully updated!');
            onUpdate();
        } catch (err: any) {
            showError('Error', `Failed to update recipient: ${err.shortMessage || err.message}`);
        } finally {
            setIsUpdatingRecipient(false);
            reset();
        }
    };

    return (
        <div className="space-y-6">
            {/* Platform Fee Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Platform Fee</h3>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">Current Fee Rate</span>
                        <span className="text-lg font-bold text-white">{currentFee}%</span>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            New Fee Rate (%)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={newFee}
                                onChange={(e) => setNewFee(e.target.value)}
                                step="0.01"
                                min="0"
                                max="10"
                                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                                    newFee ? 
                                        (feeValidation.isValid ? 'border-emerald-500/50' : 'border-red-500/50') : 
                                        'border-slate-600'
                                }`}
                                disabled={isUpdatingFee || isPending}
                            />
                            {newFee && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {feeValidation.isValid ? (
                                        <CheckCircle size={20} className="text-emerald-400" />
                                    ) : (
                                        <AlertCircle size={20} className="text-red-400" />
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {newFee && (
                            <div className={`text-sm ${
                                feeValidation.isValid ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                                {feeValidation.message}
                            </div>
                        )}
                        
                        <button
                            onClick={handleUpdateFee}
                            disabled={isUpdatingFee || isPending || !feeValidation.isValid}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUpdatingFee ? (
                                <>
                                    <Spinner />
                                    Updating Fee...
                                </>
                            ) : (
                                <>
                                    <TrendingUp size={18} />
                                    Update Fee
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Fee Recipient Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet size={20} className="text-purple-400" />
                    <h3 className="text-lg font-semibold text-white">Fee Recipient</h3>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">Current Recipient</span>
                        <span className="text-sm font-mono text-white">
                            {currentRecipient ? 
                                `${currentRecipient.substring(0, 6)}...${currentRecipient.substring(currentRecipient.length - 4)}` : 
                                'Not Set'
                            }
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            New Recipient Address
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={newRecipient}
                                onChange={(e) => setNewRecipient(e.target.value)}
                                placeholder="0x1234...5678"
                                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                                    newRecipient ? 
                                        (recipientValidation.isValid ? 'border-emerald-500/50' : 'border-red-500/50') : 
                                        'border-slate-600'
                                }`}
                                disabled={isUpdatingRecipient || isPending}
                            />
                            {newRecipient && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {recipientValidation.isValid ? (
                                        <CheckCircle size={20} className="text-emerald-400" />
                                    ) : (
                                        <AlertCircle size={20} className="text-red-400" />
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {newRecipient && (
                            <div className={`text-sm ${
                                recipientValidation.isValid ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                                {recipientValidation.message}
                            </div>
                        )}
                        
                        <button
                            onClick={handleUpdateRecipient}
                            disabled={isUpdatingRecipient || isPending || !recipientValidation.isValid}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUpdatingRecipient ? (
                                <>
                                    <Spinner />
                                    Updating Recipient...
                                </>
                            ) : (
                                <>
                                    <Wallet size={18} />
                                    Update Recipient
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Information Box */}
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <div className="flex items-start gap-3">
                    <DollarSign size={20} className="text-blue-400 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-white mb-2">Fee Information</h4>
                        <ul className="text-xs text-blue-300 space-y-1">
                            <li>• Platform fees are charged on successful trades</li>
                            <li>• Fee rate is applied as a percentage of trade value</li>
                            <li>• Maximum fee rate is 10% for platform safety</li>
                            <li>• Fee recipient receives all collected platform fees</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeManagement;