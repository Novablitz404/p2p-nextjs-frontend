'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Spinner from '../ui/Spinner';
import { Token } from '@/types';
import { ChevronDown, X } from 'lucide-react';
import Image from 'next/image';

const TokenSelectorModal = dynamic(() => import('../ui/TokenSelectorModal'));
const MultiSelectPaymentModal = dynamic(() => import('../ui/MultiSelectPaymentModal'));
const CurrencySelectorModal = dynamic(() => import('../ui/CurrencySelectorModal'));

interface PaymentMethod {
    id: string;
    channel: string;
}

// --- THIS IS THE UPDATED PROPS INTERFACE ---
interface SellerOrderFormProps {
    // onSubmit is now simpler, as settings are managed by the parent
    onSubmit: (
        tokenAddress: string,
        tokenSymbol: string,
        amount: string,
        selectedPaymentMethodIds: string[],
        fiatCurrency: string
    ) => Promise<void>;
    markupPercentage: number; // Receives markup from parent for price calculation
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
    markupPercentage, // Use the prop from the parent
    tokenList, 
    supportedCurrencies, 
    isLoadingTokens, 
    myPaymentMethods, 
    isProcessing 
}: SellerOrderFormProps) => {
    const [cryptoAmount, setCryptoAmount] = useState('');
    const [fiatAmount, setFiatAmount] = useState('');
    const [lastEdited, setLastEdited] = useState<'crypto' | 'fiat' | null>(null);

    const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
    const [fiatCurrency, setFiatCurrency] = useState('PHP');
    const [marketPrice, setMarketPrice] = useState<number | null>(null);
    const [isPriceLoading, setIsPriceLoading] = useState(false);
    
    const [selectedPaymentMethodIds, setSelectedPaymentMethodIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    
    const selectedToken = tokenList.find(t => t.address === selectedTokenAddress);
    const countryCode = currencyCountryMap[fiatCurrency] || 'xx';

    // This calculation now uses the markupPercentage prop passed from the parent dashboard
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
        setIsSubmitting(true);
        // The onSubmit call is now simpler
        await onSubmit(
            selectedToken.address, 
            selectedToken.symbol, 
            cryptoAmount, 
            selectedPaymentMethodIds, 
            fiatCurrency
        );
        
        setCryptoAmount('');
        setFiatAmount('');
        setSelectedPaymentMethodIds([]);
        setIsSubmitting(false);
    };
    
    const selectedMethods = myPaymentMethods.filter(m => selectedPaymentMethodIds.includes(m.id));

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Crypto Amount Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">I want to sell</label>
                    <div className="flex relative">
                        <input type="number" value={cryptoAmount} onChange={(e) => { setCryptoAmount(e.target.value); setLastEdited('crypto'); }} placeholder="0.00" className="flex-grow w-full bg-slate-900 text-white rounded-lg p-3 text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition border border-slate-700"/>
                        <button type="button" onClick={() => setIsTokenModalOpen(true)} className="absolute right-0 top-0 h-full flex items-center justify-center px-4 bg-slate-700 hover:bg-slate-600 rounded-r-lg transition-colors">
                            {isLoadingTokens ? <Spinner /> : (
                                <>
                                    <img src={`https://effigy.im/a/${selectedTokenAddress}.svg`} alt="" className="h-6 w-6 rounded-full mr-2" />
                                    <span className="font-bold text-white">{selectedToken?.symbol}</span>
                                    <ChevronDown className="h-5 w-5 text-gray-400 ml-1" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Fiat Amount Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">I will receive (approx.)</label>
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
                            className="flex-grow w-full bg-slate-900 text-white rounded-lg p-3 text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition border border-slate-700"
                        />
                         <button type="button" onClick={() => setIsCurrencyModalOpen(true)} className="absolute right-0 top-0 h-full flex items-center justify-center px-4 bg-slate-700 hover:bg-slate-600 rounded-r-lg transition-colors disabled:opacity-50" disabled={supportedCurrencies.length === 0}>
                            <Image src={`https://flagcdn.com/w40/${countryCode}.png`} alt={`${fiatCurrency} flag`} width={24} height={18} className="mr-2 rounded-sm" />
                            <span className="font-bold text-white">{fiatCurrency}</span>
                            <ChevronDown className="h-5 w-5 text-gray-400 ml-1" />
                        </button>
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Receive payment via</label>
                    <div onClick={() => myPaymentMethods.length > 0 && setIsPaymentModalOpen(true)} className="w-full bg-slate-900 text-white rounded-lg p-2 text-lg transition border border-slate-700 min-h-[50px] flex items-center flex-wrap gap-2 cursor-pointer hover:border-slate-600">
                        {selectedMethods.length === 0 ? (
                            <span className="text-gray-500 px-2">{myPaymentMethods.length > 0 ? "Select payment methods..." : "Please add a payment method first."}</span>
                        ) : (
                            selectedMethods.map(method => (
                                <span key={method.id} className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-sm font-semibold px-2 py-1 rounded-full">
                                    {method.channel}
                                    <button type="button" onClick={(e) => { e.stopPropagation(); handlePaymentMethodChange(method.id);}} className="text-emerald-400 hover:text-white">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))
                        )}
                    </div>
                </div>

                <button 
                        type="submit" 
                        disabled={isSubmitting || isLoadingTokens || isPriceLoading || myPaymentMethods.length === 0} 
                        className="w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-400 text-white text-lg disabled:opacity-50"
                    >
                        {isSubmitting ? <Spinner text="Submitting..."/> : 'Create Sell Order'}
                </button>
            </form>

            <TokenSelectorModal isOpen={isTokenModalOpen} onClose={() => setIsTokenModalOpen(false)} tokenList={tokenList} onSelectToken={handleTokenSelect} />
            <MultiSelectPaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} myPaymentMethods={myPaymentMethods} selectedIds={selectedPaymentMethodIds} onSelectionChange={handlePaymentMethodChange} />
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