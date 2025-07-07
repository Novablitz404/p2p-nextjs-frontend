'use client';

import { useState } from 'react';
import Modal from './Modal';
import { Wallet, Search } from 'lucide-react';

interface PaymentMethodSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentMethods: string[];
    onSelectMethod: (method: string) => void;
    selectedCurrency?: string;
}

const PaymentMethodSelectorModal = ({ isOpen, onClose, paymentMethods, onSelectMethod, selectedCurrency }: PaymentMethodSelectorModalProps) => {
    // --- NEW: State for the search term ---
    const [searchTerm, setSearchTerm] = useState('');

    const handleSelect = (method: string) => {
        onSelectMethod(method);
        onClose();
    };

    // --- NEW: Filter the list based on the search term ---
    const filteredMethods = paymentMethods.filter(method => 
        method.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select a Payment Method">
            <div className="flex flex-col space-y-4">
                {/* --- NEW: Search Bar --- */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search payment method..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col space-y-2 max-h-[300px] overflow-y-auto -mr-2 pr-2">
                    {filteredMethods.length > 0 ? (
                        filteredMethods.map(method => (
                            <button 
                                key={method}
                                onClick={() => handleSelect(method)}
                                className="w-full flex items-center p-3 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                            >
                                <Wallet className="h-5 w-5 mr-3 text-emerald-400"/>
                                <span className="font-semibold text-white">{method}</span>
                            </button>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            {paymentMethods.length === 0 ? (
                                <div>
                                    <p className="mb-2">No payment methods available for {selectedCurrency || 'this currency'}.</p>
                                    <p className="text-sm">Please add payment methods that support {selectedCurrency || 'this currency'}.</p>
                                </div>
                            ) : (
                                <p>No results found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default PaymentMethodSelectorModal;