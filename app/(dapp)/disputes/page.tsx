'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { Trade } from '@/types';
import dynamic from 'next/dynamic';

// Wagmi and Viem Imports
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { config } from '@/lib/config';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';

// Component Imports
import Spinner from '@/components/ui/Spinner';
import DisputeCard from '@/components/web3/DisputeCard';
import NotAuthorizedMessage from '@/components/ui/NotAuthorizedMessage';

const NotificationModal = dynamic(() => import('@/components/ui/NotificationModal'));

const DisputesPage = () => {
    const { address, isArbitrator, isInitializing, isAuthenticating, chainId } = useWeb3();

    const [disputedTrades, setDisputedTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [notification, setNotification] = useState({ isOpen: false, title: '', message: '' });

    const { writeContractAsync, isPending, reset } = useWriteContract();

    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };

    // This useEffect for fetching data is correct
    useEffect(() => {
        if (!isArbitrator || isAuthenticating) {
            setDisputedTrades([]);
            setIsLoading(isArbitrator);
            return;
        }

        setIsLoading(true);
        const q = query(
            collection(db, 'trades'),
            where('status', '==', 'DISPUTED'),
            where('arbitrator', '==', address)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTrades = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
            setDisputedTrades(fetchedTrades);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching disputes:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isArbitrator, isAuthenticating]);

    const handleResolveDispute = async (trade: Trade, winnerAddress: string) => {
        if (!address) return;
        setProcessingId(trade.id);
        
        try {
            setNotification({ isOpen: true, title: "Action Required", message: "Please confirm in your wallet to resolve the dispute." });
            
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'resolveDispute',
                args: [BigInt(trade.onChainId), winnerAddress as `0x${string}`],
            });

            await waitForTransactionReceipt(config, { hash });

            const isBuyerWinner = winnerAddress.toLowerCase() === trade.buyer.toLowerCase();
            const finalStatus = isBuyerWinner ? 'RELEASED' : 'CANCELED';
            
            // Calculate resolution time
            const resolutionTime = trade.disputeRaisedAt ? 
                Math.floor((Date.now() - trade.disputeRaisedAt.toDate().getTime()) / 1000) : 
                undefined;
            
            const tradeUpdateData: { 
                status: string; 
                releaseTxHash?: string;
                arbitratorAddress?: string;
                disputeResolvedAt?: any;
                disputeResolutionTime?: number;
                disputeWinner?: string;
            } = { 
                status: finalStatus,
                arbitratorAddress: address,
                disputeResolvedAt: serverTimestamp(),
                disputeWinner: winnerAddress
            };
            
            if (resolutionTime !== undefined) {
                tradeUpdateData.disputeResolutionTime = resolutionTime;
            }
            
            if (isBuyerWinner) {
                tradeUpdateData.releaseTxHash = hash;
            }
            
            if (isBuyerWinner) {
                const onChainOrder = await readContract(config, {
                    ...P2P_CONTRACT_CONFIG,
                    functionName: 'orders',
                    args: [BigInt(trade.orderId)]
                });

                // FIX: Access the remainingAmount by its index (4) in the returned array.
                const remainingAmount = onChainOrder[4];

                if (remainingAmount === 0n) {
                    const orderQuery = query(collection(db, "orders"), where("onChainId", "==", trade.orderId));
                    const orderSnapshot = await getDocs(orderQuery);
                    
                    if (!orderSnapshot.empty) {
                        const orderDocRef = orderSnapshot.docs[0].ref;
                        await updateDoc(orderDocRef, { status: 'CLOSED', remainingAmount: 0 });
                    }
                }
            }
            await updateDoc(doc(db, "trades", trade.id), tradeUpdateData);
            
            setNotification({ isOpen: true, title: "Success", message: `Dispute for trade #${trade.onChainId} has been resolved.` });
        } catch (error: any) {
            setNotification({ isOpen: true, title: "Resolution Failed", message: error.shortMessage || "The transaction failed." });
        } finally {
            setProcessingId(null);
            reset();
        }
    };

    const isLoadingPage = isInitializing || isAuthenticating;

    if (isLoadingPage) {
        return <div className="text-center py-20"><Spinner text="Verifying permissions..." /></div>;
    }

    if (!isArbitrator) {
        return <div className="max-w-4xl mx-auto"><NotAuthorizedMessage /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Dispute Center</h1>
            
            {isLoading ? (
                <Spinner text="Loading disputed trades..." />
            ) : disputedTrades.length === 0 ? (
                <p className="text-gray-500 text-center py-10 border-2 border-dashed border-slate-700 rounded-lg">
                    There are no active disputes.
                </p>
            ) : (
                <div className="space-y-6">
                    {disputedTrades.map(trade => (
                        <DisputeCard
                            key={trade.id}
                            trade={trade}
                            onResolve={(winner) => handleResolveDispute(trade, winner)}
                            isProcessing={isPending && processingId === trade.id}
                        />
                    ))}
                </div>
            )}
            
            <NotificationModal
                onClose={() => setNotification({ isOpen: false, title: '', message: ''})} 
                {...notification} 
            />
        </div>
    );
};

export default DisputesPage;
