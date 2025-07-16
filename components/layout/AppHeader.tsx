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

  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
  const [selectedChainId, setSelectedChainId] = useState<number>(chainId ?? SUPPORTED_NETWORKS[0].chainId);
  
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
      <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 bg-slate-900/80 backdrop-blur-md">
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
                <NotificationBell />
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="hidden sm:flex items-center bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600 rounded-full px-4 py-2 hover:border-emerald-500/50 hover:from-slate-700 hover:to-slate-600 transition-all duration-300"
                >
                  <Wallet size={16} className="mr-2 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">My Wallet</span>
                </button>

                <NetworkSwitcher
                  networks={SUPPORTED_NETWORKS}
                  currentChainId={chainId ?? 0}
                  onSwitchNetwork={(network) => {
                      if (switchChain) {
                          switchChain({ chainId: network.chainId });
                      }
                      setSelectedChainId(network.chainId);
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          
          <div className="relative flex flex-col w-full max-w-xs h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/RampzLogo.png"
                      alt="P2P DEX Ramp Logo"
                      width={60}
                      height={60}
                      className="h-auto"
                    />
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Menu</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full text-gray-400 hover:bg-slate-700/50 hover:text-white transition-colors">
                      <X size={24}/>
                  </button>
              </div>

              {/* Wallet Section */}
              {address && (
                <div className="p-6 border-b border-slate-700/50">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">My Wallet</h3>
                    <div className="p-4 rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-slate-600/50 backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                            <Wallet size={20} className="text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">Connected</div>
                            <div className="text-xs text-gray-400 font-mono">{`${address.substring(0, 6)}...${address.substring(address.length - 4)}`}</div>
                          </div>
                        </div>
                        <button
                          onClick={handleOpenSidebar}
                          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-500/30 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex-1 p-6">
                <nav className="space-y-2">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Navigation</h3>
                  </div>
                  {navigation.map((item) => {
                      const isActive = pathname === item.href || (item.href !== '/dapp' && pathname.startsWith(item.href));
                      return (
                          <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={`group flex items-center px-4 py-3 text-base font-semibold rounded-xl transition-all duration-300 ${
                                  isActive 
                                      ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-white border border-emerald-500/30' 
                                      : 'text-gray-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
                              }`}
                          >
                              <div className={`w-2 h-2 rounded-full mr-3 transition-colors ${
                                  isActive ? 'bg-emerald-400' : 'bg-gray-600 group-hover:bg-emerald-400'
                              }`}></div>
                              {item.name}
                          </Link>
                      );
                  })}
                </nav>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-700/50">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-2">P2P Exchange</div>
                  <div className="text-xs text-gray-600">Built on Base Network</div>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Your existing Modals and Sidebars */}
      <WalletSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <WalletSelectorModal
        isOpen={isWalletSelectorOpen}
        onClose={() => setIsWalletSelectorOpen(false)}
        onConnect={(connector, chainId) => {
          connectWallet(connector, chainId ?? selectedChainId);
          setIsWalletSelectorOpen(false);
        }}
        connectors={connectors}
        selectedChainId={selectedChainId}
      />
    </>
  );
};

export default AppHeader;