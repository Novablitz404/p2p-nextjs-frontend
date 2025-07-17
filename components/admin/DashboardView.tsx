'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import StatCard from '@/components/ui/StatCard';
import { Gem, Percent, Wallet, Users, CheckCircle, BarChart, XCircle, Pause, Play } from 'lucide-react';
import Spinner from '../ui/Spinner';
import { useReadContracts, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { zeroAddress } from 'viem';
import { config } from '@/lib/config';
import useSWR from 'swr';
// FIX: Import LineChart and Line components
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

// A dedicated component for our chart
const TradeActivityChart = () => {
    const { data, error } = useSWR('/api/getTradeStats', fetcher, { refreshInterval: 60000 });

    if (!data && !error) {
        return <div className="h-72 flex justify-center items-center bg-slate-800 rounded-lg border border-slate-700"><Spinner text="Loading chart data..." /></div>;
    }
    
    if (error) {
        return <div className="h-72 flex justify-center items-center text-red-400 bg-slate-800 rounded-lg border border-slate-700">Failed to load chart data.</div>;
    }

    return (
        <div className="h-72 bg-slate-800 p-4 rounded-lg border border-slate-700">
            <ResponsiveContainer width="100%" height="100%">
                {/* FIX: Changed from BarChart to LineChart */}
                <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="Date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                    <Legend wrapperStyle={{ fontSize: '14px' }}/>
                    {/* FIX: Use two <Line> components instead of <Bar> */}
                    <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Cancelled" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const DashboardView = () => {
    const { isInitializing, isAuthenticating, chainId } = useWeb3();
    const [stats, setStats] = useState({
        tokenCount: 0,
        feeBps: '...',
        feeRecipient: '...',
        userCount: 0,
        openOrders: 0,
        completedTrades: 0,
        cancelledTrades: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState<boolean | null>(null);

    const { writeContractAsync, isPending: isPausePending, reset } = useWriteContract();

    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };

    const { data: onChainData, isLoading: isLoadingOnChain, isError: isOnChainError } = useReadContracts({
        contracts: [
            { ...P2P_CONTRACT_CONFIG, functionName: 'getApprovedTokens' },
            { ...P2P_CONTRACT_CONFIG, functionName: 'platformFeeBps' },
            { ...P2P_CONTRACT_CONFIG, functionName: 'feeRecipient' },
            { ...P2P_CONTRACT_CONFIG, functionName: 'paused' },
        ],
        query: { enabled: !isInitializing && !isAuthenticating }
    });

    // Extract pause status from onChainData
    useEffect(() => {
        if (onChainData && onChainData[3]?.result !== undefined) {
            setIsPaused(onChainData[3].result as boolean);
        }
    }, [onChainData]);

    const handlePause = async () => {
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'pause',
            });
            await waitForTransactionReceipt(config, { hash });
            setIsPaused(true);
        } catch (error: any) {
            console.error('Failed to pause contract:', error);
        } finally {
            reset();
        }
    };

    const handleUnpause = async () => {
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'unpause',
            });
            await waitForTransactionReceipt(config, { hash });
            setIsPaused(false);
        } catch (error: any) {
            console.error('Failed to unpause contract:', error);
        } finally {
            reset();
        }
    };

    useEffect(() => {
        if (isInitializing || isAuthenticating) return;
        
        const fetchStats = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const usersQuery = query(collection(db, "users"));
                const openOrdersQuery = query(collection(db, "orders"), where("status", "==", "OPEN"));
                const completedTradesQuery = query(collection(db, "trades"), where("status", "==", "RELEASED"));
                const cancelledTradesQuery = query(collection(db, "trades"), where("status", "==", "CANCELED"));

                const [usersSnap, openOrdersSnap, completedTradesSnap, cancelledTradesSnap] = await Promise.all([
                    getCountFromServer(usersQuery),
                    getCountFromServer(openOrdersQuery),
                    getCountFromServer(completedTradesQuery),
                    getCountFromServer(cancelledTradesQuery),
                ]);

                const [tokensResult, feeResult, recipientResult] = onChainData || [];

                const tokenCount = (tokensResult?.result as `0x${string}`[] || []).filter(addr => addr !== zeroAddress).length;
                const feeBps = feeResult?.result ? (Number(feeResult.result) / 100).toFixed(2) : 'N/A';
                const feeRecipient = recipientResult?.result ? `${recipientResult.result.substring(0, 6)}...${recipientResult.result.substring(recipientResult.result.length - 4)}` : 'N/A';

                setStats({
                    tokenCount, feeBps, feeRecipient,
                    userCount: usersSnap.data().count,
                    openOrders: openOrdersSnap.data().count,
                    completedTrades: completedTradesSnap.data().count,
                    cancelledTrades: cancelledTradesSnap.data().count,
                });
            } catch (err: any) {
                console.error("Failed to fetch admin stats:", err);
                setError("Failed to load dashboard data. Please refresh the page.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [isInitializing, isAuthenticating, onChainData]);

    const isDashboardLoading = isLoading || (isLoadingOnChain && !onChainData);

    if (isDashboardLoading) {
        return <div className="flex justify-center items-center h-full"><Spinner text="Loading dashboard stats..." /></div>;
    }

    if (error || isOnChainError) {
        return <div className="flex justify-center items-center h-full text-red-500">{error || "Failed to load on-chain data."}</div>;
    }

    return (
        <div className="pb-8">
             <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
             
             {/* Pause/Unpause Controls */}
             <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-2">Contract Status</h2>
                        <p className="text-sm text-gray-400">
                            {isPaused === null ? 'Loading...' : 
                             isPaused ? 'Contract is currently paused' : 'Contract is active and running'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {isPaused ? (
                            <button
                                onClick={handleUnpause}
                                disabled={isPausePending}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                            >
                                {isPausePending ? <Spinner /> : <Play size={16} />}
                                {isPausePending ? 'Unpausing...' : 'Unpause Contract'}
                            </button>
                        ) : (
                            <button
                                onClick={handlePause}
                                disabled={isPausePending}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                            >
                                {isPausePending ? <Spinner /> : <Pause size={16} />}
                                {isPausePending ? 'Pausing...' : 'Pause Contract'}
                            </button>
                        )}
                    </div>
                </div>
             </div>
             
             <div className="mb-6">
                <TradeActivityChart />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Users" value={stats.userCount.toString()} icon={<Users size={20} />} />
                <StatCard title="Open Orders" value={stats.openOrders.toString()} icon={<BarChart size={20} />} />
                <StatCard title="Completed Trades" value={stats.completedTrades.toString()} icon={<CheckCircle size={20} />} />
                <StatCard title="Cancelled Trades" value={stats.cancelledTrades.toString()} icon={<XCircle size={20} />} />
                <StatCard title="Approved Tokens" value={stats.tokenCount.toString()} icon={<Gem size={20} />} />
                <StatCard title="Platform Fee" value={`${stats.feeBps}%`} icon={<Percent size={20} />} />
                <StatCard title="Fee Recipient" value={stats.feeRecipient} icon={<Wallet size={20} />} />
            </div>
        </div>
    );
};

export default DashboardView;