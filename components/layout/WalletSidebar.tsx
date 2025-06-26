'use client';

import { useWeb3 } from '@/lib/Web3Provider';
import { Copy, Star, X, LogOut, TrendingUp, XCircle, Check } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useReadContracts, useBalance } from 'wagmi';
import { formatUnits, zeroAddress } from 'viem';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { erc20Abi } from 'viem';
import Spinner from '../ui/Spinner';

interface WalletSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TokenBalance {
    symbol: string;
    balance: string;
    address: string;
}

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const WalletSidebar = ({ isOpen, onClose }: WalletSidebarProps) => {
    const { address, userProfile, disconnectWallet, isAuthenticating } = useWeb3();
    const [balances, setBalances] = useState<TokenBalance[]>([]);
    const [isCopied, setIsCopied] = useState(false);

    // 1. Fetch native ETH balance using wagmi's dedicated hook
    const { data: nativeBalance, isLoading: isLoadingNative } = useBalance({ 
        address,
        query: { enabled: isOpen && !!address && !isAuthenticating } 
    });

    // 2. Fetch the list of approved ERC20 token addresses from your contract
    const { data: approvedTokenData, isLoading: isLoadingAddresses } = useReadContracts({
        contracts: [{ ...P2P_CONTRACT_CONFIG, functionName: 'getApprovedTokens' }],
        query: { enabled: isOpen && !!address && !isAuthenticating }
    });
    
    // 3. Prepare a dynamic list of contract calls to get details for each ERC20 token
    const erc20TokenAddresses = useMemo(() => 
        (approvedTokenData?.[0]?.result as `0x${string}`[] || []).filter(addr => addr !== zeroAddress),
        [approvedTokenData]
    );

    const erc20Contracts = useMemo(() =>
        erc20TokenAddresses.flatMap(addr => ([
            { address: addr, abi: erc20Abi, functionName: 'balanceOf', args: [address!] },
            { address: addr, abi: erc20Abi, functionName: 'symbol' },
            { address: addr, abi: erc20Abi, functionName: 'decimals' },
        ])),
        [erc20TokenAddresses, address]
    );

    // 4. Fetch all ERC20 details in a single, efficient batch request
    const { data: erc20Results, isLoading: isLoadingErc20 } = useReadContracts({
        contracts: erc20Contracts,
        query: { enabled: erc20Contracts.length > 0 },
    });

    // 5. Process all results into the final balances state, just like your original code
    useEffect(() => {
        const allBalances: TokenBalance[] = [];
        if (nativeBalance) {
            allBalances.push({
                symbol: nativeBalance.symbol,
                balance: parseFloat(nativeBalance.formatted).toFixed(4),
                address: zeroAddress,
            });
        }

        if (erc20Results) {
            for (let i = 0; i < erc20Results.length; i += 3) {
                const balanceResult = erc20Results[i];
                const symbolResult = erc20Results[i + 1];
                const decimalsResult = erc20Results[i + 2];

                if (balanceResult.status === 'success' && symbolResult.status === 'success' && decimalsResult.status === 'success') {
                    allBalances.push({
                        symbol: symbolResult.result as string,
                        balance: parseFloat(formatUnits(balanceResult.result as bigint, decimalsResult.result as number)).toFixed(4),
                        address: erc20Contracts[i].address,
                    });
                }
            }
        }
        setBalances(allBalances);
    }, [nativeBalance, erc20Results, erc20Contracts]);

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };
    
    // UI state derived from your original component
    const tradeCount = userProfile?.tradeCount || 0;
    const cancellationCount = userProfile?.cancellationCount || 0;
    const averageRating = userProfile?.averageRating || 0;
    const ratingCount = userProfile?.ratingCount || 0;
    const cancellationRate = tradeCount > 0 ? (cancellationCount / tradeCount) * 100 : 0;
    const isLoading = isLoadingNative || isLoadingAddresses || isLoadingErc20;

    return (
        <>
            <div className={`fixed inset-0 bg-black/60 z-40 transition-opacity ease-in-out duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform ease-in-out duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">My Wallet</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-slate-700"><X size={20}/></button>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-800 border border-slate-700">
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-sm text-gray-300">{address ? `${address.substring(0, 8)}...${address.substring(address.length - 6)}` : ''}</span>
                            <button onClick={handleCopy} className="text-gray-400 hover:text-white">
                                {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-gray-400 uppercase tracking-wider mb-2">Portfolio</h3>
                        <div className="space-y-2">
                            {isLoading ? <Spinner text="Loading balances..." /> : (
                                balances.map(token => (
                                    <div key={token.address} className="flex justify-between items-center p-2 bg-slate-800/50 rounded-md">
                                        <div className="flex items-center gap-3">
                                            <img src={`https://effigy.im/a/${token.address}.svg`} alt="" className="h-8 w-8 rounded-full bg-slate-700" />
                                            <span className="font-bold text-white">{token.symbol}</span>
                                        </div>
                                        <span className="font-mono text-gray-300">{token.balance}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <h3 className="text-md font-semibold text-gray-400 uppercase tracking-wider mb-2">Reputation</h3>
                        <div className="space-y-3 p-3 bg-slate-800/50 rounded-md">
                            <div className="flex items-center text-sm">
                                <Star size={16} className="text-yellow-400 mr-3 flex-shrink-0" />
                                <span className="text-slate-300">Seller Rating:</span>
                                <span className="font-semibold text-white ml-auto">{averageRating.toFixed(1)} ({ratingCount})</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <TrendingUp size={16} className="text-green-400 mr-3 flex-shrink-0" />
                                <span className="text-slate-300">Trades Completed:</span>
                                <span className="font-semibold text-white ml-auto">{tradeCount}</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <XCircle size={16} className="text-red-400 mr-3 flex-shrink-0" />
                                <span className="text-slate-300">Cancellation Rate:</span>
                                <span className="font-semibold text-white ml-auto">{cancellationRate.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-6">
                        <button onClick={disconnectWallet} className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                           <LogOut size={16}/> Disconnect
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WalletSidebar;