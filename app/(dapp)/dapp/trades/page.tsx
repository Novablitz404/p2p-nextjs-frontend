'use client';

import { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, deleteField, serverTimestamp, addDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Trade } from '@/types';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/lib/NotificationProvider';

// Wagmi and Viem Imports
import { useWriteContract, useReadContracts } from 'wagmi';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { config } from '@/lib/config';
import { formatUnits } from 'viem';

// Component Imports
import BuyerTradeCard from '@/components/web3/BuyerTradeCard';
import TradeCard from '@/components/web3/TradeCard';
import Spinner from '@/components/ui/Spinner';
import TradeHistoryCard from '@/components/web3/TradeHistoryCard';
import ConnectWalletMessage from '@/components/ui/ConnectWalletMessage';

const NotificationModal = dynamic(() => import('@/components/ui/NotificationModal'));
const PaymentInstructionsModal = dynamic(() => import('@/components/web3/PaymentInstructionsModal'));
const ImageViewModal = dynamic(() => import('@/components/ui/ImageViewModal'));
const LeaveReviewModal = dynamic(() => import('@/components/modals/LeaveReviewModal'));
const FundsReleasedModal = dynamic(() => import('@/components/modals/FundsReleasedModal'));
const DisputeExplanationModal = dynamic(() => import('@/components/modals/DisputeExplanationModal'));

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

const TradesPage = () => {
    const router = useRouter();
    const { addNotification } = useNotification();
    const { address, isInitializing, isAuthenticating } = useWeb3();
    const { writeContractAsync, isPending, reset } = useWriteContract();
    
    // State Management (copied from your file)
    const [buyTrades, setBuyTrades] = useState<Trade[]>([]);
    const [sellTrades, setSellTrades] = useState<Trade[]>([]);
    const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [processingTradeId, setProcessingTradeId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ isOpen: boolean; title: string; message: string; action?: { text: string; onClick: () => void; }; }>({ isOpen: false, title: '', message: '' });
    const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isConfirmingFiat, setIsConfirmingFiat] = useState(false); // Note: isPending from wagmi can also handle this
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [tradeToReview, setTradeToReview] = useState<Trade | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const TRADES_PER_PAGE = 6;
    const [releasedTrade, setReleasedTrade] = useState<Trade | null>(null);
    const [isReleasedModalOpen, setIsReleasedModalOpen] = useState(false);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
    const [disputeTrade, setDisputeTrade] = useState<Trade | null>(null);
    
    // This ref helps us track the previous state of the trades
    const previousBuyTrades = useRef<Trade[]>([]);

    // Fetch on-chain timeouts efficiently with wagmi's useReadContracts
    const { data: timeoutData } = useReadContracts({
        contracts: [
            { ...P2P_CONTRACT_CONFIG, functionName: 'buyerPaymentTimeout' },
            { ...P2P_CONTRACT_CONFIG, functionName: 'sellerReleaseTimeout' },
        ],
        query: { enabled: !!address }
    });
    const [buyerPaymentTimeout, sellerReleaseTimeout] = timeoutData?.map(d => d.status === 'success' ? Number(d.result) : null) ?? [null, null];

    // --- UNCHANGED HANDLERS (Firebase Storage and Reviews) ---
    const handleUploadProof = async (file: File) => {
        if (!activeTrade || !address) return;
        const filePath = `proofs/${address}/${activeTrade.id}/${file.name}`;
        const storageRef = ref(storage, filePath);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await updateDoc(doc(db, "trades", activeTrade.id), {
                proofOfPaymentURL: downloadURL,
                proofFilePath: filePath,
            });
            setNotification({ isOpen: true, title: "Success!", message: "Proof of payment has been uploaded." });
        } catch (error) {
            setNotification({ isOpen: true, title: "Upload Failed", message: "Could not upload your file." });
        }
    };

    const handleDeleteProof = async (trade: Trade) => {
        if (!trade.proofFilePath) return;
        if (!window.confirm("Are you sure you want to delete this proof?")) return;
        const fileRef = ref(storage, trade.proofFilePath);
        try {
            await deleteObject(fileRef);
            await updateDoc(doc(db, "trades", trade.id), {
                proofOfPaymentURL: deleteField(),
                proofFilePath: deleteField(),
            });
            setNotification({ isOpen: true, title: "Deleted", message: "Previous proof removed." });
        } catch (error: any) {
            setNotification({ isOpen: true, title: "Delete Failed", message: error.message });
        }
    };

    const handleLeaveReview = async (rating: number, comment: string) => {
        if (!tradeToReview || !address) return;
        try {
            await addDoc(collection(db, "reviews"), {
                tradeId: tradeToReview.id,
                reviewerId: address,
                revieweeId: address === tradeToReview.buyer ? tradeToReview.seller : tradeToReview.buyer,
                rating: rating,
                comment: comment,
                createdAt: serverTimestamp(),
            });
            await updateDoc(doc(db, "trades", tradeToReview.id), { reviewLeft: true });
            setNotification({ isOpen: true, title: "Success", message: "Your review has been submitted! Thank you." });
        } catch (error) {
            console.error("Review submission error:", error);
            setNotification({ isOpen: true, title: "Error", message: "Could not submit your review." });
        }
    };

    const handleViewProof = (url: string) => setViewingImageUrl(url);
    const handleOpenReviewModal = (trade: Trade) => { setTradeToReview(trade); setIsReviewModalOpen(true); };
    const handleViewTradeDetails = (trade: Trade) => { if (trade.buyer === address) { setActiveTrade(trade); setIsPaymentModalOpen(true); } };

    // --- REFACTORED WEB3 HANDLERS ---
    const handleConfirmFiatSent = async (trade: Trade) => {
        setProcessingTradeId(trade.id);
        setIsConfirmingFiat(true);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'confirmFiatSent',
                args: [BigInt(trade.onChainId)],
            });
            await waitForTransactionReceipt(config, { hash });
            await updateDoc(doc(db, "trades", trade.id), { status: 'FIAT_PAID', fiatSentAt: serverTimestamp() });          
            setNotification({ 
                isOpen: true, 
                title: "Payment Confirmed", 
                message: "The seller has been notified."
            });
        } catch (error: any) {
            setNotification({ isOpen: true, title: "Action Failed", message: error.shortMessage || "Could not confirm payment." });
        } finally {
            setProcessingTradeId(null);
            setIsConfirmingFiat(false);
            reset();
        }
    };

    const handleCancelTradeByBuyer = async (trade: Trade) => {
        if (!window.confirm("Are you sure you want to cancel this trade? This action cannot be undone.")) return;
        setProcessingTradeId(trade.id);
        try {
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'cancelLockedTradeByBuyer',
                args: [BigInt(trade.onChainId)],
            });
            await waitForTransactionReceipt(config, { hash });
            await updateDoc(doc(db, "trades", trade.id), { status: 'CANCELED', cancellationTxHash: hash });
            setNotification({ 
                isOpen: true, 
                title: "Trade Canceled", 
                message: "Your trade has been successfully canceled." 
            });
            setIsPaymentModalOpen(false);
        } catch (error: any) {
            console.error("Cancellation Error:", error);
            setNotification({ isOpen: true, title: "Action Failed", message: error.shortMessage || "Could not cancel trade." });
        } finally {
            setProcessingTradeId(null);
            reset();
        }
    };

    const handleDispute = async (trade: Trade) => {
        setDisputeTrade(trade);
        setIsDisputeModalOpen(true);
    };

    const handleDisputeWithExplanation = async (explanation: string) => {
        if (!disputeTrade) return;
        
        setProcessingTradeId(disputeTrade.id);
        try {
            const hash = await writeContractAsync({ 
                ...P2P_CONTRACT_CONFIG, 
                functionName: 'raiseDispute', 
                args: [BigInt(disputeTrade.onChainId)] 
            });
            
            await waitForTransactionReceipt(config, { hash });
            
            // Update trade with dispute information
            await updateDoc(doc(db, "trades", disputeTrade.id), { 
                status: 'DISPUTED',
                disputeExplanation: explanation,
                disputeRaisedAt: serverTimestamp(),
                disputeRaisedBy: address
            });
            
            setNotification({ 
                isOpen: true, 
                title: "Dispute Raised", 
                message: "An arbitrator will review your case." 
            });
            setIsPaymentModalOpen(false);
            setIsDisputeModalOpen(false);
            setDisputeTrade(null);
        } catch (error: any) {
            setNotification({ 
                isOpen: true, 
                title: "Failed", 
                message: error.shortMessage || "Could not raise dispute." 
            });
        } finally {
            setProcessingTradeId(null);
            reset();
        }
    };

    const handleReleaseFunds = async (trade: Trade) => {
        setProcessingTradeId(trade.id);
        try {

            const hash = await writeContractAsync({ ...P2P_CONTRACT_CONFIG, functionName: 'releaseFundsForTrade', args: [BigInt(trade.onChainId)] });
            await waitForTransactionReceipt(config, { hash });
            
            // Start a batch write to Firestore
            const batch = writeBatch(db);

            // 1. Update the trade status
            const tradeRef = doc(db, "trades", trade.id);
            batch.update(tradeRef, { status: 'RELEASED', releaseTxHash: hash });

            // 2. Check the parent order's status from the blockchain
            const onChainOrder = await readContract(config, {
                ...P2P_CONTRACT_CONFIG,
                functionName: 'orders',
                args: [BigInt(trade.orderId)]
            });
            
            const remainingAmount = onChainOrder[4]; // remainingAmount is at index 4

            // 3. If the remaining amount is zero, close the order in Firestore
            if (remainingAmount === 0n) {
                const orderRef = doc(db, "orders", trade.orderId);
                batch.update(orderRef, { status: 'CLOSED', remainingAmount: 0 });
            }

            // 4. Commit all changes at once
            await batch.commit();
            
        } catch (error: any) {
            setNotification({ isOpen: true, title: "Release Failed", message: error.shortMessage || "The transaction failed." });
        } finally {
            setProcessingTradeId(null);
            reset();
        }
    };
    
    // --- THIS IS A CHANGE ---
    // This useEffect hook detects when a buyer's trade is completed.
    useEffect(() => {
        if (!address) return;

        // Find trades that just changed from 'FIAT_PAID' to 'RELEASED'
        const justReleasedTrade = buyTrades.find(currentTrade => 
            currentTrade.status === 'RELEASED' &&
            previousBuyTrades.current.some(prevTrade => 
                prevTrade.id === currentTrade.id && prevTrade.status === 'FIAT_PAID'
            )
        );

        if (justReleasedTrade) {
            setReleasedTrade(justReleasedTrade);
            setIsReleasedModalOpen(true);
        }

        // Update the ref to the current trades for the next render
        previousBuyTrades.current = buyTrades;
    }, [buyTrades, address]);
    
    // --- UNCHANGED DATA FETCHING & UI LOGIC ---
    useEffect(() => {
        if (!address || isAuthenticating) {
            setIsLoading(true);
            setIsLoadingHistory(true);
            setBuyTrades([]);
            setSellTrades([]);
            setTradeHistory([]);
            return;
        }

        const activeStatuses = ['LOCKED', 'FIAT_PAID', 'DISPUTED'];
        const completedStatuses = ['RELEASED', 'CANCELED'];

        const createQuery = (field: 'buyer' | 'seller', statuses: string[]) => {
            return query(collection(db, 'trades'), where(field, '==', address), where('status', 'in', statuses));
        };

        const unsubActiveBuyer = onSnapshot(createQuery('buyer', activeStatuses), (snapshot) => {
            setBuyTrades(snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as Trade)));
            setIsLoading(false);
        });
        const unsubActiveSeller = onSnapshot(createQuery('seller', activeStatuses), (snapshot) => {
            setSellTrades(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Trade)));
            setIsLoading(false);
        });

        const unsubHistoryBuyer = onSnapshot(createQuery('buyer', completedStatuses), (snapshot) => {
            const buyerHistory = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Trade));
            setTradeHistory(prev => [...prev.filter(t => t.seller === address), ...buyerHistory].sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
            setIsLoadingHistory(false);
        });
        const unsubHistorySeller = onSnapshot(createQuery('seller', completedStatuses), (snapshot) => {
            const sellerHistory = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Trade));
            setTradeHistory(prev => [...prev.filter(t => t.buyer === address), ...sellerHistory].sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
            setIsLoadingHistory(false);
        });
        
        return () => {
            unsubActiveBuyer();
            unsubActiveSeller();
            unsubHistoryBuyer();
            unsubHistorySeller();
        };
    }, [address, isAuthenticating]);
    
    const allTrades = [...buyTrades, ...sellTrades].sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));

    useEffect(() => {
        if (activeTrade && isPaymentModalOpen) {
            const updatedTrade = allTrades.find(t => t.id === activeTrade.id);
            if (updatedTrade) {
                if (JSON.stringify(updatedTrade) !== JSON.stringify(activeTrade)) {
                    setActiveTrade(updatedTrade);
                }
            } else {
                setIsPaymentModalOpen(false);
                setActiveTrade(null);
            }
        }
    }, [allTrades, activeTrade, isPaymentModalOpen]);

    const indexOfLastTrade = currentPage * TRADES_PER_PAGE;
    const indexOfFirstTrade = indexOfLastTrade - TRADES_PER_PAGE;
    const currentTradeHistory = tradeHistory.slice(indexOfFirstTrade, indexOfLastTrade);
    const totalPages = Math.ceil(tradeHistory.length / TRADES_PER_PAGE);

    if (isInitializing || isAuthenticating) {
        return <div className="max-w-4xl mx-auto"><Spinner text="Loading your trades..." /></div>;
    }

    if (!address) {
        return <div className="max-w-4xl mx-auto"><ConnectWalletMessage /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">My Active Trades</h1>
            {isLoading ? (
                <Spinner text="Loading your trades..." />
            ) : allTrades.length === 0 ? (
                <p className="text-gray-500 text-center py-10 border-2 border-dashed border-slate-700 rounded-lg">
                    You have no active trades that require action.
                </p>
            ) : (
                <div className="space-y-6">
                {allTrades.map(trade => {
                    const isProcessing = isPending && processingTradeId === trade.id;
                    if (trade.seller === address) {
                        return (
                            <TradeCard 
                                key={trade.id}
                                trade={trade}
                                onRelease={handleReleaseFunds}
                                onDispute={handleDispute}
                                onViewProof={handleViewProof}
                                disputeTimeout={buyerPaymentTimeout}
                                isProcessing={isProcessing}
                            />
                        );
                    }
                    if (trade.buyer === address) {
                        return (
                            <BuyerTradeCard
                                key={trade.id}
                                trade={trade}
                                onClick={() => handleViewTradeDetails(trade)}
                                releaseTimeout={sellerReleaseTimeout}
                                isProcessing={isProcessing}
                            />
                        );
                    }
                    return null;
                })}
                </div>
            )}

            <div className="mt-16">
                <h2 className="text-2xl font-bold text-white mb-6">Trade History</h2>
                {isLoadingHistory ? (
                    <Spinner text="Loading history..." />
                ) : tradeHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-10 border-2 border-dashed border-slate-700 rounded-lg">
                        You have no completed trades.
                    </p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentTradeHistory.map(trade => (
                                <TradeHistoryCard 
                                    key={trade.id}
                                    trade={trade}
                                    currentUserAddress={address!}
                                    onLeaveReview={handleOpenReviewModal}
                                />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-8">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Previous
                                </button>
                                <span className="text-gray-400">Page {currentPage} of {totalPages}</span>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <FundsReleasedModal
                isOpen={isReleasedModalOpen}
                onClose={() => setIsReleasedModalOpen(false)}
                trade={releasedTrade}
            />
            
            <PaymentInstructionsModal 
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                activeTrade={activeTrade}
                onConfirmFiat={async () => { if (activeTrade) await handleConfirmFiatSent(activeTrade); }}
                onCancelTrade={async () => { if (activeTrade) await handleCancelTradeByBuyer(activeTrade); }}
                onUploadProof={handleUploadProof}
                onDeleteProof={async () => { if (activeTrade) await handleDeleteProof(activeTrade); }}
                onDispute={async () => { if (activeTrade) await handleDispute(activeTrade); }}
                isConfirmingFiat={isPending && processingTradeId === activeTrade?.id}
                releaseTimeout={sellerReleaseTimeout}
            />
            <DisputeExplanationModal
                isOpen={isDisputeModalOpen}
                onClose={() => {
                    setIsDisputeModalOpen(false);
                    setDisputeTrade(null);
                }}
                onConfirm={handleDisputeWithExplanation}
                trade={disputeTrade}
                isProcessing={isPending && processingTradeId === disputeTrade?.id}
            />
            <NotificationModal
                onClose={() => setNotification({ isOpen: false, title: '', message: ''})} 
                {...notification} 
            />
            <ImageViewModal 
                isOpen={!!viewingImageUrl}
                onClose={() => setViewingImageUrl(null)}
                imageUrl={viewingImageUrl || ''}
            />
            <LeaveReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                onSubmit={handleLeaveReview}
            />
        </div>
    );
};

export default TradesPage;