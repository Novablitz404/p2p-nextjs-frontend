'use client';

import { useReadContracts } from 'wagmi';
import { useState } from 'react';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { useWeb3 } from '@/lib/Web3Provider';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';
import { Settings, DollarSign, Clock, Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import Spinner from '../ui/Spinner';
import FeeManagement from "./FeeManagement";
import TimeoutManagement from "./TimeoutManagement";

const ContractSettingsView = () => {
    const { chainId } = useWeb3();
    const [refreshNonce, setRefreshNonce] = useState(0);
    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };
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

    const formatTimeout = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <Spinner text="Loading contract settings..." />
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
                    <h1 className="text-3xl font-bold text-white mb-2">Contract Settings</h1>
                    <p className="text-gray-400">Configure platform fees, timeouts, and contract parameters</p>
                </div>
                <button 
                    onClick={handleUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Current Settings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-blue-400">Platform Fee</span>
                        <DollarSign size={20} className="text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{currentFee}%</p>
                    <p className="text-xs text-blue-300 mt-1">Transaction fee rate</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-purple-400">Fee Recipient</span>
                        <Shield size={20} className="text-purple-400" />
                    </div>
                    <p className="text-lg font-bold text-white font-mono">
                        {currentRecipient ? 
                            `${currentRecipient.substring(0, 6)}...${currentRecipient.substring(currentRecipient.length - 4)}` : 
                            'Not Set'
                        }
                    </p>
                    <p className="text-xs text-purple-300 mt-1">Fee collection address</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-emerald-400">Buyer Timeout</span>
                        <Clock size={20} className="text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{formatTimeout(currentBuyerTimeout)}</p>
                    <p className="text-xs text-emerald-300 mt-1">Payment deadline</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-yellow-400">Seller Timeout</span>
                        <Clock size={20} className="text-yellow-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">{formatTimeout(currentSellerTimeout)}</p>
                    <p className="text-xs text-yellow-300 mt-1">Release deadline</p>
                </div>
            </div>

            {/* Settings Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Fee Management */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 shadow-lg">
                    <div className="p-6 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <DollarSign size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Fee Management</h2>
                                <p className="text-sm text-gray-400">Configure platform fees and recipient</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <FeeManagement
                            currentFee={currentFee}
                            currentRecipient={currentRecipient}
                            onUpdate={handleUpdate}
                        />
                    </div>
                </div>

                {/* Timeout Management */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 shadow-lg">
                    <div className="p-6 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                                <Clock size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">Timeout Management</h2>
                                <p className="text-sm text-gray-400">Set payment and release deadlines</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <TimeoutManagement
                            currentBuyerTimeout={currentBuyerTimeout}
                            currentSellerTimeout={currentSellerTimeout}
                            onUpdate={handleUpdate}
                        />
                    </div>
                </div>
            </div>

            {/* Contract Information */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 shadow-lg">
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <Settings size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Contract Information</h2>
                            <p className="text-sm text-gray-400">Current contract configuration and status</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-400" />
                                <span className="text-sm text-gray-400">Contract Address:</span>
                                <span className="text-sm font-mono text-white">
                                    {contractAddress.substring(0, 6)}...{contractAddress.substring(contractAddress.length - 4)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-400" />
                                <span className="text-sm text-gray-400">Network:</span>
                                <span className="text-sm text-white">Base Sepolia</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-emerald-400" />
                                <span className="text-sm text-gray-400">Owner:</span>
                                <span className="text-sm text-white">Contract Owner</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-yellow-400" />
                                <span className="text-sm text-gray-400">Settings Access:</span>
                                <span className="text-sm text-white">Owner Only</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-yellow-400" />
                                <span className="text-sm text-gray-400">Last Updated:</span>
                                <span className="text-sm text-white">Recently</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} className="text-yellow-400" />
                                <span className="text-sm text-gray-400">Status:</span>
                                <span className="text-sm text-emerald-400">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractSettingsView;