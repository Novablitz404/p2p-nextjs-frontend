// p2p-nextjs-frontend/components/admin/TimeoutManagement.tsx

'use client';

import React, { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { config } from '@/lib/config';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { useToastHelpers } from '@/components/ui/ToastProvider';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';
import { Clock, AlertCircle, CheckCircle, Timer, User, ShoppingCart } from 'lucide-react';
import Spinner from '../ui/Spinner';

interface TimeoutManagementProps {
    currentBuyerTimeout: number;
    currentSellerTimeout: number;
    onUpdate: () => void;
}

const TimeoutManagement = ({ currentBuyerTimeout, currentSellerTimeout, onUpdate }: TimeoutManagementProps) => {
    const { address, chainId } = useWeb3();
    const { success, error: showError } = useToastHelpers();
    const [buyerTimeout, setBuyerTimeout] = useState(currentBuyerTimeout.toString());
    const [sellerTimeout, setSellerTimeout] = useState(currentSellerTimeout.toString());
    const [isUpdatingBuyer, setIsUpdatingBuyer] = useState(false);
    const [isUpdatingSeller, setIsUpdatingSeller] = useState(false);

    const { writeContractAsync, isPending, reset } = useWriteContract();

    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };

    const formatTimeout = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    const validateTimeout = (timeout: string) => {
        const timeoutNumber = parseInt(timeout);
        if (isNaN(timeoutNumber)) return { isValid: false, message: 'Please enter a valid number' };
        if (timeoutNumber <= 0) return { isValid: false, message: 'Timeout must be greater than 0' };
        if (timeoutNumber > 604800) return { isValid: false, message: 'Timeout cannot exceed 7 days' };
        return { isValid: true, message: `Valid timeout: ${formatTimeout(timeoutNumber)}` };
    };

    const buyerValidation = validateTimeout(buyerTimeout);
    const sellerValidation = validateTimeout(sellerTimeout);

    const handleUpdateBuyerTimeout = async () => {
        if (!buyerValidation.isValid) {
            showError('Invalid Timeout', buyerValidation.message);
            return;
        }

        setIsUpdatingBuyer(true);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setBuyerPaymentTimeout',
                args: [BigInt(parseInt(buyerTimeout))],
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Buyer Timeout Updated', 'Buyer payment timeout has been successfully updated!');
            onUpdate();
        } catch (err: any) {
            showError('Error', `Failed to update buyer timeout: ${err.shortMessage || err.message}`);
        } finally {
            setIsUpdatingBuyer(false);
            reset();
        }
    };

    const handleUpdateSellerTimeout = async () => {
        if (!sellerValidation.isValid) {
            showError('Invalid Timeout', sellerValidation.message);
            return;
        }

        setIsUpdatingSeller(true);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setSellerReleaseTimeout',
                args: [BigInt(parseInt(sellerTimeout))],
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Seller Timeout Updated', 'Seller release timeout has been successfully updated!');
            onUpdate();
        } catch (err: any) {
            showError('Error', `Failed to update seller timeout: ${err.shortMessage || err.message}`);
        } finally {
            setIsUpdatingSeller(false);
            reset();
        }
    };

    return (
        <div className="space-y-6">
            {/* Buyer Timeout Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <ShoppingCart size={20} className="text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">Buyer Payment Timeout</h3>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">Current Timeout</span>
                        <span className="text-lg font-bold text-white">{formatTimeout(currentBuyerTimeout)}</span>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            New Timeout (seconds)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={buyerTimeout}
                                onChange={(e) => setBuyerTimeout(e.target.value)}
                                min="1"
                                max="604800"
                                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 ${
                                    buyerTimeout ? 
                                        (buyerValidation.isValid ? 'border-emerald-500/50' : 'border-red-500/50') : 
                                        'border-slate-600'
                                }`}
                                disabled={isUpdatingBuyer || isPending}
                            />
                            {buyerTimeout && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {buyerValidation.isValid ? (
                                        <CheckCircle size={20} className="text-emerald-400" />
                                    ) : (
                                        <AlertCircle size={20} className="text-red-400" />
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {buyerTimeout && (
                            <div className={`text-sm ${
                                buyerValidation.isValid ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                                {buyerValidation.message}
                            </div>
                        )}
                        
                        <button
                            onClick={handleUpdateBuyerTimeout}
                            disabled={isUpdatingBuyer || isPending || !buyerValidation.isValid}
                            className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUpdatingBuyer ? (
                                <>
                                    <Spinner />
                                    Updating Buyer Timeout...
                                </>
                            ) : (
                                <>
                                    <Timer size={18} />
                                    Update Buyer Timeout
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Seller Timeout Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <User size={20} className="text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">Seller Release Timeout</h3>
                </div>
                
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-300">Current Timeout</span>
                        <span className="text-lg font-bold text-white">{formatTimeout(currentSellerTimeout)}</span>
                    </div>
                    
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                            New Timeout (seconds)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={sellerTimeout}
                                onChange={(e) => setSellerTimeout(e.target.value)}
                                min="1"
                                max="604800"
                                className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 ${
                                    sellerTimeout ? 
                                        (sellerValidation.isValid ? 'border-emerald-500/50' : 'border-red-500/50') : 
                                        'border-slate-600'
                                }`}
                                disabled={isUpdatingSeller || isPending}
                            />
                            {sellerTimeout && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {sellerValidation.isValid ? (
                                        <CheckCircle size={20} className="text-emerald-400" />
                                    ) : (
                                        <AlertCircle size={20} className="text-red-400" />
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {sellerTimeout && (
                            <div className={`text-sm ${
                                sellerValidation.isValid ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                                {sellerValidation.message}
                            </div>
                        )}
                        
                        <button
                            onClick={handleUpdateSellerTimeout}
                            disabled={isUpdatingSeller || isPending || !sellerValidation.isValid}
                            className="w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUpdatingSeller ? (
                                <>
                                    <Spinner />
                                    Updating Seller Timeout...
                                </>
                            ) : (
                                <>
                                    <Timer size={18} />
                                    Update Seller Timeout
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Information Box */}
            <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                <div className="flex items-start gap-3">
                    <Clock size={20} className="text-emerald-400 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-white mb-2">Timeout Information</h4>
                        <ul className="text-xs text-emerald-300 space-y-1">
                            <li>• Buyer timeout: Time limit for buyers to complete payment</li>
                            <li>• Seller timeout: Time limit for sellers to release funds</li>
                            <li>• Maximum timeout is 7 days (604,800 seconds)</li>
                            <li>• Timeouts help prevent disputes and ensure trade completion</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeoutManagement;