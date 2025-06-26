// p2p-nextjs-frontend/components/admin/TimeoutManagement.tsx

'use client';

import { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useNotification } from '@/lib/NotificationProvider';
import Spinner from '../ui/Spinner';

// Wagmi and Viem Imports
import { useWriteContract, useReadContracts } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { config } from '@/lib/config';

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const TimeoutManagement = () => {
    const { address } = useWeb3();
    const { addNotification } = useNotification();
    const [buyerTimeout, setBuyerTimeout] = useState('');
    const [sellerTimeout, setSellerTimeout] = useState('');

    const { writeContractAsync, isPending, reset } = useWriteContract();

    // Fetch current values in one batch
    const { data: timeoutData, refetch } = useReadContracts({
        contracts: [
            { ...P2P_CONTRACT_CONFIG, functionName: 'buyerPaymentTimeout' },
            { ...P2P_CONTRACT_CONFIG, functionName: 'sellerReleaseTimeout' },
        ],
    });
    const [currentBuyerTimeout, currentSellerTimeout] = timeoutData || [];

    const handleSetBuyerTimeout = async () => {
        if (!buyerTimeout || parseInt(buyerTimeout) <= 0) {
            addNotification(address!, { type: 'error', message: 'Please enter a valid timeout in seconds.' });
            return;
        }
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setBuyerPaymentTimeout',
                args: [BigInt(buyerTimeout)],
            });
            await waitForTransactionReceipt(config, { hash });
            addNotification(address!, { type: 'success', message: 'Buyer payment timeout updated!' });
            refetch(); // Refresh both values
        } catch (err: any) {
            addNotification(address!, { type: 'error', message: `Error: ${err.shortMessage || err.message}` });
        } finally {
            reset();
        }
    };

    const handleSetSellerTimeout = async () => {
        if (!sellerTimeout || parseInt(sellerTimeout) <= 0) {
            addNotification(address!, { type: 'error', message: 'Please enter a valid timeout in seconds.' });
            return;
        }
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'setSellerReleaseTimeout',
                args: [BigInt(sellerTimeout)],
            });
            await waitForTransactionReceipt(config, { hash });
            addNotification(address!, { type: 'success', message: 'Seller release timeout updated!' });
            refetch(); // Refresh both values
        } catch (err: any) {
            addNotification(address!, { type: 'error', message: `Error: ${err.shortMessage || err.message}` });
        } finally {
            reset();
        }
    };

    return (
        <div className="p-6 bg-slate-800 rounded-lg border border-slate-700 space-y-6">
            <h3 className="text-xl font-semibold text-white">Manage Timeouts</h3>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 block">Current Buyer Timeout: {currentBuyerTimeout?.result?.toString() ?? 'Loading...'} seconds</label>
                <input type="number" value={buyerTimeout} onChange={e => setBuyerTimeout(e.target.value)} placeholder="New Buyer Payment Timeout (seconds)" className="w-full bg-slate-900 rounded-md p-2 border border-slate-600" />
                <button onClick={handleSetBuyerTimeout} disabled={isPending} className="w-full font-semibold py-2 px-4 rounded-lg bg-slate-600 hover:bg-slate-700 disabled:opacity-50">
                    {isPending ? <Spinner /> : "Set Buyer Timeout"}
                </button>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 block">Current Seller Timeout: {currentSellerTimeout?.result?.toString() ?? 'Loading...'} seconds</label>
                <input type="number" value={sellerTimeout} onChange={e => setSellerTimeout(e.target.value)} placeholder="New Seller Release Timeout (seconds)" className="w-full bg-slate-900 rounded-md p-2 border border-slate-600" />
                <button onClick={handleSetSellerTimeout} disabled={isPending} className="w-full font-semibold py-2 px-4 rounded-lg bg-slate-600 hover:bg-slate-700 disabled:opacity-50">
                    {isPending ? <Spinner /> : "Set Seller Timeout"}
                </button>
            </div>
        </div>
    );
};

export default TimeoutManagement;