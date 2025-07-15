'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Order } from '@/types';
import dynamic from 'next/dynamic';
import { Fragment } from 'react';

// Wagmi and Viem Imports
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow'; // Make sure this is the Typescript version
import { erc20Abi } from 'viem';
import { config } from '@/lib/config';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID, MAX_UINT256 } from '@/constants';

// Component Imports
import OrderCard from '@/components/web3/OrderCard';
import Spinner from '@/components/ui/Spinner';
import NotificationModal from '@/components/ui/NotificationModal';
import ConnectWalletMessage from '@/components/ui/ConnectWalletMessage';
import TradeCardSkeleton from '@/components/ui/TradeCardSkeleton';

const OrdersPage = () => {
    // State Management
    const { address, isInitializing, isAuthenticating, chainId } = useWeb3();
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [notification, setNotification] = useState({ isOpen: false, title: '', message: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const ORDERS_PER_PAGE = 6;

    // Wagmi hook for all write transactions
    const { writeContractAsync, isPending, reset } = useWriteContract();

    // Data fetching from Firestore (Unchanged)
    useEffect(() => {
        if (!address || isAuthenticating) {
            setMyOrders([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const q = query(collection(db, 'orders'), where('seller', '==', address));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Order, 'id'>)}));
            fetchedOrders.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
            setMyOrders(fetchedOrders);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [address, isAuthenticating]);


    // --- REFACTORED WEB3 HANDLERS ---

    const handleFundEscrow = async (order: Order) => {
        if (order.orderType !== 'ERC20' || order.status !== 'PENDING') return;
        setProcessingId(order.id);
        try {
            const amountInWei = parseUnits(order.totalAmount.toString(), order.tokenDecimals);
            const platformFeeBps = await readContract(config, {
                ...P2P_CONTRACT_CONFIG,
                functionName: 'platformFeeBps',
            });
            const feeAmount = (amountInWei * platformFeeBps) / 10000n;
            const totalAmountToApprove = amountInWei + feeAmount;

            setNotification({ isOpen: true, title: "Action (1/2)", message: "Please approve the token transfer with maximum allocation." });
            
            const approveHash = await writeContractAsync({
                address: order.tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'approve',
                args: [P2P_CONTRACT_CONFIG.address, MAX_UINT256],
            });
            await waitForTransactionReceipt(config, { hash: approveHash });

            setNotification({ isOpen: true, title: "Action (2/2)", message: "Please confirm to fund the escrow." });

            // -------------------------------------------------------------------
            // TODO: CRITICAL FIX REQUIRED
            // The function "fundEscrow" was not found in your P2PEscrow.json file.
            // Please replace "YOUR_CORRECT_FUNCTION_NAME" with the correct function name from your contract.
            // -------------------------------------------------------------------
            const fundHash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'createAndFundOrder', // Example placeholder, please verify!
                args: [order.tokenAddress as `0x${string}`, amountInWei], // Example arguments, please verify!
            });
            await waitForTransactionReceipt(config, { hash: fundHash });
            
            await updateDoc(doc(db, "orders", order.id), { status: 'OPEN' });
            setNotification({ isOpen: true, title: "Success!", message: `Order #${order.onChainId} is now active!` });
        } catch (error: any) {
            setNotification({ isOpen: true, title: "Funding Failed", message: error.shortMessage || "The transaction failed." });
        } finally {
            setProcessingId(null);
            reset();
        }
    };

    const handleCancelOrder = async (order: Order) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        setProcessingId(order.id);
        try {
            setNotification({ isOpen: true, title: "Action Required", message: "Please confirm in your wallet to cancel." });
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'cancelOrder',
                args: [BigInt(order.onChainId)],
            });
            await waitForTransactionReceipt(config, { hash });
            await updateDoc(doc(db, "orders", order.id), { status: 'CANCELED' });
            setNotification({ isOpen: true, title: "Success", message: "Your order has been canceled." });
        } catch (error: any) {
            setNotification({ isOpen: true, title: "Cancellation Failed", message: error.shortMessage || "The transaction failed." });
        } finally {
            setProcessingId(null);
            reset();
        }
    };

    // --- UNCHANGED UI LOGIC ---
    const indexOfLastOrder = currentPage * ORDERS_PER_PAGE;
    const indexOfFirstOrder = indexOfLastOrder - ORDERS_PER_PAGE;
    const currentOrders = myOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(myOrders.length / ORDERS_PER_PAGE);

    if (isInitializing || isAuthenticating) {
        return <div className="max-w-4xl mx-auto"><Spinner text="Loading your orders..." /></div>;
    }

    if (!address) {
        return <ConnectWalletMessage />;
    }

    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">My Sell Orders</h1>
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: ORDERS_PER_PAGE }).map((_, i) => (
                        <TradeCardSkeleton key={i} />
                    ))}
                </div>
            ) : myOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-10 border-2 border-dashed border-slate-700 rounded-lg">
                    You have not created any sell orders.
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentOrders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onFund={() => handleFundEscrow(order)}
                                onCancelOrder={() => handleCancelOrder(order)}
                                isProcessing={isPending && processingId === order.id}
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
            
            <NotificationModal
                onClose={() => setNotification({ isOpen: false, title: '', message: ''})} 
                {...notification} 
            />
        </div>
    );
};

export default OrdersPage;