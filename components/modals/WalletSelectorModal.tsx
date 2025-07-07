'use client';

import Modal from '../ui/Modal';
import Image from 'next/image';
import { Connector } from 'wagmi';
import { Star, Zap } from 'lucide-react';

interface WalletSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (connector: Connector) => void;
    connectors: readonly Connector[];
}

const WalletSelectorModal = ({ isOpen, onClose, onConnect, connectors }: WalletSelectorModalProps) => {
    if (!isOpen) return null;

    // --- THIS IS THE FIX ---
    // We update the filter to include 'WalletConnect' in the list of allowed wallets.
    const allowedConnectors = connectors.filter(
        (c) => c.name === 'MetaMask' || c.name === 'Coinbase Wallet' || c.name === 'WalletConnect'
    );

    // This logic to prevent duplicates is still useful.
    const uniqueConnectors = Array.from(new Map(allowedConnectors.map(c => [c.name, c])).values());

    // Sort connectors to put Coinbase Wallet first (recommended)
    const sortedConnectors = uniqueConnectors.sort((a, b) => {
        if (a.name === 'Coinbase Wallet') return -1;
        if (b.name === 'Coinbase Wallet') return 1;
        return 0;
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
            <div className="space-y-5">
                <p className="text-center text-gray-400 text-sm">Choose your preferred wallet to continue.</p>
                
                {/* We map over the corrected list */}
                {sortedConnectors.map((connector) => {
                    const isRecommended = connector.name === 'Coinbase Wallet';
                    return (
                        <button
                            key={connector.uid}
                            onClick={() => onConnect(connector)}
                            className={`w-full flex items-center justify-between px-6 py-4 font-bold text-white rounded-xl transition-all duration-200 shadow-lg ${
                                isRecommended 
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 border border-blue-400/30 hover:shadow-blue-500/25' 
                                    : 'bg-slate-700/60 border border-slate-600/40 hover:bg-slate-600/80 hover:shadow-slate-500/25'
                            }`}
                        >
                            <div className="flex items-center">
                                {/* Add the icon for WalletConnect */}
                                {connector.name === 'MetaMask' && <Image src="/MetaMask-icon-fox.svg" alt="MetaMask" width={24} height={24} className="mr-3" />}
                                {connector.name === 'Coinbase Wallet' && <Image src="/coinbase-wallet-logo.svg" alt="Coinbase Wallet" width={24} height={24} className="mr-3" />}
                                {connector.name === 'WalletConnect' && <Image src="/Walletconnect-logo.png" alt="WalletConnect" width={24} height={24} className="mr-3" />}
                                <span>{connector.name}</span>
                            </div>
                            
                            {isRecommended && (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-blue-400/20 px-2 py-1 rounded-full">
                                        <Star size={12} className="text-blue-300" />
                                        <span className="text-xs font-semibold text-blue-300">Recommended</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-emerald-400/20 px-2 py-1 rounded-full">
                                        <Zap size={12} className="text-emerald-300" />
                                        <span className="text-xs font-semibold text-emerald-300">Gasless</span>
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
                
                <div className="text-center text-xs text-gray-500 mt-4">
                    <p>💡 <strong>Coinbase Wallet</strong> is recommended for gasless transactions and seamless trading experience.</p>
                </div>
            </div>
        </Modal>
    );
};

export default WalletSelectorModal;