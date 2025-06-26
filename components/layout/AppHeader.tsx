'use client';

import React, { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { Wallet } from 'lucide-react';
import Header from './Header';
import NotificationBell from '../notifications/NotificationBell';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import NetworkSwitcher from '../web3/NetworkSwitcher';
import { SUPPORTED_NETWORKS } from '@/constants';

// Dynamically import modals and sidebars to optimize initial load
const WalletSidebar = dynamic(() => import('./WalletSidebar'));
const NotificationCenter = dynamic(() => import('../notifications/NotificationCenter'));
const WalletSelectorModal = dynamic(() => import('../modals/WalletSelectorModal'));

const AppHeader = () => {
  // Use the new wagmi-powered hook to get context
  const { address, chainId, switchChain, connectors, connectWallet } = useWeb3();

  // State for controlling UI elements remains the same
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 border-b border-slate-700/50">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Logo wrapped in a Link to the homepage */}
            <Link href="/" aria-label="Back to homepage">
              <div className="flex items-center gap-3">
                <Image
                  src="/RampzLogo.png"
                  alt="P2P DEX Ramp Logo"
                  width={100}
                  height={100}
                  className="h-auto"
                  priority
                />
              </div>
            </Link>
            <Header />
          </div>

          <div className="flex items-center gap-3">
            {address ? (
              <>
                <NotificationBell onClick={() => setIsNotificationCenterOpen(true)} />
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center bg-slate-800 border border-slate-700 rounded-full px-4 py-2 hover:border-slate-500 transition-colors"
                >
                  <span className="text-sm font-mono text-gray-400">{`${address.substring(
                    0,
                    6
                  )}...${address.substring(address.length - 4)}`}</span>
                </button>

                <NetworkSwitcher
                  networks={SUPPORTED_NETWORKS}
                  currentChainId={chainId ?? 0}
                  onSwitchNetwork={(network) => {
                      // FIX: The call to switchChain must now be an object
                      if (switchChain) {
                          switchChain({ chainId: network.chainId });
                      }
                  }}
                />
              </>
            ) : (
              <button
                onClick={() => setIsWalletSelectorOpen(true)}
                className="flex items-center justify-center px-4 py-2 font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Wallet size={16} className="mr-2" /> Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modals and Sidebars */}
      <WalletSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
      <WalletSelectorModal
        isOpen={isWalletSelectorOpen}
        onClose={() => setIsWalletSelectorOpen(false)}
        onConnect={(connector) => {
          connectWallet(connector);
          setIsWalletSelectorOpen(false);
        }}
        connectors={connectors}
      />
    </>
  );
};

export default AppHeader;