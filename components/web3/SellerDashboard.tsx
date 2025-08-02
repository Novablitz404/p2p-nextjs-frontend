'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import the useRouter hook
import { useWeb3 } from '@/lib/Web3Provider';
import { useNotification } from '@/lib/NotificationProvider';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, setDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore'; 
import { Token, Order, UserProfile } from '@/types';
import dynamic from 'next/dynamic';
import { Settings } from 'lucide-react';

// Wagmi and Viem Imports
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { erc20Abi, keccak256, toBytes } from 'viem'; 
import { config } from '@/lib/config';
import { parseUnits, zeroAddress, decodeEventLog, TransactionReceipt } from 'viem';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID, MAX_UINT256 } from '@/constants';

// Component Imports
import SellerOrderForm from './SellerOrderForm';
const SellerRiskWarningModal = dynamic(() => import('../modals/SellerRiskWarningModal'));
const SellerSettingsModal = dynamic(() => import('../modals/SellerSettingsModal'));
// --- THIS IS A CHANGE ---
// Import the NotificationModal component
const NotificationModal = dynamic(() => import('../ui/NotificationModal'));


interface SellerDashboardProps {
    userId: string;
    userProfile: UserProfile | null;
    tokenList: Token[];
    supportedCurrencies: string[];
    isLoadingTokens: boolean;
    onOpenModal: (modalName: string, props: any) => void;
    onCloseModal: (modalName: string) => void;
    modalStates: any;
}

const SellerDashboard = React.memo(({ 
    userId, 
    userProfile,
    tokenList, 
    supportedCurrencies,
    isLoadingTokens,
    onOpenModal,
    onCloseModal,
    modalStates,
}: SellerDashboardProps) => {
    const { address, chainId } = useWeb3();
    const { addNotification } = useNotification();
    const { writeContractAsync, isPending, reset } = useWriteContract();
    const router = useRouter(); // Initialize the router

    const [myPaymentMethods, setMyPaymentMethods] = useState<any[]>([]);

    const [pendingOrderArgs, setPendingOrderArgs] = useState<any>(null);
    const [markupPercentage, setMarkupPercentage] = useState(1.5);
    const [minCancellationRate, setMinCancellationRate] = useState('');
    const settingsButtonRef = useRef<HTMLButtonElement>(null);

    // --- THIS IS A CHANGE ---
    // Add state to manage the local notification modal
    const [notification, setNotification] = useState<{ isOpen: boolean; title: string; message: string; action?: { text: string; onClick: () => void; }; }>({ isOpen: false, title: '', message: '' });

    // Memoize payment methods fetching to prevent unnecessary re-renders
    useEffect(() => {
        if (!userId) return;
        const userMethodsRef = collection(db, `users/${userId}/paymentMethods`);
        const unsubscribe = onSnapshot(userMethodsRef, (snapshot) => {
            const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyPaymentMethods(methods);
        });
        return () => unsubscribe();
    }, [userId]);

    // Memoize create sell order handler to prevent unnecessary re-renders
    const handleCreateSellOrder = useCallback(async (
        tokenAddress: string, tokenSymbol: string, amount: string,
        selectedPaymentMethodIds: string[], fiatCurrency: string
    ) => {
        const selectedToken = tokenList.find(t => t.address === tokenAddress);
        if (!selectedToken) { 
            addNotification({ type: 'error', message: 'Invalid token selected.' }); 
            return; 
        }
        const selectedMethods = myPaymentMethods.filter(m => selectedPaymentMethodIds.includes(m.id));
        if (selectedMethods.length === 0) { 
            addNotification({ type: 'error', message: 'Please select at least one payment method.' }); 
            return; 
        }
        const orderArgs = { tokenAddress, tokenSymbol, amount, selectedMethods, fiatCurrency, selectedToken, markupPercentage, minCancellationRate };
        setPendingOrderArgs(orderArgs);
        
        // Create a closure that captures the order args
        const handleConfirm = () => {
            console.log('SellerDashboard: handleConfirm called with orderArgs', orderArgs);
            executeCreateSellOrder(orderArgs);
        };
        
        onOpenModal('sellerRiskWarning', { onConfirm: handleConfirm });
    }, [tokenList, myPaymentMethods, markupPercentage, minCancellationRate, addNotification, onOpenModal]);

    // Memoize execute create sell order handler to prevent unnecessary re-renders
    const executeCreateSellOrder = useCallback(async (orderArgs?: any) => {
        const args = orderArgs || pendingOrderArgs;
        if (!args || !address) return;
        const { tokenAddress, tokenSymbol, amount, selectedMethods, fiatCurrency, selectedToken, markupPercentage, minCancellationRate } = args;
        onCloseModal('sellerRiskWarning');
    
        try {
            const platformFeeBps = await readContract(config, { ...P2P_CONTRACT_CONFIG, functionName: 'platformFeeBps' });
            const amountInWei = parseUnits(amount, selectedToken.decimals);
            let transactionHash: `0x${string}`;

            if (tokenAddress === zeroAddress) {
                const feeAmount = (amountInWei * platformFeeBps) / 10000n;
                const totalValueToSend = amountInWei + feeAmount;
                transactionHash = await writeContractAsync({
                    ...P2P_CONTRACT_CONFIG, functionName: 'createNativeOrder',
                    args: [amountInWei], value: totalValueToSend,
                });
            } else {
                addNotification({ type: 'info', message: 'Step 1/2: Approving token with maximum allocation...' });
                const approveHash = await writeContractAsync({
                    address: tokenAddress as `0x${string}`, abi: erc20Abi,
                    functionName: 'approve', args: [P2P_CONTRACT_CONFIG.address, MAX_UINT256],
                });
                await waitForTransactionReceipt(config, { hash: approveHash });
    
                addNotification({ type: 'info', message: 'Step 2/2: Creating order...' });
                transactionHash = await writeContractAsync({
                    ...P2P_CONTRACT_CONFIG, functionName: 'createAndFundOrder',
                    args: [tokenAddress as `0x${string}`, amountInWei],
                });
            }

            const receipt = await waitForTransactionReceipt(config, { hash: transactionHash });

            const orderCreatedTopic = keccak256(toBytes("OrderCreated(uint256,address,address,uint256)"));
            const orderCreatedLog = receipt.logs.find(log => log.topics[0] === orderCreatedTopic);

            if (!orderCreatedLog) {
                throw new Error("OrderCreated event not found in transaction logs. Please verify the contract ABI.");
            }
            
            const decodedLog = decodeEventLog({ abi: P2PEscrowABI, ...orderCreatedLog });
            const orderId = (decodedLog.args as any).orderId.toString();

            const paymentDetailsMap: { [key: string]: any } = {};
            selectedMethods.forEach((method: any) => {
                paymentDetailsMap[method.channel] = { channel: method.channel, accountName: method.accountName, accountNumber: method.accountNumber };
            });

            const newOrder: Omit<Order, 'id'> & { minBuyerCancellationRate?: number } = {
                onChainId: orderId,
                seller: userId,
                markupPercentage: parseFloat(markupPercentage.toString()),
                fiatCurrency,
                totalAmount: parseFloat(amount),
                remainingAmount: parseFloat(amount),
                orderType: tokenAddress === zeroAddress ? 'NATIVE' : 'ERC20',
                tokenAddress, tokenSymbol,
                tokenDecimals: selectedToken.decimals,
                status: 'OPEN',
                createdAt: serverTimestamp() as Timestamp,
                paymentMethods: selectedMethods.map((m: any) => m.channel),
                paymentDetails: paymentDetailsMap,
                chainId: chainId ?? DEFAULT_CHAIN_ID
            };

            if (minCancellationRate && minCancellationRate !== '') {
                newOrder.minBuyerCancellationRate = parseFloat(minCancellationRate) / 100;
            }

            await setDoc(doc(db, "orders", orderId), newOrder);

            // --- THIS IS THE FIX ---
            // Use the local setNotification state instead of the global addNotification
            setNotification({
                isOpen: true,
                title: "Order Created!",
                message: `Your sell order (#${orderId}) is now active on the marketplace.`,
                action: {
                    text: "View My Orders",
                    onClick: () => router.push('/dapp/orders')
                }
            });

        } catch (error: any) {
            console.error("Order creation error:", error);
            const reason = error.message || error.shortMessage || "An unknown error occurred.";
            // Use the local modal for errors as well for consistency
            setNotification({
                isOpen: true,
                title: "Order Creation Failed",
                message: `Could not create order: ${reason}`
            });
        } finally {
            reset();
            setPendingOrderArgs(null);
        }
    }, [address, writeContractAsync, addNotification, router, reset, userId]);
    
    // Memoize save settings handler to prevent unnecessary re-renders
    const handleSaveSettings = useCallback((settings: { markup: number; cancellationRate: string }) => {
        setMarkupPercentage(settings.markup);
        setMinCancellationRate(settings.cancellationRate);
    }, []);
    
    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };

    return (
        <>
                        {/* Title and Settings Button */}
            <div className="relative flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Create Sell Order</h2>
                <div className="relative inline-block">
                    <button 
                        ref={settingsButtonRef}
                        onClick={() => onOpenModal('sellerSettings', { onSave: handleSaveSettings, initialMarkup: markupPercentage, initialCancellationRate: minCancellationRate, toggleButtonRef: settingsButtonRef })} 
                        className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" 
                        aria-label="Seller Settings"
                    >
                        <Settings size={20} />
                    </button>
                    <SellerSettingsModal
                        isOpen={modalStates.sellerSettings.isOpen}
                        onClose={() => onCloseModal('sellerSettings')}
                        onSave={modalStates.sellerSettings.onSave}
                        initialMarkup={modalStates.sellerSettings.initialMarkup}
                        initialCancellationRate={modalStates.sellerSettings.initialCancellationRate}
                        toggleButtonRef={settingsButtonRef}
                    />
                </div>
            </div>
            <SellerOrderForm
                onSubmit={handleCreateSellOrder}
                tokenList={tokenList}
                supportedCurrencies={supportedCurrencies}
                isLoadingTokens={isLoadingTokens}
                myPaymentMethods={myPaymentMethods}
                isProcessing={isPending}
                markupPercentage={markupPercentage}
                onOpenModal={onOpenModal}
                onCloseModal={onCloseModal}
            />

            <NotificationModal
                onClose={() => setNotification({ isOpen: false, title: '', message: ''})} 
                {...notification} 
            />
        </>
    );
});

export default SellerDashboard;