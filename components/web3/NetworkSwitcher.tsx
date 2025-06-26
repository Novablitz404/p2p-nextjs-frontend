'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { NetworkConfig } from '@/constants';

interface NetworkSwitcherProps {
    networks: NetworkConfig[];
    currentChainId: number | null;
    onSwitchNetwork: (network: NetworkConfig) => void;
}

const NetworkSwitcher = ({ networks, currentChainId, onSwitchNetwork }: NetworkSwitcherProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentNetwork = networks.find(n => n.chainId === currentChainId) || null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-10 h-10 bg-slate-800 rounded-full border border-slate-700 hover:border-slate-500 transition-colors"
            >
                {currentNetwork ? (
                    <Image src={currentNetwork.logoUrl} alt={currentNetwork.chainName} width={24} height={24} />
                ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 animate-fade-in-up">
                    <ul className="p-1">
                        {networks.map(network => (
                            <li key={network.chainId}>
                                <button
                                    onClick={() => {
                                        onSwitchNetwork(network);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center p-2 rounded-md text-sm text-white hover:bg-slate-700 transition-colors"
                                >
                                    <Image src={network.logoUrl} alt={network.chainName} width={20} height={20} className="mr-3" />
                                    {network.chainName}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NetworkSwitcher;