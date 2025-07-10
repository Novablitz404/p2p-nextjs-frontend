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

    const handleUpdateBuyerTimeout = async () => {
        const timeoutNumber = parseInt(buyerTimeout);
        if (isNaN(timeoutNumber) || timeoutNumber <= 0) {
            showError('Invalid Timeout', 'Please enter a valid timeout in seconds.');
            return;
        }

        setIsUpdatingBuyer(true);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setBuyerPaymentTimeout',
                args: [BigInt(timeoutNumber)],
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Buyer Timeout Updated', 'Buyer payment timeout updated!');
            onUpdate();
        } catch (err: any) {
            showError('Error', `Error: ${err.shortMessage || err.message}`);
        } finally {
            setIsUpdatingBuyer(false);
            reset();
        }
    };

    const handleUpdateSellerTimeout = async () => {
        const timeoutNumber = parseInt(sellerTimeout);
        if (isNaN(timeoutNumber) || timeoutNumber <= 0) {
            showError('Invalid Timeout', 'Please enter a valid timeout in seconds.');
            return;
        }

        setIsUpdatingSeller(true);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setSellerReleaseTimeout',
                args: [BigInt(timeoutNumber)],
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Seller Timeout Updated', 'Seller release timeout updated!');
            onUpdate();
        } catch (err: any) {
            showError('Error', `Error: ${err.shortMessage || err.message}`);
        } finally {
            setIsUpdatingSeller(false);
            reset();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Timeout Management</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Buyer Payment Timeout (seconds)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={buyerTimeout}
                                onChange={(e) => setBuyerTimeout(e.target.value)}
                                min="1"
                                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleUpdateBuyerTimeout}
                                disabled={isUpdatingBuyer || isPending}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdatingBuyer ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Seller Release Timeout (seconds)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={sellerTimeout}
                                onChange={(e) => setSellerTimeout(e.target.value)}
                                min="1"
                                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleUpdateSellerTimeout}
                                disabled={isUpdatingSeller || isPending}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdatingSeller ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeoutManagement;