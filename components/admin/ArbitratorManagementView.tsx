// p2p-nextjs-frontend/components/admin/ArbitratorManagementView.tsx

'use client';

import { useState, useMemo } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useNotification } from '@/lib/NotificationProvider';
import { Plus, Trash2 } from 'lucide-react';
import AdminCard from '../ui/AdminCard';
import AddArbitratorModal from './AddArbitratorModal';
import Spinner from '../ui/Spinner';

// Wagmi and Viem Imports
import { useReadContracts, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { config } from '@/lib/config';

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const ArbitratorManagementView = () => {
    const { address } = useWeb3();
    const { addNotification } = useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { writeContractAsync, isPending, reset } = useWriteContract();

    // Fetch the list of arbitrators
    const { data: arbitratorData, isLoading, refetch } = useReadContracts({
        contracts: [{ ...P2P_CONTRACT_CONFIG, functionName: 'getArbitrators' }]
    });

    const arbitrators = useMemo(() => 
        (arbitratorData?.[0]?.result as `0x${string}`[] || []),
        [arbitratorData]
    );

    const handleRemove = async (addressToRemove: string) => {
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'removeArbitrator',
                args: [addressToRemove as `0x${string}`],
            });
            await waitForTransactionReceipt(config, { hash });
            addNotification(address!, { type: 'success', message: 'Arbitrator removed successfully!' });
            refetch(); // Refresh the list
        } catch (err: any) {
             addNotification(address!, { type: 'error', message: `Error: ${err.shortMessage || err.message}` });
        } finally {
            reset();
        }
    };

    const addButton = (
        <button onClick={() => setIsModalOpen(true)} className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40">
            <Plus size={18} />
        </button>
    );

    return (
        <>
            <AdminCard title="Manage Arbitrators" headerAction={addButton}>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40"><Spinner text="Fetching arbitrators..." /></div>
                ) : arbitrators.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">There are no arbitrators assigned.</p>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {arbitrators.map((arbAddress) => (
                            <div key={arbAddress} className="flex justify-between items-center text-sm p-3 bg-slate-900/50 rounded-lg">
                                <p className="font-mono text-gray-300">{arbAddress}</p>
                                <button onClick={() => handleRemove(arbAddress)} disabled={isPending} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full disabled:opacity-50">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </AdminCard>

            <AddArbitratorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={refetch}
            />
        </>
    );
};

export default ArbitratorManagementView;