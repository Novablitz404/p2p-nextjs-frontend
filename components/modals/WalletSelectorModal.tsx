'use client';

import Modal from '../ui/Modal';
import Image from 'next/image';
import { Connector } from 'wagmi';

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
            <div className="space-y-4">
                <p className="text-center text-gray-400">Choose your preferred wallet to continue.</p>
                {/* We map over the corrected list */}
                {uniqueConnectors.map((connector) => (
                    <button
                        key={connector.uid}
                        onClick={() => onConnect(connector)}
                        className="w-full flex items-center justify-center px-4 py-3 font-semibold bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        {/* Add the icon for WalletConnect */}
                        {connector.name === 'MetaMask' && <Image src="/MetaMask-icon-fox.svg" alt="MetaMask" width={24} height={24} className="mr-3" />}
                        {connector.name === 'Coinbase Wallet' && <Image src="/coinbase-wallet-logo.svg" alt="Coinbase Wallet" width={24} height={24} className="mr-3" />}
                        {connector.name === 'WalletConnect' && <Image src="/Walletconnect-logo.png" alt="WalletConnect" width={24} height={24} className="mr-3" />}
                        {connector.name}
                    </button>
                ))}
            </div>
        </Modal>
    );
};

export default WalletSelectorModal;