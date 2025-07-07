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

interface AddArbitratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const AddArbitratorModal = ({ isOpen, onClose, onSuccess }: AddArbitratorModalProps) => {
    const { address } = useWeb3();
    const { success, error: showError } = useToastHelpers();
    const [arbitratorAddress, setArbitratorAddress] = useState('');

    const { writeContractAsync, isPending, reset } = useWriteContract();

    const handleAdd = async () => {
        if (!isAddress(arbitratorAddress)) {
            showError('Invalid Address', 'Please enter a valid Ethereum address.');
            return;
        }
        
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'addArbitrator',
                args: [arbitratorAddress],
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Arbitrator Added', 'Arbitrator added successfully!');
            setArbitratorAddress('');
            onSuccess();
            onClose();
        } catch (err: any) {
            showError('Error', `Error: ${err.shortMessage || err.message}`);
        } finally {
            reset();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Arbitrator">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Arbitrator Address
                    </label>
                    <input
                        type="text"
                        value={arbitratorAddress}
                        onChange={(e) => setArbitratorAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                        disabled={isPending}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={isPending || !arbitratorAddress}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Adding...' : 'Add Arbitrator'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddArbitratorModal;