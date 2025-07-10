// p2p-nextjs-frontend/components/admin/AddManagerModal.tsx

'use client';

import React, { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { isAddress } from 'viem';
import { config } from '@/lib/config';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { useToastHelpers } from '@/components/ui/ToastProvider';
import Modal from '../ui/Modal';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';

interface AddManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AddManagerModal = ({ isOpen, onClose, onSuccess }: AddManagerModalProps) => {
    const { address, chainId } = useWeb3();
    const { success, error: showError } = useToastHelpers();
    const [managerAddress, setManagerAddress] = useState('');

    const { writeContractAsync, isPending, reset } = useWriteContract();

    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };

    const handleAdd = async () => {
        if (!isAddress(managerAddress)) {
            showError('Invalid Address', 'Please enter a valid Ethereum address.');
            return;
        }
        
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'addManager',
                args: [managerAddress],
            });
            await waitForTransactionReceipt(config, { hash });
            
            success('Manager Added', 'Manager added successfully!');
            setManagerAddress('');
            onSuccess();
            onClose();
        } catch (err: any) {
            showError('Error', `Error: ${err.shortMessage || err.message}`);
        } finally {
            reset();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Manager">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Manager Address
                    </label>
                    <input
                        type="text"
                        value={managerAddress}
                        onChange={(e) => setManagerAddress(e.target.value)}
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
                        disabled={isPending || !managerAddress}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Adding...' : 'Add Manager'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddManagerModal;