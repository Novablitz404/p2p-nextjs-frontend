'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { CONTRACT_ADDRESSES, SUPPORTED_NETWORKS } from '@/constants';
import { Token } from '@/types';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

// Wagmi and Viem Imports
import { useReadContracts } from 'wagmi';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { erc20Abi, zeroAddress } from 'viem';

// Component Imports
import Spinner from '../ui/Spinner';
import ConnectWalletMessage from '../ui/ConnectWalletMessage';

// Dynamically import dashboards with loading fallbacks
const BuyerDashboard = dynamic(() => import('./BuyerDashboard'), {
    loading: () => <div className="flex justify-center items-center min-h-[40vh]"><Spinner text="Loading..." /></div>,
    ssr: false
});
const SellerDashboard = dynamic(() => import('./SellerDashboard'), {
    loading: () => <div className="flex justify-center items-center min-h-[40vh]"><Spinner text="Loading..." /></div>,
    ssr: false
});

type TabButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  activeColor: string;
  inactiveColor: string;
  icon: React.ComponentType<any>;
};

const TabButton: React.FC<TabButtonProps> = React.memo(({ isActive, onClick, children, activeColor, inactiveColor, icon: Icon }) => (
  <button
    className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-base transition-all duration-200 focus:outline-none
      ${isActive ? `${activeColor} shadow-md` : 'hover:bg-slate-700/40 text-gray-400'}`}
    onClick={onClick}
  >
    <Icon size={20} className={isActive ? activeColor.replace('bg-', 'text-') : 'text-gray-500'} />
    {children}
  </button>
));

const Marketplace = () => {
    const { address, isInitializing, isAuthenticating, userProfile } = useWeb3();
    
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
    const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>([]);
    const [isLoadingFirestore, setIsLoadingFirestore] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);

    const { chainId } = useWeb3();
    const currentNetwork = SUPPORTED_NETWORKS.find(n => n.chainId === chainId) ?? SUPPORTED_NETWORKS[0];
    const nativeToken = currentNetwork.nativeCurrency;
    const contractAddress = CONTRACT_ADDRESSES[chainId ?? 84532];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };
    
    // Memoize contract settings to prevent unnecessary re-renders
    const { data: contractSettings, isLoading: isLoadingContractSettings } = useReadContracts({
        contracts: [
            { ...P2P_CONTRACT_CONFIG, functionName: 'getApprovedTokens' },
            { ...P2P_CONTRACT_CONFIG, functionName: 'sellerReleaseTimeout' },
        ],
        query: { 
            enabled: !isInitializing && !isAuthenticating && !!address,
            staleTime: 30000, // Cache for 30 seconds
            gcTime: 60000, // Keep in cache for 1 minute
        }
    });
    
    const [tokenAddressesResult, sellerTimeoutResult] = contractSettings || [];
    
    // Memoize token addresses to prevent unnecessary re-computations
    const tokenAddresses = useMemo(() => 
        (tokenAddressesResult?.result as `0x${string}`[] || []), 
        [tokenAddressesResult]
    );

    // Memoize token detail contracts to prevent unnecessary re-computations
    const tokenDetailContracts = useMemo(() => 
        tokenAddresses.map(addr => ([
            { address: addr, abi: erc20Abi, functionName: 'symbol' },
            { address: addr, abi: erc20Abi, functionName: 'decimals' },
        ])).flat(),
        [tokenAddresses]
    );

    const { data: tokenDetails, isLoading: isLoadingTokenDetails } = useReadContracts({
        contracts: tokenDetailContracts,
        query: { 
            enabled: tokenAddresses.length > 0,
            staleTime: 30000,
            gcTime: 60000,
        },
    });

    // Memoize approved tokens list to prevent unnecessary re-computations
    const approvedTokensList = useMemo(() => {
        const nativeTokenObj: Token = { address: zeroAddress, symbol: nativeToken.symbol, decimals: nativeToken.decimals };
        if (!tokenDetails) return [nativeTokenObj];

        const erc20Tokens: Token[] = [];
        for (let i = 0; i < tokenDetails.length; i += 2) {
            const symbolResult = tokenDetails[i];
            const decimalsResult = tokenDetails[i + 1];

            if (symbolResult.status === 'success' && decimalsResult.status === 'success') {
                const address = tokenDetailContracts[i].address;
                erc20Tokens.push({
                    address,
                    symbol: symbolResult.result as string,
                    decimals: Number(decimalsResult.result),
                });
            }
        }
        return [nativeTokenObj, ...erc20Tokens];
    }, [tokenDetails, tokenDetailContracts, nativeToken]);

    // Memoize Firestore data fetching to prevent unnecessary calls
    const fetchFirestoreData = useCallback(async () => {
        if (isInitializing || isAuthenticating) return;
        
        setIsLoadingFirestore(true);
        try {
            const currenciesDocRef = doc(db, "platformConfig", "supportedCurrencies");
            const currenciesDocSnap = await getDoc(currenciesDocRef);
            if (currenciesDocSnap.exists()) {
                setSupportedCurrencies(currenciesDocSnap.data().fiat || []);
            }
        } catch (err) {
            console.error("Failed to fetch Firestore configuration:", err);
        } finally {
            setIsLoadingFirestore(false);
            setHasInitialized(true);
        }
    }, [isInitializing, isAuthenticating]);

    useEffect(() => {
        fetchFirestoreData();
    }, [fetchFirestoreData]);

    // Memoize loading state to prevent unnecessary re-renders
    const isLoading = useMemo(() => 
        isInitializing || isAuthenticating || isLoadingFirestore || isLoadingContractSettings || !hasInitialized,
        [isInitializing, isAuthenticating, isLoadingFirestore, isLoadingContractSettings, hasInitialized]
    );

    // Memoize tab change handler to prevent unnecessary re-renders
    const handleTabChange = useCallback((tab: 'buy' | 'sell') => {
        setActiveTab(tab);
    }, []);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-center py-20 bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/70 shadow-2xl w-full max-w-2xl">
                    <Spinner text="Loading Market Data..." />
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex justify-center items-center min-h-[70vh] w-full px-2">
            {!address ? (
                <ConnectWalletMessage />
            ) : (
                <div className="relative w-full max-w-2xl bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-700/70 shadow-2xl p-0 sm:p-0 overflow-hidden transition-all duration-300">
                    {/* Modern Tab Bar */}
                    <div className="flex justify-center gap-2 py-4 bg-slate-900/60 border-b border-slate-700/60">
                        <TabButton
                            isActive={activeTab === 'buy'}
                            onClick={() => handleTabChange('buy')}
                            icon={ArrowDownCircle}
                            activeColor="bg-emerald-500/20 text-emerald-300"
                            inactiveColor="text-gray-400"
                        >
                            Buy
                        </TabButton>
                        <TabButton
                            isActive={activeTab === 'sell'}
                            onClick={() => handleTabChange('sell')}
                            icon={ArrowUpCircle}
                            activeColor="bg-red-500/20 text-red-300"
                            inactiveColor="text-gray-400"
                        >
                            Sell
                        </TabButton>
                    </div>
                    {/* Animated Underline */}
                    <div className="relative h-1 w-full">
                        <div className={`absolute left-0 top-0 h-1 rounded-full transition-all duration-300 ${activeTab === 'buy' ? 'w-1/2 translate-x-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400' : 'w-1/2 translate-x-full bg-gradient-to-r from-red-400 via-red-500 to-red-400'}`}></div>
                    </div>
                    <div className="p-6 sm:p-8">
                        {activeTab === 'buy' ? (
                            <BuyerDashboard 
                                key="buyer-dashboard"
                                userId={address} 
                                tokenList={approvedTokensList}
                                isLoadingTokens={isLoadingTokenDetails}
                                supportedCurrencies={supportedCurrencies}
                            />
                        ) : (
                            <SellerDashboard 
                                key="seller-dashboard"
                                userId={address}
                                tokenList={approvedTokensList}
                                isLoadingTokens={isLoadingTokenDetails}
                                supportedCurrencies={supportedCurrencies}
                                userProfile={userProfile}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(Marketplace);