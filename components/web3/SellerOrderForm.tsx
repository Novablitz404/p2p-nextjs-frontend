'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Spinner from '../ui/Spinner';
import { Token } from '@/types';
import { ChevronDown, X, Info } from 'lucide-react';
import Image from 'next/image';
import { CURRENCY_PAYMENT_METHODS } from '@/constants';
import TokenLogo from '../ui/TokenLogo';
import { useReadContracts } from 'wagmi';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';
import { parseUnits, zeroAddress } from 'viem';
import Tooltip from '../ui/Tooltip';
import { useWeb3 } from '@/lib/Web3Provider';


const TokenSelectorModal = dynamic(() => import('../ui/TokenSelectorModal'));
const MultiSelectPaymentModal = dynamic(() => import('../ui/MultiSelectPaymentModal'));
const CurrencySelectorModal = dynamic(() => import('../ui/CurrencySelectorModal'));

interface PaymentMethod {
    id: string;
    channel: string;
}

interface SellerOrderFormProps {
    onSubmit: (
        tokenAddress: string,
        tokenSymbol: string,
        amount: string,
        selectedPaymentMethodIds: string[],
        fiatCurrency: string
    ) => Promise<void>;
    markupPercentage: number;
    tokenList: Token[];
    supportedCurrencies: string[];
    isLoadingTokens: boolean;
    myPaymentMethods: PaymentMethod[];
    isProcessing: boolean;
    onOpenModal: (modalName: string, props: any) => void;
    onCloseModal: (modalName: string) => void;
}

const currencyCountryMap: { [key: string]: string } = {
    PHP: 'ph',
    USD: 'us',
    EUR: 'eu',
    THB: 'th',
    IDR: 'id',
};

const formatFiatValue = (value: string): string => {
    if (!value) return '';
    const cleanValue = value.replace(/,/g, '');
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

const SellerOrderForm = React.memo(({ 
    onSubmit, 
    markupPercentage,
    tokenList, 
    supportedCurrencies, 
    isLoadingTokens, 
    myPaymentMethods, 
    isProcessing,
    onOpenModal,
    onCloseModal
}: SellerOrderFormProps) => {
    const { chainId } = useWeb3();
    const [cryptoAmount, setCryptoAmount] = useState('');
    const [fiatAmount, setFiatAmount] = useState('');
    const [lastEdited, setLastEdited] = useState<'crypto' | 'fiat' | null>(null);

    const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
    const [fiatCurrency, setFiatCurrency] = useState('PHP');
    const [marketPrice, setMarketPrice] = useState<number | null>(null);
    const [isPriceLoading, setIsPriceLoading] = useState(false);
    
    const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<string[]>([]);
    

    
    const selectedToken = tokenList.find(t => t.address === selectedTokenAddress);
    const countryCode = currencyCountryMap[fiatCurrency] || 'xx';

    // Filter payment methods based on selected currency
    const availablePaymentMethods = useMemo(() => {
        const currencyMethods = CURRENCY_PAYMENT_METHODS[fiatCurrency] || [];
        return myPaymentMethods.filter(method => 
            currencyMethods.includes(method.channel)
        );
    }, [myPaymentMethods, fiatCurrency]);

    const selectedMethods = availablePaymentMethods.filter(m => selectedPaymentMethodIds.includes(m.id));

    const finalPriceRate = useMemo(() => {
        if (marketPrice === null) return null;
        return marketPrice * (1 + markupPercentage / 100);
    }, [marketPrice, markupPercentage]);
    
    useEffect(() => {
        if (tokenList.length > 0 && !selectedTokenAddress) setSelectedTokenAddress(tokenList[0].address);
    }, [tokenList, selectedTokenAddress]);

    useEffect(() => {
        if(supportedCurrencies.length > 0 && !supportedCurrencies.includes(fiatCurrency)) setFiatCurrency(supportedCurrencies[0] || 'PHP');
    }, [supportedCurrencies, fiatCurrency]);

    useEffect(() => {
        if (!selectedToken || !fiatCurrency) return;
        
        // Add a small delay to prevent rapid successive calls
        const timeoutId = setTimeout(async () => {
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
        }, 100);
        
        return () => clearTimeout(timeoutId);
    }, [selectedToken?.symbol, fiatCurrency]);

    useEffect(() => {
        if (lastEdited !== 'crypto' || finalPriceRate === null) return;
        const cryptoValue = parseFloat(cryptoAmount);
        const calculatedFiat = cryptoValue > 0 ? (cryptoValue * finalPriceRate) : NaN;
        setFiatAmount(isNaN(calculatedFiat) ? '' : calculatedFiat.toFixed(2));
    }, [cryptoAmount, finalPriceRate, lastEdited]);

    useEffect(() => {
        if (lastEdited !== 'fiat' || finalPriceRate === null) return;
        const fiatValue = parseFloat(fiatAmount.replace(/,/g, ''));
        setCryptoAmount(fiatValue > 0 && finalPriceRate > 0 ? (fiatValue / finalPriceRate).toPrecision(8) : '');
    }, [fiatAmount, finalPriceRate, lastEdited]);

    const handleTokenSelect = (address: string) => {
        setSelectedTokenAddress(address);
        onCloseModal('tokenSelector');
    };
    const handleCurrencySelect = (currency: string) => {
        setFiatCurrency(currency);
        onCloseModal('currencySelector');
    };
    const handlePaymentMethodChange = (methodId: string) => {
        setSelectedPaymentMethodIds(prev => prev.includes(methodId) ? prev.filter(id => id !== methodId) : [...prev, methodId]);
    };

    // Minimum sell order value in USD
    const MIN_SELL_USD = 30;
    const [usdToLocalRate, setUsdToLocalRate] = useState<number | null>(null);
    useEffect(() => {
        const fetchUsdRate = async () => {
            try {
                const response = await fetch(`/api/getTokenPrice?symbol=USD&currency=${fiatCurrency}`);
                if (!response.ok) throw new Error('Failed to fetch USD rate');
                const data = await response.json();
                setUsdToLocalRate(data.price);
            } catch (error) {
                setUsdToLocalRate(null);
            }
        };
        fetchUsdRate();
    }, [fiatCurrency]);
    const minSellLocal = usdToLocalRate ? MIN_SELL_USD * usdToLocalRate : MIN_SELL_USD;
    const sellOrderLocalValue = (marketPrice && cryptoAmount) ? parseFloat(cryptoAmount) * marketPrice : 0;
    const isBelowMinSell = sellOrderLocalValue > 0 && sellOrderLocalValue < minSellLocal;
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Only show the error if amount is > 0 and below minimum
    const showMinError = cryptoAmount && isBelowMinSell;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cryptoAmount || finalPriceRate === null || !selectedToken || selectedPaymentMethodIds.length === 0) {
            alert("Please fill out all fields.");
            return;
        }
        if (isBelowMinSell) {
            setErrorMsg(`Minimum sell order is ${minSellLocal.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${fiatCurrency}. Your order is only ${sellOrderLocalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${fiatCurrency}.`);
            return;
        } else {
            setErrorMsg(null);
        }
        await onSubmit(
            selectedToken.address, 
            selectedToken.symbol, 
            cryptoAmount, 
            selectedPaymentMethodIds, 
            fiatCurrency
        );
        // Clearing the form is now handled by the parent if needed,
        // which prevents the UI from resetting prematurely.
    };

    // Fetch platform fee from contract
    const contractAddress = CONTRACT_ADDRESSES[chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
    };
    const { data: feeData, isLoading: isLoadingFee } = useReadContracts({
        contracts: [
            { ...P2P_CONTRACT_CONFIG, functionName: 'platformFeeBps' },
        ],
        query: { enabled: !!selectedToken },
    });
    const platformFeeBps = feeData?.[0]?.result ? Number(feeData[0].result) : 0;
    
    // Debug logging - only log when values actually change
    useEffect(() => {
        console.log('Platform Fee Debug:', {
            currentChainId: chainId,
            usedChainId: chainId ?? DEFAULT_CHAIN_ID,
            contractAddress,
            feeData,
            platformFeeBps,
            isLoadingFee
        });
    }, [chainId, contractAddress, feeData, platformFeeBps, isLoadingFee]);
    
    const platformFeeRate = platformFeeBps / 10000;
    const amountNum = parseFloat(cryptoAmount) || 0;
    const platformFee = amountNum * platformFeeRate;
    const totalDeposit = amountNum + platformFee;
    const showFeeSection = amountNum > 0;

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Crypto Amount Input */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">I want to sell</label>
                    <div className="flex relative">
                        <input type="number" value={cryptoAmount} onChange={(e) => { setCryptoAmount(e.target.value); setLastEdited('crypto'); setErrorMsg(null); }} placeholder="0.00" className="hide-number-arrows flex-grow w-full bg-slate-800/70 text-white rounded-xl p-4 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition border border-slate-700 placeholder-gray-500 shadow-inner"/>
                        <button type="button" onClick={() => onOpenModal('tokenSelector', { tokenList, onSelect: handleTokenSelect })} className="absolute right-0 top-0 h-full flex items-center justify-center px-4 bg-slate-700/80 hover:bg-slate-600/80 rounded-r-xl transition-colors group">
                            {isLoadingTokens ? <Spinner /> : (
                                <>
                                    <TokenLogo symbol={selectedToken?.symbol || ''} address={selectedTokenAddress} className="h-6 w-6 rounded-full mr-2" size={24} />
                                    <span className="font-bold text-white group-hover:text-red-400 transition-colors">{selectedToken?.symbol}</span>
                                    <ChevronDown className="h-5 w-5 text-gray-400 ml-1 group-hover:text-red-400 transition-colors" />
                                </>
                            )}
                        </button>
                    </div>
                    {showMinError && (
                        <div className="text-xs text-red-400 mt-1">Minimum sell order is {minSellLocal.toLocaleString(undefined, { maximumFractionDigits: 2 })} {fiatCurrency}. Your order is only {sellOrderLocalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} {fiatCurrency}.</div>
                    )}
                    {errorMsg && (
                        <div className="text-xs text-red-400 mt-1">{errorMsg}</div>
                    )}
                </div>
                {/* Fiat Amount Input */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">I will receive (approx.)</label>
                    <div className="flex relative">
                        <input 
                            type="text"
                            inputMode="decimal"
                            value={formatFiatValue(fiatAmount)}
                            onChange={(e) => { 
                                const sanitizedValue = e.target.value.replace(/,/g, '');
                                if (/^\d*\.?\d{0,2}$/.test(sanitizedValue)) {
                                    setFiatAmount(sanitizedValue); 
                                    setLastEdited('fiat');
                                }
                            }} 
                            placeholder="0.00" 
                            className="flex-grow w-full bg-slate-800/70 text-white rounded-xl p-4 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition border border-slate-700 placeholder-gray-500 shadow-inner"
                        />
                                                    <button type="button" onClick={() => onOpenModal('currencySelector', { currencies: supportedCurrencies, onSelect: handleCurrencySelect })} className="absolute right-0 top-0 h-full flex items-center justify-center px-4 bg-slate-700/80 hover:bg-slate-600/80 rounded-r-xl transition-colors group" disabled={supportedCurrencies.length === 0}>
                            <Image src={`https://flagcdn.com/w40/${countryCode}.png`} alt={`${fiatCurrency} flag`} width={24} height={18} className="mr-2 rounded-sm" />
                            <span className="font-bold text-white group-hover:text-red-400 transition-colors">{fiatCurrency}</span>
                            <ChevronDown className="h-5 w-5 text-gray-400 ml-1 group-hover:text-red-400 transition-colors" />
                        </button>
                    </div>
                </div>
                {/* Payment Method Selector */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Receive payment via</label>
                    <button
                        type="button"
                        onClick={() => availablePaymentMethods.length > 0 && onOpenModal('multiSelectPayment', { myPaymentMethods: availablePaymentMethods, selectedIds: selectedPaymentMethodIds, onSelectionChange: handlePaymentMethodChange, selectedCurrency: fiatCurrency })}
                        className="w-full flex items-center flex-wrap gap-2 bg-slate-800/70 text-white rounded-xl p-4 text-lg border border-slate-700 hover:border-red-400 focus:ring-2 focus:ring-red-500 focus:outline-none transition group min-h-[50px]"
                        disabled={availablePaymentMethods.length === 0}
                    >
                        {selectedMethods.length === 0 ? (
                            <span className="text-gray-500">
                                {availablePaymentMethods.length > 0
                                    ? "Select payment methods..."
                                    : `No payment methods available for ${fiatCurrency}. Please add payment methods that support ${fiatCurrency}.`}
                            </span>
                        ) : (
                            selectedMethods.map(method => (
                                <span key={method.id} className="flex items-center gap-1.5 bg-red-500/20 text-red-300 text-sm font-semibold px-2 py-1 rounded-full">
                                    {method.channel}
                                    <span
                                        onClick={e => { e.stopPropagation(); handlePaymentMethodChange(method.id); }}
                                        className="ml-1 text-red-400 hover:text-white focus:outline-none cursor-pointer"
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handlePaymentMethodChange(method.id);
                                            }
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </span>
                                </span>
                            ))
                        )}
                    </button>
                    {availablePaymentMethods.length === 0 && myPaymentMethods.length > 0 && (
                        <p className="text-xs text-yellow-400 mt-1">
                            Available for {fiatCurrency}: {CURRENCY_PAYMENT_METHODS[fiatCurrency]?.join(', ') || 'None'}
                        </p>
                    )}
                </div>

                {/* Platform Fee and Total Deposit */}
                {showFeeSection && (
                    <div className="flex flex-col gap-1 bg-slate-900/60 rounded-xl px-3 py-2 border border-slate-800/60 mt-1 mb-1">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 flex items-center gap-1">
                                Platform Fee
                                <Tooltip text="This is the fee charged by the platform for each order.">
                                    <span className="flex items-center justify-center cursor-pointer text-gray-400">
                                        <Info size={14} className="rounded-full bg-slate-800" />
                                    </span>
                                </Tooltip>
                            </span>
                            {isLoadingFee ? (
                                <span className="text-gray-400">...</span>
                            ) : platformFeeBps === 0 ? (
                                <span className="text-emerald-400 font-semibold">✨ Zero ✨</span>
                            ) : (
                                <span className="text-white font-semibold">{platformFee} {selectedToken?.symbol || ''} <span className="text-gray-400">({platformFeeBps / 100}% fee)</span></span>
                            )}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 flex items-center gap-1">
                                Total Deposit
                                <Tooltip text="This is the total amount you will deposit, including the platform fee.">
                                    <span className="flex items-center justify-center cursor-pointer text-gray-400">
                                        <Info size={14} className="rounded-full bg-slate-800" />
                                    </span>
                                </Tooltip>
                            </span>
                            <span className="text-white font-semibold">{totalDeposit} {selectedToken?.symbol || ''}</span>
                        </div>
                    </div>
                )}
                {/* Action Button */}
                <div>
                    <button 
                        type="submit" 
                        className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-gradient-to-r from-red-500 via-red-400 to-red-600 text-white hover:from-red-400 hover:to-red-500 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!cryptoAmount || isBelowMinSell || isProcessing}
                    >
                        {isProcessing ? <Spinner text="Processing..." /> : 'Create Sell Order'}
                    </button>
                </div>
            </form>


        </>
    );
});

SellerOrderForm.displayName = 'SellerOrderForm';

export default SellerOrderForm;