// p2p-nextjs-frontend/components/admin/ArbitratorManagementView.tsx

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useNotification } from '@/lib/NotificationProvider';
import { Plus, Trash2 } from 'lucide-react';
import AdminCard from '../ui/AdminCard';
import AddArbitratorModal from './AddArbitratorModal';
import Spinner from '../ui/Spinner';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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

    // State to hold arbitrator stats
    const [arbitratorStats, setArbitratorStats] = useState<{ [address: string]: any }>({});
    useEffect(() => {
        if (!arbitrators.length) return;
        let isMounted = true;
        const fetchStats = async () => {
            const stats: { [address: string]: any } = {};
            await Promise.all(arbitrators.map(async (arbAddress) => {
                const userDoc = await getDoc(doc(db, 'users', arbAddress));
                if (userDoc.exists()) {
                    stats[arbAddress] = userDoc.data();
                }
            }));
            if (isMounted) setArbitratorStats(stats);
        };
        fetchStats();
        return () => { isMounted = false; };
    }, [arbitrators]);

    const handleRemove = async (addressToRemove: string) => {
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'removeArbitrator',
                args: [addressToRemove as `0x${string}`],
            });
            await waitForTransactionReceipt(config, { hash });
            addNotification({ type: 'success', message: 'Arbitrator removed successfully!' });
            refetch(); // Refresh the list
        } catch (err: any) {
             addNotification({ type: 'error', message: `Error: ${err.shortMessage || err.message}` });
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
                        {arbitrators.map((arbAddress) => {
                            const stats = arbitratorStats[arbAddress] || {};
                            return (
                                <div key={arbAddress} className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm p-3 bg-slate-900/50 rounded-lg">
                                    <div>
                                        <p className="font-mono text-gray-300 break-all">{arbAddress}</p>
                                        <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                                            <div>Disputes Resolved: <span className="text-white font-semibold">{stats.disputesResolved ?? 0}</span></div>
                                            <div>Avg. Resolution Time: <span className="text-white font-semibold">{stats.averageResolutionTime ? `${Math.round(stats.averageResolutionTime)}s` : 'N/A'}</span></div>
                                            <div>Buyer Wins: <span className="text-white font-semibold">{stats.buyerWins ?? 0}</span></div>
                                            <div>Seller Wins: <span className="text-white font-semibold">{stats.sellerWins ?? 0}</span></div>
                                            <div>Last Resolved: <span className="text-white font-semibold">{stats.lastResolvedAt ? new Date(stats.lastResolvedAt.seconds ? stats.lastResolvedAt.seconds * 1000 : stats.lastResolvedAt).toLocaleString() : 'N/A'}</span></div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemove(arbAddress)} disabled={isPending} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full disabled:opacity-50 mt-2 sm:mt-0">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            );
                        })}
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