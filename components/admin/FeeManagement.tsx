// p2p-nextjs-frontend/components/admin/FeeManagement.tsx

'use client';

import { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useNotification } from '@/lib/NotificationProvider';
import Spinner from '../ui/Spinner';

// Wagmi and Viem Imports
import { useWriteContract, useReadContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { config } from '@/lib/config';
import { isAddress } from 'viem';

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const FeeManagement = () => {
    const { address } = useWeb3();
    const { addNotification } = useNotification();
    const [feeBps, setFeeBps] = useState('');
    const [recipient, setRecipient] = useState('');

    const { writeContractAsync, isPending, reset } = useWriteContract();

    // Fetch current values from the contract
    const { data: currentFeeBps, refetch: refetchFee } = useReadContract({
        ...P2P_CONTRACT_CONFIG,
        functionName: 'platformFeeBps',
    });

    const { data: currentRecipient, refetch: refetchRecipient } = useReadContract({
        ...P2P_CONTRACT_CONFIG,
        functionName: 'feeRecipient',
    });

    const handleSetFee = async () => {
        if (!feeBps || parseInt(feeBps) < 0) {
            addNotification({ type: 'error', message: 'Please enter a valid, non-negative number for the fee.' });
            return;
        }
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setPlatformFeeBps',
                args: [BigInt(feeBps)],
            });
            await waitForTransactionReceipt(config, { hash });
            addNotification({ type: 'success', message: 'Platform fee updated successfully!' });
            refetchFee(); // Refresh the displayed value
        } catch (err: any) {
            addNotification({ type: 'error', message: `Error: ${err.shortMessage || err.message}` });
        } finally {
            reset();
        }
    };

    const handleSetRecipient = async () => {
        if (!isAddress(recipient)) {
            addNotification({ type: 'error', message: 'Please enter a valid Ethereum address.' });
            return;
        }
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setFeeRecipient',
                args: [recipient],
            });
            await waitForTransactionReceipt(config, { hash });
            addNotification({ type: 'success', message: 'Fee recipient updated successfully!' });
            refetchRecipient(); // Refresh the displayed value
        } catch (err: any) {
            addNotification({ type: 'error', message: `Error: ${err.shortMessage || err.message}` });
        } finally {
            reset();
        }
    };

    return (
        <div className="p-6 bg-slate-800 rounded-lg border border-slate-700 space-y-6">
            <h3 className="text-xl font-semibold text-white">Manage Fees</h3>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 block">Current Fee: {currentFeeBps?.toString() ?? 'Loading...'} BPS</label>
                <input type="number" value={feeBps} onChange={e => setFeeBps(e.target.value)} placeholder="New Fee in BPS (e.g., 50 for 0.5%)" className="w-full bg-slate-900 rounded-md p-2 border border-slate-600" />
                <button onClick={handleSetFee} disabled={isPending} className="w-full font-semibold py-2 px-4 rounded-lg bg-slate-600 hover:bg-slate-700 disabled:opacity-50">
                    {isPending ? <Spinner /> : "Set Platform Fee"}
                </button>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 block">Current Recipient: {currentRecipient ?? 'Loading...'}</label>
                <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="New Fee Recipient Address" className="w-full bg-slate-900 rounded-md p-2 border border-slate-600" />
                <button onClick={handleSetRecipient} disabled={isPending} className="w-full font-semibold py-2 px-4 rounded-lg bg-slate-600 hover:bg-slate-700 disabled:opacity-50">
                    {isPending ? <Spinner /> : "Set Fee Recipient"}
                </button>
            </div>
        </div>
    );
};

export default FeeManagement;