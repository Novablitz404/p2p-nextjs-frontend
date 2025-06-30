'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/lib/Web3Provider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { Order, MatchedOrder, TradePlan, Token, UserProfile } from '@/types';
import Image from 'next/image';

// Wagmi and Viem Imports
import { useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { config } from '@/lib/config';
import { parseUnits, formatUnits, decodeEventLog, keccak256, toBytes } from 'viem';

// Component Imports
import Spinner from '../ui/Spinner';
import { ChevronDown, Settings } from 'lucide-react';
import { useNotification } from '@/lib/NotificationProvider';

const ProposalModal = dynamic(() => import('../web3/ProposalModal'));
const TokenSelectorModal = dynamic(() => import('../ui/TokenSelectorModal'));
const PaymentMethodSelectorModal = dynamic(() => import('../ui/PaymentMethodSelectorModal'));
const CurrencySelectorModal = dynamic(() => import('../ui/CurrencySelectorModal'));
const BuyerRiskWarningModal = dynamic(() => import('../modals/BuyerRiskWarningModal'));
const BuyerSettingsModal = dynamic(() => import('../modals/BuyerSettingsModal'));

const P2P_CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_P2P_ESCROW_CONTRACT_ADDRESS as `0x${string}`,
    abi: P2PEscrowABI,
};

interface BuyerDashboardProps {
    userId: string;
    tokenList: Token[];
    isLoadingTokens: boolean;
    approvedChannels: string[];
    supportedCurrencies: string[];
}

const currencyCountryMap: { [key: string]: string } = { PHP: 'ph', USD: 'us', EUR: 'eu' };

const formatFiatValue = (value: string): string => {
    if (!value) return '';
    const cleanValue = value.replace(/,/g, '');
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

const BuyerDashboard = ({ userId, tokenList, isLoadingTokens, approvedChannels, supportedCurrencies }: BuyerDashboardProps) => {
    const { addNotification } = useNotification();
    const router = useRouter();

    const { writeContractAsync, isPending, reset } = useWriteContract();

    // State Management
    const [cryptoAmount, setCryptoAmount] = useState('');
    const [fiatAmount, setFiatAmount] = useState('');
    const [lastEdited, setLastEdited] = useState<'crypto' | 'fiat' | null>(null);
    const [marketPrice, setMarketPrice] = useState<number | null>(null);
    const [isPriceLoading, setIsPriceLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
    const [fiatCurrency, setFiatCurrency] = useState('PHP');
    const [isMatching, setIsMatching] = useState(false);
    const [tradePlan, setTradePlan] = useState<TradePlan | null>(null);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
    const [maxMarkup, setMaxMarkup] = useState('');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    
    // FIX: Re-add the missing state declarations for the modals
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

    const selectedToken = tokenList.find(t => t.address === selectedTokenAddress);
    const countryCode = currencyCountryMap[fiatCurrency] || 'xx';

    // All useEffect hooks for UI logic and price fetching are preserved
    useEffect(() => {
        if (!isLoadingTokens && approvedChannels.length > 0 && !paymentMethod) setPaymentMethod(approvedChannels[0]);
        if (!isLoadingTokens && supportedCurrencies.length > 0 && !fiatCurrency) setFiatCurrency(supportedCurrencies[0]);
        if (!isLoadingTokens && tokenList.length > 0 && !selectedTokenAddress) setSelectedTokenAddress(tokenList[0].address);
    }, [isLoadingTokens, approvedChannels, supportedCurrencies, tokenList, paymentMethod, fiatCurrency, selectedTokenAddress]);

    useEffect(() => {
        if (!selectedToken || !fiatCurrency) return;
        const fetchPrice = async () => {
            setIsPriceLoading(true); setMarketPrice(null);
            try {
                const response = await fetch(`/api/getTokenPrice?symbol=${selectedToken.symbol}&currency=${fiatCurrency}`);
                if (!response.ok) throw new Error('Failed to fetch price');
                const data = await response.json();
                setMarketPrice(data.price);
            } catch (error) { console.error("Price fetch error:", error); } 
            finally { setIsPriceLoading(false); }
        };
        fetchPrice();
    }, [selectedToken, fiatCurrency]);

    useEffect(() => {
        if (lastEdited !== 'crypto' || marketPrice === null) return;
        const cryptoValue = parseFloat(cryptoAmount);
        const calculatedFiat = cryptoValue > 0 ? (cryptoValue * marketPrice) : NaN;
        setFiatAmount(isNaN(calculatedFiat) ? '' : calculatedFiat.toFixed(2));
    }, [cryptoAmount, marketPrice, lastEdited]);

    useEffect(() => {
        if (lastEdited !== 'fiat' || marketPrice === null) return;
        const fiatValue = parseFloat(fiatAmount.replace(/,/g, ''));
        setCryptoAmount(fiatValue > 0 && marketPrice > 0 ? (fiatValue / marketPrice).toPrecision(8) : '');
    }, [fiatAmount, marketPrice, lastEdited]);

    // UI handlers are preserved
    const handleTokenSelect = (address: string) => setSelectedTokenAddress(address);
    const handleCurrencySelect = (currency: string) => setFiatCurrency(currency);
    const handlePaymentMethodSelect = (method: string) => { setPaymentMethod(method); setIsPaymentMethodModalOpen(false); };
    const handleFindMatch = () => setIsRiskModalOpen(true);
    const handleSaveSettings = (newMarkup: string) => setMaxMarkup(newMarkup);

    const executeMatchFinding = async () => {
        setIsRiskModalOpen(false);
        if (!selectedToken || !userId) { addNotification(userId, { type: 'error', message: 'Please connect wallet and select a token.' }); return; }
    
        setIsMatching(true);
        try {
            const userProfileRef = doc(db, "users", userId);
            const userProfileSnap = await getDoc(userProfileRef);
            const userProfile = userProfileSnap.data() as UserProfile | undefined;
            
            // FIX: Add null checks before accessing userProfile properties
            const tradeCount = userProfile?.tradeCount || 0;
            const cancellationCount = userProfile?.cancellationCount || 0;
            const myCancellationRate = tradeCount > 0 ? cancellationCount / tradeCount : 0;
            
            const buyAmountInWei = parseUnits(cryptoAmount, selectedToken.decimals);
            
            const q = query(collection(db, "orders"), where('status', '==', 'OPEN'), where('paymentMethods', 'array-contains', paymentMethod), where('tokenAddress', '==', selectedTokenAddress), where('fiatCurrency', '==', fiatCurrency));
            const orderSnapshot = await getDocs(q);
            if (orderSnapshot.empty) { addNotification(userId, { type: 'info', message: 'No open orders found for your criteria.' }); setIsMatching(false); return; }
    
            const buyerMaxMarkup = maxMarkup ? parseFloat(maxMarkup) : null;
            let allPotentialOrders: Order[] = [];
            orderSnapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() } as Order;
                if (order.minBuyerCancellationRate && myCancellationRate > order.minBuyerCancellationRate) return;
                if (buyerMaxMarkup !== null && order.markupPercentage > buyerMaxMarkup) return;
                allPotentialOrders.push(order);
            });
    
            if (allPotentialOrders.length === 0) { addNotification(userId, { type: 'info', message: 'No orders found that meet all criteria.' }); setIsMatching(false); return; }
    
            const sellerIds = [...new Set(allPotentialOrders.map(o => o.seller))];
            const sellerProfiles: { [key: string]: UserProfile } = {};
            const profilePromises = sellerIds.map(id => getDoc(doc(db, "users", id)));
            const profileSnapshots = await Promise.all(profilePromises);
            profileSnapshots.forEach(userDoc => { if (userDoc.exists()) { sellerProfiles[userDoc.id] = userDoc.data() as UserProfile; } });
    
            const availableOrders = allPotentialOrders.sort((a, b) => {
                const getWeightedMarkup = (order: Order) => {
                    const profile = sellerProfiles[order.seller] || { averageRating: 3, ratingCount: 0 };
                    return order.markupPercentage - (profile.averageRating * Math.log10(profile.ratingCount + 1) * 0.5);
                };
                return getWeightedMarkup(a) - getWeightedMarkup(b);
            });
    
            let amountToFillInWei = buyAmountInWei;
            const matchedOrders: MatchedOrder[] = [];
            
            for (const order of availableOrders) {
                if (amountToFillInWei <= 0n) break;
                const remainingAmountInWei = parseUnits(order.remainingAmount.toString(), order.tokenDecimals);
                const amountFromThisOrderInWei = remainingAmountInWei < amountToFillInWei ? remainingAmountInWei : amountToFillInWei;
                if (amountFromThisOrderInWei <= 0n) continue;
    
                matchedOrders.push({
                    ...order,
                    firestoreId: order.id,
                    amountToTakeInWei: amountFromThisOrderInWei, 
                    amountToTake: parseFloat(formatUnits(amountFromThisOrderInWei, order.tokenDecimals)),
                    paymentMethod: paymentMethod,
                    price: 0, fiatCost: 0, 
                });
                amountToFillInWei -= amountFromThisOrderInWei;
            }
    
            if (amountToFillInWei > 0n) {
                const amountFound = formatUnits(buyAmountInWei - amountToFillInWei, selectedToken.decimals);
                addNotification(userId, { type: 'error', message: `Insufficient Liquidity: Could only find ${parseFloat(amountFound).toFixed(2)} assets.` });
                setIsMatching(false); return;
            }
    
            setTradePlan({ matches: matchedOrders, totalCrypto: parseFloat(cryptoAmount), totalFiat: 0, avgPrice: 0, buyerId: userId });
            setIsProposalModalOpen(true);
    
        } catch (error: any) {
            addNotification(userId, { type: 'error', message: 'Could not search for matches: ' + error.message });
        } finally {
            setIsMatching(false);
        }
    };

    const handleConfirmTrade = async (finalTradePlan: TradePlan) => {
        if (!finalTradePlan || !finalTradePlan.matches.length) return;
        
        setIsProposalModalOpen(false);
        addNotification(userId, { type: 'info', message: 'Please confirm in your wallet to lock the trades.' });

        try {
            const orderIds = finalTradePlan.matches.map(match => BigInt(match.onChainId));
            const amountsToLockInWei = finalTradePlan.matches.map(match => match.amountToTakeInWei as bigint);
    
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'lockMultipleTrades',
                args: [orderIds, amountsToLockInWei],
            });

            addNotification(userId, { type: 'info', message: 'Transaction sent! Waiting for confirmation...' });
            const receipt = await waitForTransactionReceipt(config, { hash });

            if (receipt.status !== 'success') throw new Error('Transaction failed on-chain.');
    
            const tradeCreatedTopic = keccak256(toBytes("TradeCreated(uint256,uint256,address,uint256)"));
            const tradeLogs = receipt.logs.filter((log) => log.topics[0] === tradeCreatedTopic);
    
            if (tradeLogs.length === 0) throw new Error("Could not find any TradeCreated events in the transaction receipt.");
    
            const batch = writeBatch(db);
            
            tradeLogs.forEach((log) => {
                const parsedLog = decodeEventLog({ abi: P2PEscrowABI, ...log });
                const newTradeOnChainId = (parsedLog.args as any).tradeId.toString();
                const originalOrderId = (parsedLog.args as any).orderId.toString();
                
                const originalMatch = finalTradePlan.matches.find(m => m.onChainId === originalOrderId);
    
                if (newTradeOnChainId && originalMatch) {
                    const newTradeDocRef = doc(collection(db, "trades"));
                    const lockedPrice = originalMatch.fiatCost / originalMatch.amountToTake;
                    const specificPaymentDetails = originalMatch.paymentDetails?.[originalMatch.paymentMethod] ?? null;

                    batch.set(newTradeDocRef, {
                        onChainId: newTradeOnChainId,
                        orderId: originalOrderId,
                        firestoreId: originalMatch.firestoreId,
                        buyer: userId,
                        seller: originalMatch.seller,
                        amount: originalMatch.amountToTake,
                        price: lockedPrice,
                        fiatCurrency: originalMatch.fiatCurrency,
                        tokenSymbol: originalMatch.tokenSymbol,
                        tokenAddress: originalMatch.tokenAddress,
                        tokenDecimals: originalMatch.tokenDecimals,
                        status: 'LOCKED',
                        sellerPaymentDetails: specificPaymentDetails,
                        createdAt: serverTimestamp(),
                        creationTxHash: receipt.transactionHash,
                    });
                    
                    const orderRef = doc(db, "orders", originalMatch.firestoreId);
                    const newRemainingAmount = originalMatch.remainingAmount - originalMatch.amountToTake;
                    batch.update(orderRef, { remainingAmount: newRemainingAmount });
                }
            });
            
            await batch.commit();
    
            addNotification(userId, { type: 'success', message: `${tradeLogs.length} new trades are available!` });
            router.push('/dapp/trades');
    
        } catch (error: any) {
            console.error("Lock Trade Error:", error);
            addNotification(userId, { type: 'error', message: `Could not lock trade(s): ${error.shortMessage || error.message}` });
        } finally {
            reset();
        }
    };

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <div className="relative flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Find Best Match</h2>
                {/* Add the ref to the button and update the onClick to toggle */}
                <button 
                    ref={settingsButtonRef}
                    onClick={() => setIsSettingsModalOpen(prev => !prev)} 
                    className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" 
                    aria-label="Buyer Settings"
                >
                    <Settings size={20} />
                </button>
                {/* Pass the ref to the settings modal component */}
                <BuyerSettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    onSave={handleSaveSettings}
                    initialMarkup={maxMarkup}
                    toggleButtonRef={settingsButtonRef}
                />
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">I want to buy</label>
                    <div className="flex relative">
                        <input type="number" value={cryptoAmount} onChange={(e) => { setCryptoAmount(e.target.value); setLastEdited('crypto'); }} placeholder="0.00" className="flex-grow w-full bg-slate-900 text-white rounded-lg p-3 text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition border border-slate-700"/>
                        <button type="button" onClick={() => setIsTokenModalOpen(true)} className="absolute right-0 top-0 h-full flex items-center justify-center px-4 bg-slate-700 hover:bg-slate-600 rounded-r-lg transition-colors">
                            {selectedToken && <img src={`https://effigy.im/a/${selectedToken.address}.svg`} alt="" className="h-6 w-6 rounded-full mr-2" />}
                            <span className="font-bold text-white">{selectedToken?.symbol || 'Select'}</span>
                            <ChevronDown className="h-5 w-5 text-gray-400 ml-1" />
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">I will spend (approx.)</label>
                    <div className="flex relative">
                        <input type="text" inputMode="decimal" value={formatFiatValue(fiatAmount)} onChange={(e) => { const sanitized = e.target.value.replace(/,/g, ''); if (!isNaN(Number(sanitized)) || sanitized === '' || sanitized.endsWith('.')) { setFiatAmount(sanitized); setLastEdited('fiat'); }}} placeholder="0.00" className="flex-grow w-full bg-slate-900 text-white rounded-lg p-3 text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition border border-slate-700" />
                        <button type="button" onClick={() => setIsCurrencyModalOpen(true)} className="absolute right-0 top-0 h-full flex items-center justify-center px-4 bg-slate-700 hover:bg-slate-600 rounded-r-lg transition-colors disabled:opacity-50" disabled={supportedCurrencies.length === 0}>
                            <Image src={`https://flagcdn.com/w40/${countryCode}.png`} alt={`${fiatCurrency} flag`} width={24} height={18} className="mr-2 rounded-sm" />
                            <span className="font-bold text-white">{fiatCurrency}</span>
                            <ChevronDown className="h-5 w-5 text-gray-400 ml-1" />
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">My payment method</label>
                    <button type="button" onClick={() => setIsPaymentMethodModalOpen(true)} className="w-full bg-slate-900 text-white rounded-lg p-3 text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition border border-slate-700 flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed" disabled={approvedChannels.length === 0}>
                        <span>{paymentMethod || (approvedChannels.length > 0 ? 'Select a method...' : 'No payment methods available')}</span>
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    </button>
                </div>
                <button onClick={handleFindMatch} disabled={isMatching || isLoadingTokens || isPriceLoading} className="w-full font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-400 text-white text-lg disabled:opacity-50">
                    {isMatching ? <Spinner text="Finding Best Match..."/> : 'Find Best Match'}
                </button>
            </div>
            <ProposalModal isOpen={isProposalModalOpen} onClose={() => setIsProposalModalOpen(false)} onConfirm={handleConfirmTrade} tradePlan={tradePlan} />
            <TokenSelectorModal isOpen={isTokenModalOpen} onClose={() => setIsTokenModalOpen(false)} tokenList={tokenList} onSelectToken={handleTokenSelect} />
            <PaymentMethodSelectorModal isOpen={isPaymentMethodModalOpen} onClose={() => setIsPaymentMethodModalOpen(false)} paymentMethods={approvedChannels} onSelectMethod={handlePaymentMethodSelect} />
            <CurrencySelectorModal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} currencies={supportedCurrencies} onSelectCurrency={handleCurrencySelect} />
            <BuyerRiskWarningModal isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} onConfirm={executeMatchFinding} />

        </div>
    );
};

export default BuyerDashboard;