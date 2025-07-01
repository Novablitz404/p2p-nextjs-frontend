'use client';

// Make sure to import 'useRef' from React
import { useState, useEffect, useRef } from 'react';
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

// Component Imports
import SellerOrderForm from './SellerOrderForm';
const SellerRiskWarningModal = dynamic(() => import('../modals/SellerRiskWarningModal'));
const SellerSettingsModal = dynamic(() => import('../modals/SellerSettingsModal'));

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

interface SellerDashboardProps {
    userId: string;
    tokenList: Token[];
    supportedCurrencies: string[];
    isLoadingTokens: boolean;
    userProfile: UserProfile | null;
}

const SellerDashboard = ({ 
    userId, 
    userProfile,
    tokenList, 
    supportedCurrencies,
    isLoadingTokens, 
}: SellerDashboardProps) => {
    const { address } = useWeb3();
    const { addNotification } = useNotification();
    const { writeContractAsync, isPending, reset } = useWriteContract();
    
    const [myPaymentMethods, setMyPaymentMethods] = useState<any[]>([]);
    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
    const [pendingOrderArgs, setPendingOrderArgs] = useState<any>(null);
    const [markupPercentage, setMarkupPercentage] = useState(1.5);
    const [minCancellationRate, setMinCancellationRate] = useState('');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // --- THIS IS THE FIX (Part 1) ---
    // Create a ref for the settings button.
    const settingsButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!userId) return;
        const userMethodsRef = collection(db, `users/${userId}/paymentMethods`);
        const unsubscribe = onSnapshot(userMethodsRef, (snapshot) => {
            const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMyPaymentMethods(methods);
        });
        return () => unsubscribe();
    }, [userId]);

    const handleCreateSellOrder = async (
        tokenAddress: string, tokenSymbol: string, amount: string,
        selectedPaymentMethodIds: string[], fiatCurrency: string
    ) => {
        const selectedToken = tokenList.find(t => t.address === tokenAddress);
        if (!selectedToken) { addNotification(userId, { type: 'error', message: 'Invalid token selected.' }); return; }
        const selectedMethods = myPaymentMethods.filter(m => selectedPaymentMethodIds.includes(m.id));
        if (selectedMethods.length === 0) { addNotification(userId, { type: 'error', message: 'Please select at least one payment method.' }); return; }
        setPendingOrderArgs({ tokenAddress, tokenSymbol, amount, selectedMethods, fiatCurrency, selectedToken, markupPercentage, minCancellationRate });
        setIsRiskModalOpen(true);
    };

    const executeCreateSellOrder = async () => {
        if (!pendingOrderArgs || !address) return;
        const { tokenAddress, tokenSymbol, amount, selectedMethods, fiatCurrency, selectedToken, markupPercentage, minCancellationRate } = pendingOrderArgs;
        setIsRiskModalOpen(false);
    
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
                addNotification(address, { type: 'info', message: 'Step 1/2: Approving token...' });
                const approveHash = await writeContractAsync({
                    address: tokenAddress as `0x${string}`, abi: erc20Abi,
                    functionName: 'approve', args: [P2P_CONTRACT_CONFIG.address, amountInWei],
                });
                await waitForTransactionReceipt(config, { hash: approveHash });
    
                addNotification(address, { type: 'info', message: 'Step 2/2: Creating order...' });
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
                paymentDetails: paymentDetailsMap
            };

            if (minCancellationRate && minCancellationRate !== '') {
                newOrder.minBuyerCancellationRate = parseFloat(minCancellationRate) / 100;
            }

            await setDoc(doc(db, "orders", orderId), newOrder);
            addNotification(address, { 
                type: 'success', 
                message: `Your order (#${orderId}) is now active! Click to view.`,
                link: '/dapp/orders' // Add the link here
            });

        } catch (error: any) {
            console.error("Order creation error:", error);
            const reason = error.message || error.shortMessage || "An unknown error occurred.";
            addNotification(address!, { type: 'error', message: `Could not create order: ${reason}` });
        } finally {
            reset();
            setPendingOrderArgs(null);
        }
    };
    
    const handleSaveSettings = (settings: { markup: number; cancellationRate: string }) => {
        setMarkupPercentage(settings.markup);
        setMinCancellationRate(settings.cancellationRate);
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="relative flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Create Sell Order</h2>
                 <button 
                    ref={settingsButtonRef}
                    onClick={() => setIsSettingsModalOpen(prev => !prev)} 
                    className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" 
                    aria-label="Seller Settings"
                >
                    <Settings size={20} />
                </button>
                {/* --- THIS IS THE FIX (Part 2) --- */}
                {/* Pass the ref to the modal component. */}
                <SellerSettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    onSave={handleSaveSettings}
                    initialMarkup={markupPercentage}
                    initialCancellationRate={minCancellationRate}
                    toggleButtonRef={settingsButtonRef}
                />
            </div>
            <SellerOrderForm
                onSubmit={handleCreateSellOrder}
                tokenList={tokenList}
                supportedCurrencies={supportedCurrencies}
                isLoadingTokens={isLoadingTokens}
                myPaymentMethods={myPaymentMethods}
                isProcessing={isPending}
                markupPercentage={markupPercentage}
            />
            <SellerRiskWarningModal
                isOpen={isRiskModalOpen}
                onClose={() => setIsRiskModalOpen(false)}
                onConfirm={executeCreateSellOrder}
            />
        </div>
    );
};

export default SellerDashboard;