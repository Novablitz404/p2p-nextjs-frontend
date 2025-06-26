'use client';

import React, { useState, useMemo } from 'react';
import { Token } from '@/types';
import Modal from './Modal';
import { Search } from 'lucide-react';

interface TokenSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokenList: Token[];
    onSelectToken: (tokenAddress: string) => void;
}

const TokenSelectorModal = ({ isOpen, onClose, tokenList, onSelectToken }: TokenSelectorModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter the token list based on the search term
    const filteredTokens = useMemo(() => {
        if (!searchTerm) {
            return tokenList;
        }
        const lowercasedSearch = searchTerm.toLowerCase();
        return tokenList.filter(token => 
            token.symbol.toLowerCase().includes(lowercasedSearch)
        );
    }, [searchTerm, tokenList]);

    const handleSelect = (address: string) => {
        onSelectToken(address);
        onClose(); // Close the modal after selection
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select a token">
            <div className="flex flex-col space-y-4">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or symbol"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                </div>

                {/* Token List */}
                <div className="max-h-[60vh] overflow-y-auto -mr-2 pr-2">
                    <ul className="space-y-2">
                        {filteredTokens.map(token => (
                            <li key={token.address}>
                                <button 
                                    onClick={() => handleSelect(token.address)}
                                    className="w-full flex items-center p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                                >
                                    <img 
                                        src={`https://effigy.im/a/${token.address}.svg`} 
                                        alt={`${token.symbol} logo`}
                                        className="h-8 w-8 rounded-full mr-4 bg-slate-700"
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white">{token.symbol}</span>
                                        <span className="text-sm text-gray-400">{token.symbol === 'ETH' ? 'Ethereum' : `${token.symbol} Token`}</span>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Modal>
    );
};

export default TokenSelectorModal;