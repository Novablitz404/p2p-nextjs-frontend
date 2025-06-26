'use client';

import Modal from '../ui/Modal';
import Image from 'next/image';
import { Connector } from 'wagmi';

interface WalletSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (connector: Connector) => void;
    // FIX: Add the `readonly` keyword to match the type from wagmi
    connectors: readonly Connector[];
}

const WalletSelectorModal = ({ isOpen, onClose, onConnect, connectors }: WalletSelectorModalProps) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
            <div className="space-y-4">
                <p className="text-center text-gray-400">Choose your preferred wallet to continue.</p>
                {/* This filter helps avoid showing duplicate "Browser Wallet" entries if multiple are injected */}
                {connectors.filter(c => c.type !== 'injected' || c.name === 'MetaMask').map((connector) => (
                    <button
                        key={connector.uid}
                        onClick={() => onConnect(connector)}
                        className="w-full flex items-center justify-center px-4 py-3 font-semibold bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        {connector.name === 'MetaMask' && <Image src="/MetaMask-icon-fox.svg" alt="MetaMask" width={24} height={24} className="mr-3" />}
                        {connector.name === 'Coinbase Wallet' && <Image src="/coinbase-wallet-logo.svg" alt="Coinbase" width={24} height={24} className="mr-3" />}
                        {connector.name}
                    </button>
                ))}
            </div>
        </Modal>
    );
};

export default WalletSelectorModal;