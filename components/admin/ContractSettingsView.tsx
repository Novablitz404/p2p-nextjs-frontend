'use client';

import AdminCard from "../ui/AdminCard";
import FeeManagement from "./FeeManagement";
import TimeoutManagement from "./TimeoutManagement";
import { useReadContracts } from 'wagmi';
import { useState } from 'react';
import { P2PEscrowABI } from '@/abis/P2PEscrow';

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const ContractSettingsView = () => {
    const [refreshNonce, setRefreshNonce] = useState(0);
    const { data, isLoading, refetch } = useReadContracts({
        contracts: [
            { ...P2P_CONTRACT_CONFIG, functionName: 'platformFeeBps' },
            { ...P2P_CONTRACT_CONFIG, functionName: 'feeRecipient' },
            { ...P2P_CONTRACT_CONFIG, functionName: 'buyerPaymentTimeout' },
            { ...P2P_CONTRACT_CONFIG, functionName: 'sellerReleaseTimeout' },
        ],
        query: { enabled: true, gcTime: 0, staleTime: 0, refetchInterval: false, refetchOnMount: true, refetchOnWindowFocus: true },
    });

    const handleUpdate = () => {
        setRefreshNonce((n) => n + 1);
        refetch();
    };

    const feeResult = data?.[0]?.result;
    const recipientResult = data?.[1]?.result;
    const buyerTimeoutResult = data?.[2]?.result;
    const sellerTimeoutResult = data?.[3]?.result;
    const currentFee = feeResult ? Number(feeResult) / 100 : 0;
    const currentRecipient = recipientResult ? String(recipientResult) : '';
    const currentBuyerTimeout = buyerTimeoutResult ? Number(buyerTimeoutResult) : 0;
    const currentSellerTimeout = sellerTimeoutResult ? Number(sellerTimeoutResult) : 0;

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Contract Settings</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AdminCard title="Manage Platform Fees">
                    {isLoading ? (
                        <div className="text-gray-400">Loading contract data...</div>
                    ) : (
                        <FeeManagement
                            currentFee={currentFee}
                            currentRecipient={currentRecipient}
                            onUpdate={handleUpdate}
                        />
                    )}
                </AdminCard>
                <AdminCard title="Manage Contract Timeouts">
                    {isLoading ? (
                        <div className="text-gray-400">Loading contract data...</div>
                    ) : (
                        <TimeoutManagement
                            currentBuyerTimeout={currentBuyerTimeout}
                            currentSellerTimeout={currentSellerTimeout}
                            onUpdate={handleUpdate}
                        />
                    )}
                </AdminCard>
            </div>
        </div>
    );
};

export default ContractSettingsView;