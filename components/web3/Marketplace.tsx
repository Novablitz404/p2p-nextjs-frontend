'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { Token } from '@/types';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';

// Wagmi and Viem Imports
import { useReadContracts } from 'wagmi';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { erc20Abi, zeroAddress } from 'viem';

// Component Imports
import TabButton from '../ui/TabButton';
import Spinner from '../ui/Spinner';
import ConnectWalletMessage from '../ui/ConnectWalletMessage';

// Dynamically import dashboards
const BuyerDashboard = dynamic(() => import('./BuyerDashboard'));
const SellerDashboard = dynamic(() => import('./SellerDashboard'));

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const Marketplace = () => {
    // FIX: Get userProfile from the useWeb3 hook
    const { address, isInitializing, isAuthenticating, userProfile } = useWeb3();
    
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
    
    const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>([]);
    const [isLoadingFirestore, setIsLoadingFirestore] = useState(true);

    const { data: contractSettings, isLoading: isLoadingContractSettings } = useReadContracts({
        contracts: [
            { ...P2P_CONTRACT_CONFIG, functionName: 'getApprovedTokens' },
            { ...P2P_CONTRACT_CONFIG, functionName: 'sellerReleaseTimeout' },
        ],
        query: { enabled: !isInitializing && !isAuthenticating }
    });
    
    const [tokenAddressesResult, sellerTimeoutResult] = contractSettings || [];
    
    const tokenAddresses = useMemo(() => 
        (tokenAddressesResult?.result as `0x${string}`[] || []), 
        [tokenAddressesResult]
    );

    const tokenDetailContracts = useMemo(() => 
        tokenAddresses.map(addr => ([
            { address: addr, abi: erc20Abi, functionName: 'symbol' },
            { address: addr, abi: erc20Abi, functionName: 'decimals' },
        ])).flat(),
        [tokenAddresses]
    );

    const { data: tokenDetails, isLoading: isLoadingTokenDetails } = useReadContracts({
        contracts: tokenDetailContracts,
        query: { enabled: tokenAddresses.length > 0 },
    });

    const approvedTokensList = useMemo(() => {
        const nativeToken: Token = { address: zeroAddress, symbol: 'ETH', decimals: 18 };
        if (!tokenDetails) return [nativeToken];

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
        return [nativeToken, ...erc20Tokens];
    }, [tokenDetails, tokenDetailContracts]);

    useEffect(() => {
        if (isInitializing || isAuthenticating) return;
        const fetchFirestoreData = async () => {
            setIsLoadingFirestore(true);
            try {
                const currenciesDocRef = doc(db, "platformConfig", "supportedCurrencies");
                const currenciesDocSnap = await getDoc(currenciesDocRef);
                if (currenciesDocSnap.exists()) setSupportedCurrencies(currenciesDocSnap.data().fiat || []);
            } catch (err) {
                console.error("Failed to fetch Firestore configuration:", err);
            } finally {
                setIsLoadingFirestore(false);
            }
        };
        fetchFirestoreData();
    }, [isInitializing, isAuthenticating]);

    const isLoading = isInitializing || isAuthenticating || isLoadingFirestore || isLoadingContractSettings;

    if (isLoading) {
        return (
            <div className="text-center py-20 bg-slate-800 rounded-2xl border border-slate-700">
                <Spinner text="Loading Market Data..." />
            </div>
        );
    }
    
    return (
        <div className="font-sans">
            <div className="max-w-4xl mx-auto">
                <main>
                    {!address ? (
                        <ConnectWalletMessage />
                    ) : (
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-lg">
                            <div className="flex border-b border-slate-700">
                                <TabButton id="buy" activeTab={activeTab} setActiveTab={setActiveTab} color="emerald">Buy</TabButton>
                                <TabButton id="sell" activeTab={activeTab} setActiveTab={setActiveTab} color="red">Sell</TabButton>
                            </div>
                            <div className="p-6 sm:p-8">
                                {activeTab === 'buy' ? 
                                <BuyerDashboard 
                                    userId={address} 
                                    tokenList={approvedTokensList}
                                    isLoadingTokens={isLoadingTokenDetails}
                                    supportedCurrencies={supportedCurrencies}
                                /> : 
                                <SellerDashboard 
                                    userId={address}
                                    tokenList={approvedTokensList}
                                    isLoadingTokens={isLoadingTokenDetails}
                                    supportedCurrencies={supportedCurrencies}
                                    // FIX: Pass the userProfile prop
                                    userProfile={userProfile}
                                />
                                }
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Marketplace;