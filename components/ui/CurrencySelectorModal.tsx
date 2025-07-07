'use client';

import { useState } from 'react';
import Modal from './Modal';
import { Search } from 'lucide-react';
import Image from 'next/image'; // Import the Next.js Image component

interface CurrencySelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currencies: string[];
    onSelectCurrency: (currency: string) => void;
}

// Map currency codes to country codes for the flag CDN
const currencyCountryMap: { [key: string]: string } = {
    PHP: 'ph',
    USD: 'us',
    EUR: 'eu',
    THB: 'th',
    IDR: 'id',
};

const CurrencySelectorModal = ({ isOpen, onClose, currencies, onSelectCurrency }: CurrencySelectorModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSelect = (currency: string) => {
        onSelectCurrency(currency);
        onClose();
    };

    const filteredCurrencies = currencies.filter(currency => 
        currency.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Currency">
            <div className="flex flex-col space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search currency (e.g., PHP, USD)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col space-y-2 max-h-[300px] overflow-y-auto -mr-2 pr-2">
                    {filteredCurrencies.length > 0 ? (
                        filteredCurrencies.map(currency => {
                            const countryCode = currencyCountryMap[currency] || 'xx'; // Fallback for unknown
                            return (
                                <button 
                                    key={currency}
                                    onClick={() => handleSelect(currency)}
                                    className="w-full flex items-center p-3 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                                >
                                    <Image
                                        src={`https://flagcdn.com/w40/${countryCode}.png`}
                                        alt={`${currency} flag`}
                                        width={20}
                                        height={15}
                                        className="mr-3 rounded-sm"
                                    />
                                    <span className="font-semibold text-white">{currency}</span>
                                </button>
                            );
                        })
                     ) : (
                        <p className="text-center text-gray-500 py-8">No results found.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CurrencySelectorModal;