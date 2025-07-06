// p2p-nextjs-frontend/components/admin/ManagerManagementView.tsx

'use client';

import { useState, useMemo } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useNotification } from '@/lib/NotificationProvider';
import { Plus, Trash2 } from 'lucide-react';
import AdminCard from '../ui/AdminCard';
import AddManagerModal from './AddManagerModal'; // Import the new modal
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

const ManagerManagementView = () => {
    const { address } = useWeb3();
    const { addNotification } = useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { writeContractAsync, isPending, reset } = useWriteContract();

    // Fetch the list of managers
    const { data: managerData, isLoading, refetch } = useReadContracts({
        contracts: [{ ...P2P_CONTRACT_CONFIG, functionName: 'getManagers' }]
    });

    const managers = useMemo(() => 
        (managerData?.[0]?.result as `0x${string}`[] || []),
        [managerData]
    );

    const handleRemove = async (addressToRemove: string) => {
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'removeManager',
                args: [addressToRemove as `0x${string}`],
            });
            await waitForTransactionReceipt(config, { hash });
            addNotification({ type: 'success', message: 'Manager removed successfully!' });
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
            <AdminCard title="Manage Managers" headerAction={addButton}>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40"><Spinner text="Fetching managers..." /></div>
                ) : managers.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">There are no managers assigned.</p>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {managers.map((managerAddress) => (
                            <div key={managerAddress} className="flex justify-between items-center text-sm p-3 bg-slate-900/50 rounded-lg">
                                <p className="font-mono text-gray-300">{managerAddress}</p>
                                <button onClick={() => handleRemove(managerAddress)} disabled={isPending} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full disabled:opacity-50">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </AdminCard>

            <AddManagerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={refetch}
            />
        </>
    );
};

export default ManagerManagementView;