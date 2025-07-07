'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Spinner from '../ui/Spinner';
import { Token } from '@/types';
import { ChevronDown, X } from 'lucide-react';
import Image from 'next/image';
import { CURRENCY_PAYMENT_METHODS } from '@/constants';

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
}

const currencyCountryMap: { [key: string]: string } = {
    PHP: 'ph',
    USD: 'us',
    EUR: 'eu',
    THB: 'th',
};

const formatFiatValue = (value: string): string => {
    if (!value) return '';
    const cleanValue = value.replace(/,/g, '');
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};

const SellerOrderForm = ({ 
    onSubmit, 
    markupPercentage,
    tokenList, 
    supportedCurrencies, 
    isLoadingTokens, 
    myPaymentMethods, 
    isProcessing // Use the prop from the parent
}: SellerOrderFormProps) => {
    const [cryptoAmount, setCryptoAmount] = useState('');
    const [fiatAmount, setFiatAmount] = useState('');
    const [lastEdited, setLastEdited] = useState<'crypto' | 'fiat' | null>(null);

    const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
    const [fiatCurrency, setFiatCurrency] = useState('PHP');
    const [marketPrice, setMarketPrice] = useState<number | null>(null);
    const [isPriceLoading, setIsPriceLoading] = useState(false);
    
    const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<string[]>([]);
    
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    
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
        const fetchPrice = async () => {
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
        };
        fetchPrice();
    }, [selectedToken, fiatCurrency]);

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

    const handleTokenSelect = (address: string) => setSelectedTokenAddress(address);
    const handleCurrencySelect = (currency: string) => setFiatCurrency(currency);
    const handlePaymentMethodChange = (methodId: string) => {
        setSelectedPaymentMethodIds(prev => prev.includes(methodId) ? prev.filter(id => id !== methodId) : [...prev, methodId]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cryptoAmount || finalPriceRate === null || !selectedToken || selectedPaymentMethodIds.length === 0) {
            alert("Please fill out all fields.");
            return;
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

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Crypto Amount Input */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">I want to sell</label>
                    <div className="flex relative">
                        <input type="number" value={cryptoAmount} onChange={(e) => { setCryptoAmount(e.target.value); setLastEdited('crypto'); }} placeholder="0.00" className="hide-number-arrows flex-grow w-full bg-slate-800/70 text-white rounded-xl p-4 text-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition border border-slate-700 placeholder-gray-500 shadow-inner"/>
                        <button type="button" onClick={() => setIsTokenModalOpen(true)} className="absolute right-0 top-0 h-full flex items-center justify-center px-4 bg-slate-700/80 hover:bg-slate-600/80 rounded-r-xl transition-colors group">
                            {isLoadingTokens ? <Spinner /> : (
                                <>
                                    <img src={selectedToken && selectedToken.symbol === 'ETH' ? '/eth.svg' : selectedToken && selectedToken.symbol === 'USDC' ? '/usdc.svg' : `https://effigy.im/a/${selectedTokenAddress}.svg`} alt="" className="h-6 w-6 rounded-full mr-2" />
                                    <span className="font-bold text-white group-hover:text-red-400 transition-colors">{selectedToken?.symbol}</span>
                                    <ChevronDown className="h-5 w-5 text-gray-400 ml-1 group-hover:text-red-400 transition-colors" />
                                </>
                            )}
                        </button>
                    </div>
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
                        <button type="button" onClick={() => setIsCurrencyModalOpen(true)} className="absolute right-0 top-0 h-full flex items-center justify-center px-4 bg-slate-700/80 hover:bg-slate-600/80 rounded-r-xl transition-colors group" disabled={supportedCurrencies.length === 0}>
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
                        onClick={() => availablePaymentMethods.length > 0 && setIsPaymentModalOpen(true)}
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
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); handlePaymentMethodChange(method.id); }}
                                        className="ml-1 text-red-400 hover:text-white focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
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
                {/* Action Button */}
                <div>
                    <button 
                        type="submit" 
                        disabled={isProcessing || isLoadingTokens || isPriceLoading || availablePaymentMethods.length === 0 || !cryptoAmount || !fiatAmount || selectedPaymentMethodIds.length === 0} 
                        className={[
                            "w-full font-bold py-4 px-4 rounded-xl text-lg shadow-lg transition-all duration-200 flex items-center justify-center",
                            "bg-gradient-to-r from-red-500 via-red-400 to-red-600 text-white hover:from-red-400 hover:to-red-500 hover:scale-[1.03] active:scale-95",
                            (isProcessing || isLoadingTokens || isPriceLoading || availablePaymentMethods.length === 0 || !cryptoAmount || !fiatAmount || selectedPaymentMethodIds.length === 0) && "opacity-60 cursor-not-allowed"
                        ].join(' ')}
                    >
                        {isProcessing ? <Spinner text="Confirming..."/> : 'Create Sell Order'}
                    </button>
                </div>
            </form>

            <TokenSelectorModal isOpen={isTokenModalOpen} onClose={() => setIsTokenModalOpen(false)} tokenList={tokenList} onSelectToken={handleTokenSelect} />
            <MultiSelectPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} myPaymentMethods={availablePaymentMethods} selectedIds={selectedPaymentMethodIds} onSelectionChange={handlePaymentMethodChange} selectedCurrency={fiatCurrency} />
            <CurrencySelectorModal
                isOpen={isCurrencyModalOpen}
                onClose={() => setIsCurrencyModalOpen(false)}
                currencies={supportedCurrencies}
                onSelectCurrency={handleCurrencySelect}
            />
        </>
    );
};

export default SellerOrderForm;