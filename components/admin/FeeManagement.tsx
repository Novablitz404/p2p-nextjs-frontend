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

interface FeeManagementProps {
    currentFee: number;
    currentRecipient: string;
    onUpdate: () => void;
}

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const FeeManagement = ({ currentFee, currentRecipient, onUpdate }: FeeManagementProps) => {
    const { address } = useWeb3();
    const { success, error: showError } = useToastHelpers();
    const [newFee, setNewFee] = useState(currentFee.toString());
    const [newRecipient, setNewRecipient] = useState(currentRecipient);
    const [isUpdatingFee, setIsUpdatingFee] = useState(false);
    const [isUpdatingRecipient, setIsUpdatingRecipient] = useState(false);

    const { writeContractAsync, isPending, reset } = useWriteContract();

    const handleUpdateFee = async () => {
        const feeNumber = parseFloat(newFee);
        if (isNaN(feeNumber) || feeNumber < 0) {
            showError('Invalid Fee', 'Please enter a valid, non-negative number for the fee.');
            return;
        }

        setIsUpdatingFee(true);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setPlatformFeeBps',
                args: [BigInt(Math.floor(feeNumber * 100))], // Convert to basis points
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Fee Updated', 'Platform fee updated successfully!');
            onUpdate();
        } catch (err: any) {
            showError('Error', `Error: ${err.shortMessage || err.message}`);
        } finally {
            setIsUpdatingFee(false);
            reset();
        }
    };

    const handleUpdateRecipient = async () => {
        if (!isAddress(newRecipient)) {
            showError('Invalid Address', 'Please enter a valid Ethereum address.');
            return;
        }

        setIsUpdatingRecipient(true);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setFeeRecipient',
                args: [newRecipient],
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Recipient Updated', 'Fee recipient updated successfully!');
            onUpdate();
        } catch (err: any) {
            showError('Error', `Error: ${err.shortMessage || err.message}`);
        } finally {
            setIsUpdatingRecipient(false);
            reset();
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Platform Fee Management</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Platform Fee (%)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={newFee}
                                onChange={(e) => setNewFee(e.target.value)}
                                step="0.01"
                                min="0"
                                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleUpdateFee}
                                disabled={isUpdatingFee || isPending}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdatingFee ? 'Updating...' : 'Update Fee'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fee Recipient Address
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newRecipient}
                                onChange={(e) => setNewRecipient(e.target.value)}
                                placeholder="0x..."
                                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleUpdateRecipient}
                                disabled={isUpdatingRecipient || isPending}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdatingRecipient ? 'Updating...' : 'Update Recipient'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeManagement;