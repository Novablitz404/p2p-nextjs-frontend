'use client';

import Modal from '../ui/Modal';
import Image from 'next/image';
import { Connector } from 'wagmi';
import { Star, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface WalletSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (connector: Connector, chainId?: number) => void;
    connectors: readonly Connector[];
    selectedChainId?: number;
}

const WalletSelectorModal = ({ isOpen, onClose, onConnect, connectors, selectedChainId }: WalletSelectorModalProps) => {
    const [isMobile, setIsMobile] = useState(false);
    // Remove hasMetaMaskMobile state since we're always using deep-linking on mobile

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
            setIsMobile(isMobileDevice);
        };
        checkMobile();
    }, []);

    // Remove MetaMask mobile app detection useEffect

    if (!isOpen) return null;

    // Only allow MetaMask and Coinbase Wallet
    const allowedConnectors = connectors.filter(
        (c) => c.name === 'MetaMask' || c.name === 'Coinbase Wallet'
    );

    // This logic to prevent duplicates is still useful.
    const uniqueConnectors = Array.from(new Map(allowedConnectors.map(c => [c.name, c])).values());

    // Sort connectors to put Coinbase Wallet first (recommended)
    const sortedConnectors = uniqueConnectors.sort((a, b) => {
        if (a.name === 'Coinbase Wallet') return -1;
        if (b.name === 'Coinbase Wallet') return 1;
        return 0;
    });

    const handleMetaMaskConnect = async (connector: Connector) => {
        if (isMobile) {
            // Deep link to MetaMask mobile app and open site in MetaMask browser
            try {
                // Redirect to MetaMask's in-app browser
                window.location.href = `metamask://browser?url=${encodeURIComponent(window.location.href)}`;
                // Fallback to regular connection after a delay if deep-linking fails
                setTimeout(() => {
                    onConnect(connector, selectedChainId);
                }, 3000);
            } catch (error) {
                // Fallback to regular connection
                onConnect(connector, selectedChainId);
            }
        } else {
            // Regular connection for desktop
            onConnect(connector, selectedChainId);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
            <div className="space-y-5">
                <p className="text-center text-gray-400 text-sm">Choose your preferred wallet to continue.</p>
                
                {/* We map over the corrected list */}
                {sortedConnectors.map((connector) => {
                    const isRecommended = connector.name === 'Coinbase Wallet';
                    const isMetaMask = connector.name === 'MetaMask';
                    
                    return (
                        <button
                            key={connector.uid}
                            onClick={() => isMetaMask ? handleMetaMaskConnect(connector) : onConnect(connector, selectedChainId)}
                            className={`w-full flex items-center justify-between px-6 py-4 font-bold text-white rounded-xl transition-all duration-200 shadow-lg ${
                                isRecommended 
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 border border-blue-400/30 hover:shadow-blue-500/25' 
                                    : 'bg-slate-700/60 border border-slate-600/40 hover:bg-slate-600/80 hover:shadow-slate-500/25'
                            }`}
                        >
                            <div className="flex items-center">
                                {/* Remove WalletConnect icon */}
                                {connector.name === 'MetaMask' && <Image src="/MetaMask-icon-fox.svg" alt="MetaMask" width={24} height={24} className="mr-3" />}
                                {connector.name === 'Coinbase Wallet' && <Image src="/coinbase-wallet-logo.svg" alt="Coinbase Wallet" width={24} height={24} className="mr-3" />}
                                <span>{connector.name}</span>
                                {isMetaMask && isMobile && (
                                    <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                                        Mobile Browser
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {isRecommended && (
                                    <div className="flex items-center gap-1 text-blue-300 text-sm">
                                        <Star size={14} />
                                        <span>Recommended</span>
                                    </div>
                                )}
                                {isMetaMask && isMobile && (
                                    <div className="flex items-center gap-1 text-emerald-300 text-sm">
                                        <Zap size={14} />
                                        <span>Deep Link</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </Modal>
    );
};

export default WalletSelectorModal;