'use client';

import React, { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { Wallet, Menu, X } from 'lucide-react';
import Header from './Header';
import NotificationBell from '../notifications/NotificationBell';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import NetworkSwitcher from '../web3/NetworkSwitcher';
import { SUPPORTED_NETWORKS } from '@/constants';
import { usePathname } from 'next/navigation';


const WalletSidebar = dynamic(() => import('./WalletSidebar'));
const NotificationCenter = dynamic(() => import('../notifications/NotificationCenter'));
const WalletSelectorModal = dynamic(() => import('../modals/WalletSelectorModal'));

const AppHeader = () => {
  const { address, chainId, switchChain, connectors, connectWallet, isManager, isArbitrator } = useWeb3();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
  
  const pathname = usePathname();

  let navigation = [
      { name: 'Ramp', href: '/dapp' },
      { name: 'Trades', href: '/dapp/trades' },
      { name: 'Orders', href: '/dapp/orders' },
      { name: 'Payment Methods', href: '/dapp/payment-methods' },
  ];

  if (isArbitrator) {
      navigation.push({ name: 'Disputes', href: '/disputes' });
  }
  if (isManager) {
      navigation.push({ name: 'Admin', href: '/admin' });
  }

  const handleOpenSidebar = () => {
    setIsMobileMenuOpen(false);
    setIsSidebarOpen(true);
  }

  return (
    <>
      <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
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
                  className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-full px-4 py-2 hover:border-slate-500 transition-colors"
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

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 animate-fade-in md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)}></div>
          
          <div className="relative flex flex-col w-full max-w-xs h-full bg-slate-900 p-6">
              <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">Menu</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-white">
                      <X size={24}/>
                  </button>
              </div>

              {/* --- THIS IS THE CHANGE --- */}
              {/* Added Wallet Address button inside the mobile menu */}
              {address && (
                <div className="mt-6 border-b border-slate-700 pb-6">
                   <button
                    onClick={handleOpenSidebar}
                    className="w-full flex items-center bg-slate-800 border border-slate-700 rounded-full px-4 py-2 hover:border-slate-500 transition-colors"
                  >
                    <span className="text-sm font-mono text-gray-400">{`${address.substring(
                      0,
                      6
                    )}...${address.substring(address.length - 4)}`}</span>
                  </button>
                </div>
              )}

              <nav className="mt-6 flex flex-col space-y-2">
                  {navigation.map((item) => {
                      const isActive = pathname === item.href || (item.href !== '/dapp' && pathname.startsWith(item.href));
                      return (
                          <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`px-4 py-3 text-base font-semibold rounded-lg transition-colors ${
                                  isActive 
                                      ? 'bg-slate-700 text-white' 
                                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                              }`}
                          >
                              {item.name}
                          </Link>
                      );
                  })}
              </nav>
          </div>
        </div>
      )}

      {/* Your existing Modals and Sidebars */}
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