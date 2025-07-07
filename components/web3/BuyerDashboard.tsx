'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/lib/Web3Provider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { Order, MatchedOrder, TradePlan, Token, UserProfile } from '@/types';
import Image from 'next/image';
import clsx from 'clsx';

// Wagmi and Viem Imports
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { config } from '@/lib/config';
import { parseUnits, formatUnits, decodeEventLog, keccak256, toBytes } from 'viem';

// Component Imports
import Spinner from '../ui/Spinner';
import { ChevronDown, Settings } from 'lucide-react';
import { useNotifications } from '@/lib/NotificationProvider';
import { CURRENCY_PAYMENT_METHODS } from '@/constants';

const SellerSuggestionModal = dynamic(() => import('../web3/SellerSuggestionModal'));
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
    supportedCurrencies: string[];
}

const currencyCountryMap: { [key: string]: string } = { PHP: 'ph', USD: 'us', EUR: 'eu', THB: 'th' };

const formatFiatValue = (value: string): string => {
    if (!value) return '';
    const cleanValue = value.replace(/,/g, '');
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

const BuyerDashboard = React.memo(({ userId, tokenList, isLoadingTokens, supportedCurrencies }: BuyerDashboardProps) => {
    const { addNotification } = useNotifications();
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
    const [sellerProfiles, setSellerProfiles] = useState<{ [key: string]: UserProfile }>({});
    const [isSellerSuggestionModalOpen, setIsSellerSuggestionModalOpen] = useState(false);
    const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
    const [maxMarkup, setMaxMarkup] = useState('');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const settingsButtonRef = useRef<HTMLButtonElement>(null);
    
    // FIX: Re-add the missing state declarations for the modals
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

    // Memoize selected token to prevent unnecessary re-computations
    const selectedToken = useMemo(() => 
        tokenList.find(t => t.address === selectedTokenAddress), 
        [tokenList, selectedTokenAddress]
    );
    
    const countryCode = useMemo(() => 
        currencyCountryMap[fiatCurrency] || 'xx', 
        [fiatCurrency]
    );

    // Memoize payment methods to prevent unnecessary re-computations
    const availablePaymentMethods = useMemo(() => {
        const currencyMethods = CURRENCY_PAYMENT_METHODS[fiatCurrency] || [];
        return currencyMethods;
    }, [fiatCurrency]);

    // Memoize initialization effect to prevent unnecessary re-renders
    useEffect(() => {
        if (!isLoadingTokens && availablePaymentMethods.length > 0 && !paymentMethod) {
            setPaymentMethod(availablePaymentMethods[0]);
        }
        if (!isLoadingTokens && supportedCurrencies.length > 0 && !fiatCurrency) {
            setFiatCurrency(supportedCurrencies[0]);
        }
        if (!isLoadingTokens && tokenList.length > 0 && !selectedTokenAddress) {
            setSelectedTokenAddress(tokenList[0].address);
        }
    }, [isLoadingTokens, availablePaymentMethods, supportedCurrencies, tokenList, paymentMethod, fiatCurrency, selectedTokenAddress]);

    // Memoize price fetching to prevent unnecessary API calls
    const fetchPrice = useCallback(async () => {
        if (!selectedToken || !fiatCurrency) return;
        
        setIsPriceLoading(true);
        setMarketPrice(null);
        try {
            const response = await fetch(`/api/getTokenPrice?symbol=${selectedToken.symbol}&currency=${fiatCurrency}`);
            if (!response.ok) throw new Error('Failed to fetch price');
            const data = await response.json();
            setMarketPrice(data.price);
        } catch (error) { 
            console.error("Price fetch error:", error); 
        } finally { 
            setIsPriceLoading(false); 
        }
    }, [selectedToken, fiatCurrency]);

    useEffect(() => {
        fetchPrice();
    }, [fetchPrice]);

    // Memoize crypto to fiat conversion
    useEffect(() => {
        if (lastEdited !== 'crypto' || marketPrice === null) return;
        const cryptoValue = parseFloat(cryptoAmount);
        const calculatedFiat = cryptoValue > 0 ? (cryptoValue * marketPrice) : NaN;
        setFiatAmount(isNaN(calculatedFiat) ? '' : calculatedFiat.toFixed(2));
    }, [cryptoAmount, marketPrice, lastEdited]);

    // Memoize fiat to crypto conversion
    useEffect(() => {
        if (lastEdited !== 'fiat' || marketPrice === null) return;
        const fiatValue = parseFloat(fiatAmount.replace(/,/g, ''));
        setCryptoAmount(fiatValue > 0 && marketPrice > 0 ? (fiatValue / marketPrice).toPrecision(8) : '');
    }, [fiatAmount, marketPrice, lastEdited]);

    // Memoize handlers to prevent unnecessary re-renders
    const handleTokenSelect = useCallback((address: string) => setSelectedTokenAddress(address), []);
    const handleCurrencySelect = useCallback((currency: string) => setFiatCurrency(currency), []);
    const handlePaymentMethodSelect = useCallback((method: string) => { 
        setPaymentMethod(method); 
        setIsPaymentMethodModalOpen(false); 
    }, []);
    const handleFindMatch = useCallback(() => setIsRiskModalOpen(true), []);
    const handleSaveSettings = useCallback((newMarkup: string) => setMaxMarkup(newMarkup), []);

    // Memoize execute match finding to prevent unnecessary re-renders
    const executeMatchFinding = useCallback(async () => {
        setIsRiskModalOpen(false);
        if (!selectedToken || !userId) { 
            addNotification({ type: 'error', message: 'Please connect wallet and select a token.' }); 
            return; 
        }
    
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
            if (orderSnapshot.empty) { 
                addNotification({ type: 'info', message: 'No open orders found for your criteria.' }); 
                setIsMatching(false); 
                return; 
            }
    
            const buyerMaxMarkup = maxMarkup ? parseFloat(maxMarkup) : null;
            let allPotentialOrders: Order[] = [];
            orderSnapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() } as Order;
                if (order.minBuyerCancellationRate && myCancellationRate > order.minBuyerCancellationRate) return;
                if (buyerMaxMarkup !== null && order.markupPercentage > buyerMaxMarkup) return;
                allPotentialOrders.push(order);
            });
    
            if (allPotentialOrders.length === 0) { 
                addNotification({ type: 'info', message: 'No orders found that meet all criteria.' }); 
                setIsMatching(false); 
                return; 
            }
    
            const sellerIds = [...new Set(allPotentialOrders.map(o => o.seller))];
            const profiles: { [key: string]: UserProfile } = {};
            const profilePromises = sellerIds.map(id => getDoc(doc(db, "users", id)));
            const profileSnapshots = await Promise.all(profilePromises);
            profileSnapshots.forEach(userDoc => { 
                if (userDoc.exists()) { 
                    profiles[userDoc.id] = userDoc.data() as UserProfile; 
                } 
            });
            setSellerProfiles(profiles);
    
            const availableOrders = allPotentialOrders.sort((a, b) => {
                const getWeightedMarkup = (order: Order) => {
                    const profile = profiles[order.seller] || { averageRating: 3, ratingCount: 0 };
                    return order.markupPercentage - (profile.averageRating * Math.log10(profile.ratingCount + 1) * 0.5);
                };
                return getWeightedMarkup(a) - getWeightedMarkup(b);
            });
    
            // Filter out orders that don't have enough remaining amount
            const ordersWithSufficientAmount = availableOrders.filter(order => {
                const remainingAmountInWei = parseUnits(order.remainingAmount.toString(), order.tokenDecimals);
                // Only include orders that have some remaining amount
                return remainingAmountInWei > 0n;
            });

            if (ordersWithSufficientAmount.length === 0) {
                addNotification({ type: 'info', message: 'No orders found with sufficient remaining amount.' });
                setIsMatching(false);
                return;
            }

            // First, try to find orders that can fulfill the complete request on their own
            const completeOrders = ordersWithSufficientAmount.filter(order => {
                const remainingAmountInWei = parseUnits(order.remainingAmount.toString(), order.tokenDecimals);
                return remainingAmountInWei >= buyAmountInWei;
            });

            console.log('Matching Debug:', {
                buyerAmount: formatUnits(buyAmountInWei, selectedToken.decimals),
                totalOrders: ordersWithSufficientAmount.length,
                completeOrders: completeOrders.length,
                completeOrdersDetails: completeOrders.map(o => ({
                    orderId: o.onChainId,
                    remaining: o.remainingAmount,
                    seller: o.seller
                }))
            });

            let matchedOrders: MatchedOrder[] = [];

            if (completeOrders.length > 0) {
                // Use the best complete order (lowest markup, highest rating)
                const bestCompleteOrder = completeOrders.sort((a, b) => {
                    const getWeightedMarkup = (order: Order) => {
                        const profile = profiles[order.seller] || { averageRating: 3, ratingCount: 0 };
                        return order.markupPercentage - (profile.averageRating * Math.log10(profile.ratingCount + 1) * 0.5);
                    };
                    return getWeightedMarkup(a) - getWeightedMarkup(b);
                })[0];

                console.log('Using Complete Order:', {
                    orderId: bestCompleteOrder.onChainId,
                    seller: bestCompleteOrder.seller,
                    remaining: bestCompleteOrder.remainingAmount,
                    taking: formatUnits(buyAmountInWei, selectedToken.decimals)
                });

                matchedOrders.push({
                    ...bestCompleteOrder,
                    firestoreId: bestCompleteOrder.id,
                    amountToTakeInWei: buyAmountInWei, 
                    amountToTake: Number(buyAmountInWei) / (10 ** selectedToken.decimals),
                    paymentMethod: paymentMethod,
                    price: 0, fiatCost: 0, 
                });
            } else {
                // Fallback: Use multiple orders if no single order can fulfill the request
                // Find optimal combination that minimizes number of sellers
                let amountToFillInWei = buyAmountInWei;
                const optimalOrders: MatchedOrder[] = [];
                
                // Sort orders by remaining amount (largest first) to prioritize larger orders
                const sortedOrders = [...ordersWithSufficientAmount].sort((a, b) => {
                    const aAmount = parseUnits(a.remainingAmount.toString(), a.tokenDecimals);
                    const bAmount = parseUnits(b.remainingAmount.toString(), b.tokenDecimals);
                    return Number(bAmount - aAmount);
                });
                
                for (const order of sortedOrders) {
                    if (amountToFillInWei <= 0n) break;
                    const remainingAmountInWei = parseUnits(order.remainingAmount.toString(), order.tokenDecimals);
                    
                    if (remainingAmountInWei <= 0n) continue;
                    
                    const amountFromThisOrderInWei = remainingAmountInWei < amountToFillInWei ? remainingAmountInWei : amountToFillInWei;
                    if (amountFromThisOrderInWei <= 0n) continue;

                    console.log('Matching Order (Fallback):', {
                        orderId: order.onChainId,
                        remaining: formatUnits(remainingAmountInWei, order.tokenDecimals),
                        taking: formatUnits(amountFromThisOrderInWei, order.tokenDecimals),
                        stillNeeded: formatUnits(amountToFillInWei, selectedToken.decimals)
                    });
        
                    optimalOrders.push({
                        ...order,
                        firestoreId: order.id,
                        amountToTakeInWei: amountFromThisOrderInWei, 
                        amountToTake: Number(amountFromThisOrderInWei) / (10 ** order.tokenDecimals),
                        paymentMethod: paymentMethod,
                        price: 0, fiatCost: 0, 
                    });
                    amountToFillInWei -= amountFromThisOrderInWei;
                }

                if (amountToFillInWei > 0n) {
                    const amountFound = formatUnits(buyAmountInWei - amountToFillInWei, selectedToken.decimals);
                    addNotification({ type: 'error', message: `Insufficient Liquidity: Could only find ${parseFloat(amountFound).toFixed(2)} assets.` });
                    setIsMatching(false); 
                    return;
                }
                
                matchedOrders = optimalOrders;
            }
    
            setTradePlan({ matches: matchedOrders, totalCrypto: Number(cryptoAmount), totalFiat: 0, avgPrice: 0, buyerId: userId });
            setIsSellerSuggestionModalOpen(true);
    
        } catch (error: any) {
            addNotification({ type: 'error', message: 'Could not search for matches: ' + error.message });
        } finally {
            setIsMatching(false);
        }
    }, [selectedToken, userId, cryptoAmount, paymentMethod, selectedTokenAddress, fiatCurrency, maxMarkup, addNotification]);

    // Memoize seller selection handler
    const handleSellerSelected = useCallback(async (selectedSeller: any) => {
        if (!selectedSeller || !selectedSeller.matchedOrders.length) return;
        
        setIsSellerSuggestionModalOpen(false);
        
        // Create a trade plan with only the selected seller's orders
        const finalTradePlan: TradePlan = {
            matches: selectedSeller.matchedOrders,
            totalCrypto: selectedSeller.totalAmount,
            totalFiat: selectedSeller.totalFiatCost,
            avgPrice: selectedSeller.totalFiatCost / selectedSeller.totalAmount,
            buyerId: userId
        };
        
        await handleConfirmTrade(finalTradePlan);
    }, [userId]);

    // Memoize confirm trade handler
    const handleConfirmTrade = useCallback(async (finalTradePlan: TradePlan) => {
        if (!finalTradePlan || !finalTradePlan.matches.length) return;

        try {
            const orderIds = finalTradePlan.matches.map(match => BigInt(match.onChainId));
            const amountsToLockInWei = finalTradePlan.matches.map(match => match.amountToTakeInWei as bigint);
    
            const hash = await writeContractAsync({
                ...P2P_CONTRACT_CONFIG,
                functionName: 'lockMultipleTrades',
                args: [orderIds, amountsToLockInWei],
            });

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
    
            addNotification({ 
                type: 'success', 
                message: `${tradeLogs.length} new trades are available!`,
                link: '/dapp/trades' // Add the link here
            });
            
            router.push('/dapp/trades');
    
        } catch (error: any) {
            console.error("Lock Trade Error:", error);
            addNotification({ type: 'error', message: `Could not lock trade(s): ${error.shortMessage || error.message}` });
        } finally {
            reset();
        }
    }, [writeContractAsync, addNotification, router, reset]);

    return (
        <>
            {/* Title and Settings Button */}
            <div className="relative flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Find Best Match</h2>
                <div className="relative inline-block">
                    <button 
                        ref={settingsButtonRef}
                        onClick={() => setIsSettingsModalOpen(prev => !prev)} 
                        className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" 
                        aria-label="Buyer Settings"
                    >
                        <Settings size={20} />
                    </button>
                    <BuyerSettingsModal
                        isOpen={isSettingsModalOpen}
                        onClose={() => setIsSettingsModalOpen(false)}
                        onSave={handleSaveSettings}
                        initialMarkup={maxMarkup}
                        toggleButtonRef={settingsButtonRef}
                    />
                </div>
            </div>
            <form className="space-y-6">
                {/* Crypto Amount Input */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">I want to buy</label>
                    <div className="flex relative">
                        <input
                            type="number"
                            value={cryptoAmount}
                            onChange={e => { setCryptoAmount(e.target.value); setLastEdited('crypto'); }}
                            placeholder="0.00"
                            className="hide-number-arrows flex-grow w-full bg-slate-800/70 text-white rounded-xl p-4 text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition border border-slate-700 placeholder-gray-500 shadow-inner"
                        />
                        <button
                            type="button"
                            onClick={() => setIsTokenModalOpen(true)}
                            className="absolute right-0 top-0 h-full flex items-center justify-center px-4 bg-slate-700/80 hover:bg-slate-600/80 rounded-r-xl transition-colors group"
                        >
                            {isLoadingTokens ? <Spinner /> : (
                                <>
                                    <img src={selectedToken && selectedToken.symbol === 'ETH' ? '/eth.svg' : selectedToken && selectedToken.symbol === 'USDC' ? '/usdc.svg' : `https://effigy.im/a/${selectedTokenAddress}.svg`} alt="" className="h-6 w-6 rounded-full mr-2" />
                                    <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">{selectedToken?.symbol}</span>
                                    <ChevronDown className="h-5 w-5 text-gray-400 ml-1 group-hover:text-emerald-400 transition-colors" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
                {/* Fiat Amount Input */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">I will spend (approx.)</label>
                    <div className="flex relative">
                        <input
                            type="text"
                            inputMode="decimal"
                            value={formatFiatValue(fiatAmount)}
                            onChange={e => {
                                const sanitizedValue = e.target.value.replace(/,/g, '');
                                if (/^\d*\.?\d{0,2}$/.test(sanitizedValue)) {
                                    setFiatAmount(sanitizedValue);
                                    setLastEdited('fiat');
                                }
                            }}
                            placeholder="0.00"
                            className="flex-grow w-full bg-slate-800/70 text-white rounded-xl p-4 text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition border border-slate-700 placeholder-gray-500 shadow-inner"
                        />
                        <button
                            type="button"
                            onClick={() => setIsCurrencyModalOpen(true)}
                            className="absolute right-0 top-0 h-full flex items-center justify-center px-4 bg-slate-700/80 hover:bg-slate-600/80 rounded-r-xl transition-colors group"
                            disabled={supportedCurrencies.length === 0}
                        >
                            <Image src={`https://flagcdn.com/w40/${countryCode}.png`} alt={`${fiatCurrency} flag`} width={24} height={18} className="mr-2 rounded-sm" />
                            <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">{fiatCurrency}</span>
                            <ChevronDown className="h-5 w-5 text-gray-400 ml-1 group-hover:text-emerald-400 transition-colors" />
                        </button>
                    </div>
                </div>
                {/* Payment Method Selector */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">My payment method</label>
                    <button
                        type="button"
                        onClick={() => setIsPaymentMethodModalOpen(true)}
                        className="w-full flex items-center justify-between bg-slate-800/70 text-white rounded-xl p-4 text-lg border border-slate-700 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition group"
                    >
                        <span className="font-semibold group-hover:text-emerald-400 transition-colors">{paymentMethod || 'Select payment method'}</span>
                        <ChevronDown className="h-5 w-5 text-gray-400 ml-1 group-hover:text-emerald-400 transition-colors" />
                    </button>
                </div>
                {/* Action Button */}
                <div>
                    <button
                        type="button"
                        onClick={handleFindMatch}
                        disabled={isMatching || !cryptoAmount || !fiatAmount || !paymentMethod}
                        className={clsx(
                            "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500",
                            "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 hover:scale-[1.03] active:scale-95",
                            (isMatching || !cryptoAmount || !fiatAmount || !paymentMethod) && "opacity-60 cursor-not-allowed"
                        )}
                    >
                        {isMatching ? <Spinner text="Finding Match..." /> : 'Find Best Match'}
                    </button>
                </div>
            </form>
            {/* Modals and Selectors */}
            <TokenSelectorModal isOpen={isTokenModalOpen} onClose={() => setIsTokenModalOpen(false)} tokenList={tokenList} onSelectToken={handleTokenSelect} />
            <PaymentMethodSelectorModal isOpen={isPaymentMethodModalOpen} onClose={() => setIsPaymentMethodModalOpen(false)} paymentMethods={availablePaymentMethods} onSelectMethod={handlePaymentMethodSelect} selectedCurrency={fiatCurrency} />
            <CurrencySelectorModal isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)} currencies={supportedCurrencies} onSelectCurrency={handleCurrencySelect} />
            <BuyerRiskWarningModal isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} onConfirm={executeMatchFinding} />
            <SellerSuggestionModal
                isOpen={isSellerSuggestionModalOpen}
                onClose={() => setIsSellerSuggestionModalOpen(false)}
                onConfirm={handleSellerSelected}
                tradePlan={tradePlan}
                sellerProfiles={sellerProfiles}
            />
        </>
    );
});

export default BuyerDashboard;