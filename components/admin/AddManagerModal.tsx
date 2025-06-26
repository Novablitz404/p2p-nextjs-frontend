// p2p-nextjs-frontend/components/admin/AddManagerModal.tsx

'use client';

import { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { useNotification } from '@/lib/NotificationProvider';

// Wagmi and Viem Imports
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { config } from '@/lib/config';
import { isAddress } from 'viem';

interface AddManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // Callback to refresh the manager list
}

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const AddManagerModal = ({ isOpen, onClose, onSuccess }: AddManagerModalProps) => {
    const { address } = useWeb3();
    const { addNotification } = useNotification();
    const [managerAddress, setManagerAddress] = useState('');

    const { writeContractAsync, isPending, reset } = useWriteContract();

    const handleAdd = async () => {
        if (!isAddress(managerAddress)) {
            addNotification(address!, { type: 'error', message: 'Please enter a valid Ethereum address.' });
            return;
        }
        
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'addManager',
                args: [managerAddress],
            });
            await waitForTransactionReceipt(config, { hash });
            
            addNotification(address!, { type: 'success', message: 'Manager added successfully!' });
            setManagerAddress('');
            onSuccess();
            onClose();
        } catch (err: any) {
            addNotification(address!, { type: 'error', message: `Error: ${err.shortMessage || err.message}` });
        } finally {
            reset();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Manager">
            <div className="space-y-4">
                <p className="text-sm text-gray-400">
                    Enter the wallet address for the user you want to grant manager privileges.
                </p>
                <div>
                    <label htmlFor="manager-address" className="block text-sm font-medium text-gray-300 mb-1">
                        Manager Wallet Address
                    </label>
                    <input
                        id="manager-address"
                        type="text"
                        value={managerAddress}
                        onChange={(e) => setManagerAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-slate-900 rounded-md p-2 border border-slate-600 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="py-2 px-4 text-sm font-semibold rounded-lg bg-slate-700 hover:bg-slate-600">
                        Cancel
                    </button>
                    <button onClick={handleAdd} disabled={isPending} className="py-2 px-4 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 flex items-center">
                        {isPending ? <Spinner /> : "Add Manager"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddManagerModal;