// p2p-nextjs-frontend/components/admin/ArbitratorManagementView.tsx

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { useNotification } from '@/lib/NotificationProvider';
import { Plus, Trash2, Shield, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle, Activity, Award } from 'lucide-react';
import AddArbitratorModal from './AddArbitratorModal';
import Spinner from '../ui/Spinner';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Wagmi and Viem Imports
import { useReadContracts, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { config } from '@/lib/config';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';

const ArbitratorManagementView = () => {
    const { address, chainId } = useWeb3();
    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };
    const { addNotification } = useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedArbitrator, setSelectedArbitrator] = useState<string | null>(null);

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

    const getArbitratorStatus = (stats: any) => {
        const disputesResolved = stats.disputesResolved ?? 0;
        const avgTime = stats.averageResolutionTime ?? 0;
        
        if (disputesResolved === 0) return { status: 'inactive', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: XCircle };
        if (disputesResolved > 10 && avgTime < 3600) return { status: 'excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Award };
        if (disputesResolved > 5) return { status: 'active', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: CheckCircle };
        return { status: 'new', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Activity };
    };

    const calculateSuccessRate = (stats: any) => {
        const total = (stats.buyerWins ?? 0) + (stats.sellerWins ?? 0);
        if (total === 0) return 0;
        return Math.round((stats.disputesResolved ?? 0) / total * 100);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <Spinner text="Loading arbitrators..." />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Arbitrator Management</h1>
                    <p className="text-gray-400">Manage dispute resolution arbitrators and monitor their performance</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
                >
                    <Plus size={18} />
                    Add Arbitrator
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-blue-400">Total Arbitrators</span>
                        <Shield size={20} className="text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{arbitrators.length}</p>
                    <p className="text-xs text-blue-300 mt-1">Active dispute resolvers</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-purple-400">Total Disputes</span>
                        <Users size={20} className="text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {Object.values(arbitratorStats).reduce((sum: number, stats: any) => sum + (stats.disputesResolved ?? 0), 0)}
                    </p>
                    <p className="text-xs text-purple-300 mt-1">Resolved across all arbitrators</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-emerald-400">Avg Resolution</span>
                        <Clock size={20} className="text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {(() => {
                            const times = Object.values(arbitratorStats)
                                .map((stats: any) => stats.averageResolutionTime)
                                .filter(time => time && time > 0);
                            if (times.length === 0) return 'N/A';
                            const avg = times.reduce((a, b) => a + b, 0) / times.length;
                            return `${Math.round(avg / 60)}m`;
                        })()}
                    </p>
                    <p className="text-xs text-emerald-300 mt-1">Average time to resolve</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-yellow-400">Success Rate</span>
                        <TrendingUp size={20} className="text-yellow-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {(() => {
                            const rates = Object.values(arbitratorStats)
                                .map((stats: any) => calculateSuccessRate(stats))
                                .filter(rate => rate > 0);
                            if (rates.length === 0) return 'N/A';
                            const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
                            return `${avg}%`;
                        })()}
                    </p>
                    <p className="text-xs text-yellow-300 mt-1">Overall resolution success</p>
                </div>
            </div>

            {/* Arbitrators List */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 shadow-lg">
                <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-semibold text-white">Arbitrator Directory</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage and monitor arbitrator performance</p>
                </div>
                
                {arbitrators.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Arbitrators Found</h3>
                        <p className="text-gray-400 mb-6">
                            Add arbitrators to help resolve disputes and maintain platform integrity.
                        </p>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors mx-auto"
                        >
                            <Plus size={18} />
                            Add First Arbitrator
                        </button>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {arbitrators.map((arbAddress) => {
                            const stats = arbitratorStats[arbAddress] || {};
                            const status = getArbitratorStatus(stats);
                            const StatusIcon = status.icon;
                            
                            return (
                                <div key={arbAddress} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-200">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`p-2 rounded-lg ${status.bg}`}>
                                                    <StatusIcon size={20} className={status.color} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {stats.displayName || 'Unknown Arbitrator'}
                                                    </h3>
                                                    <p className="text-sm text-gray-400 font-mono">
                                                        {arbAddress.substring(0, 6)}...{arbAddress.substring(arbAddress.length - 4)}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color} ${status.bg}`}>
                                                    {status.status.toUpperCase()}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-slate-700/50 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle size={16} className="text-emerald-400" />
                                                        <span className="text-sm text-gray-400">Resolved</span>
                                                    </div>
                                                    <p className="text-xl font-bold text-white">{stats.disputesResolved ?? 0}</p>
                                                </div>
                                                
                                                <div className="bg-slate-700/50 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Clock size={16} className="text-blue-400" />
                                                        <span className="text-sm text-gray-400">Avg Time</span>
                                                    </div>
                                                    <p className="text-xl font-bold text-white">
                                                        {stats.averageResolutionTime ? `${Math.round(stats.averageResolutionTime / 60)}m` : 'N/A'}
                                                    </p>
                                                </div>
                                                
                                                <div className="bg-slate-700/50 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <TrendingUp size={16} className="text-purple-400" />
                                                        <span className="text-sm text-gray-400">Success Rate</span>
                                                    </div>
                                                    <p className="text-xl font-bold text-white">{calculateSuccessRate(stats)}%</p>
                                                </div>
                                                
                                                <div className="bg-slate-700/50 rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Activity size={16} className="text-yellow-400" />
                                                        <span className="text-sm text-gray-400">Last Active</span>
                                                    </div>
                                                    <p className="text-sm font-semibold text-white">
                                                        {stats.lastResolvedAt ? 
                                                            new Date(stats.lastResolvedAt.seconds ? stats.lastResolvedAt.seconds * 1000 : stats.lastResolvedAt).toLocaleDateString() : 
                                                            'Never'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {stats.disputesResolved > 0 && (
                                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-400">Buyer Wins: <span className="text-white font-semibold">{stats.buyerWins ?? 0}</span></span>
                                                        <span className="text-gray-400">Seller Wins: <span className="text-white font-semibold">{stats.sellerWins ?? 0}</span></span>
                                                        <span className="text-gray-400">Total Cases: <span className="text-white font-semibold">{stats.disputesResolved}</span></span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <button 
                                            onClick={() => handleRemove(arbAddress)} 
                                            disabled={isPending} 
                                            className="ml-4 p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Remove arbitrator"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <AddArbitratorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={refetch}
            />
        </div>
    );
};

export default ArbitratorManagementView;