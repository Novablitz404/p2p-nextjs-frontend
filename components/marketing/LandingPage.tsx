'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Zap, Globe, Coins, Star } from 'lucide-react';
import { Order } from '@/types';
import PublicOrderCard from '../ui/PublicOrderCard';
import PlatformStats from '../ui/PlatformStats';
import PriceCarousel from '../ui/PriceCarousel';
import { useState, useEffect } from 'react';

function SwapCardHero() {
  // BuyerDashboard swap card UI, with a subtle green-tinted gradient background
  return (
    <div className="relative w-full max-w-md mx-auto bg-gradient-to-br from-slate-900/80 via-emerald-900/70 to-slate-800/80 rounded-3xl shadow-2xl border border-slate-700/60 p-5 sm:p-8 md:p-10 flex flex-col gap-6 sm:gap-8">
      {/* Crypto Amount Input */}
      <div className="relative">
        <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1 sm:mb-2">I want to buy</label>
        <div className="flex relative">
          <input
            type="number"
            value={"1.00"}
            readOnly
            placeholder="0.00"
            className="hide-number-arrows flex-grow w-full bg-slate-800/70 text-white rounded-xl p-3 sm:p-4 text-base sm:text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition border border-slate-700 placeholder-gray-500 shadow-inner"
          />
          <div className="absolute right-0 top-0 h-full flex items-center justify-center px-3 sm:px-4 bg-slate-700/80 rounded-r-xl">
            <img src="/eth.svg" alt="ETH" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full mr-1 sm:mr-2" />
            <span className="font-bold text-white text-sm sm:text-base">ETH</span>
          </div>
        </div>
      </div>
      {/* Fiat Amount Input (skeleton) */}
      <div className="relative">
        <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-1 sm:mb-2">I will spend (approx.)</label>
        <div className="flex relative">
          <div className="flex-grow w-full bg-slate-800/70 rounded-xl p-3 sm:p-4 flex items-center">
            <div className="h-5 w-16 sm:h-6 sm:w-24 bg-slate-700 rounded animate-pulse" />
          </div>
          <div className="absolute right-0 top-0 h-full flex items-center justify-center px-3 sm:px-4 bg-slate-700/80 rounded-r-xl">
            <img src="https://flagcdn.com/w40/us.png" alt="USD flag" width={20} height={15} className="mr-1 sm:mr-2 rounded-sm" />
            <span className="font-bold text-white text-sm sm:text-base">USD</span>
          </div>
        </div>
      </div>
      {/* Action Button */}
      <button className="mt-2 w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 hover:scale-[1.03] active:scale-95">
        Start Trading
      </button>
    </div>
  );
}

interface LandingPageProps {
  liveOrders: Order[];
}

const LandingPage = ({ liveOrders }: LandingPageProps) => {
  const phrases = ['Peer-to-Peer', 'ETH-to-USD', 'USD-to-ETH'];
  const [animatedText, setAnimatedText] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedText((prev) => (prev + 1) % phrases.length);
    }, 3000); // Change every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Price Carousel */}
      <PriceCarousel />

      {/* Hero Section - Osmosis style */}
      <div className="pt-10 sm:pt-16 md:pt-20 pb-6 sm:pb-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex flex-col items-center justify-center relative">
          {/* Hero Card */}
          <div className="relative w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between bg-slate-900/80 rounded-3xl shadow-2xl px-4 sm:px-8 py-8 sm:py-14 md:py-20 md:px-16 z-10">
            {/* Apply a subtle green-tinted gradient background to the hero card */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900/80 via-emerald-900/70 to-slate-800/80 z-0" />
            <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between">
              {/* Left: Headline and CTA */}
              <div className="flex-1 flex flex-col items-start justify-center max-w-full md:max-w-2xl">
                <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-bold text-white leading-tight mb-4 sm:mb-6">
                  The Future of
                  <span className="relative inline-block ml-2 sm:ml-4 align-middle min-w-[9ch] xs:min-w-[10ch]" style={{ minWidth: '9ch' }}>
                    {phrases.map((phrase, idx) => (
                      <span
                        key={phrase}
                        className={`absolute left-0 top-0 transition-opacity duration-1000 ease-in-out text-emerald-400 whitespace-nowrap ${animatedText === idx ? 'opacity-100' : 'opacity-0'}`}
                        style={{ position: idx === 0 ? 'relative' : 'absolute' }}
                      >
                        {phrase}
                      </span>
                    ))}
                  </span>
                </h1>
                <p className="mt-2 sm:mt-4 max-w-full sm:max-w-3xl text-base xs:text-lg sm:text-2xl font-semibold text-white leading-relaxed mb-6 sm:mb-8">
                  <span className="text-emerald-400">Global Crypto</span>, <span className="text-blue-400">Local Access</span>. <span className="text-gray-300">On-chain</span> <span className="text-emerald-400">securely</span> <span className="text-gray-300">in seconds.</span>
                </p>
              </div>
              {/* Right: Overlapping Swap Card Illustration */}
              <div className="flex-1 flex items-center justify-center z-20 md:-mr-24 mt-8 sm:mt-10 md:mt-0 w-full md:w-auto">
                <SwapCardHero />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats Section - separate, card style */}
      <section className="relative z-20 max-w-6xl mx-auto px-2 sm:px-4 py-10 sm:py-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8 text-center">On boarding the next 1 million users on-chain</h2>
        <div className="flex flex-col md:flex-row gap-4 sm:gap-8 justify-center items-center">
          <PlatformStats />
        </div>
      </section>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-10 sm:py-16 relative z-10">
        <div className="absolute inset-0 bg-slate-800/10 rounded-3xl backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6">Built for Traders</h2>
            <p className="text-gray-400 max-w-full sm:max-w-4xl mx-auto text-base sm:text-xl">
              Professional-grade P2P trading with institutional-level security and DeFi-native features.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <div className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-emerald-500/30 backdrop-blur-sm hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Smart Contract Escrow</h3>
              <p className="text-gray-400 leading-relaxed">
                All funds are locked in audited smart contracts with automatic dispute resolution and timeouts.
              </p>
            </div>
            <div className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-blue-500/30 backdrop-blur-sm hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Instant Settlement</h3>
              <p className="text-gray-400 leading-relaxed">
                Real-time price feeds and instant confirmations with no waiting periods or delays.
              </p>
            </div>
            <div className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-purple-500/30 backdrop-blur-sm hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Global Liquidity</h3>
              <p className="text-gray-400 leading-relaxed">
                Access to worldwide markets with support for multiple currencies and payment methods.
              </p>
            </div>
            <div className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-orange-500/30 backdrop-blur-sm hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Coins className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Zero Fees</h3>
              <p className="text-gray-400 leading-relaxed">
                No platform fees, no hidden costs. Trade directly with peers without intermediaries.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Orders Section */}
      {liveOrders && liveOrders.length > 0 && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-10 sm:py-16 relative z-10">
          <div className="absolute inset-0 bg-slate-800/15 rounded-3xl backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="text-center mb-10 sm:mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6">Live Marketplace</h2>
              <p className="text-gray-400 text-base sm:text-xl max-w-full sm:max-w-4xl mx-auto">
                Discover real-time orders from verified sellers across the globe. Start trading instantly with secure peer-to-peer transactions.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {liveOrders.map(order => (
                <PublicOrderCard key={order.id} order={order} />
              ))}
            </div>
            <div className="text-center mt-10 sm:mt-16">
              <Link href="/dapp" className="group inline-flex items-center justify-center px-6 sm:px-10 py-4 sm:py-5 font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 text-base sm:text-lg">
                <span className="mr-2 sm:mr-3">Explore All Markets</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Osmosis style */}
      <footer className="w-full bg-slate-900/90 border-t border-slate-800 pt-10 sm:pt-16 pb-6 sm:pb-8 mt-10 sm:mt-16">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-8 text-left text-gray-400 mb-8 sm:mb-12">
            <div>
              <div className="font-bold text-white mb-3">Platform</div>
              <ul className="space-y-2">
                <li><a href="/dapp" className="hover:text-emerald-400 transition">Trade</a></li>
                <li><a href="/dapp" className="hover:text-emerald-400 transition">Orders</a></li>
                <li><a href="/dapp/payment-methods" className="hover:text-emerald-400 transition">Payment Methods</a></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-3">Token</div>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-emerald-400 transition">RAMPZ</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">CoinGecko</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">CoinMarketCap</a></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-3">Community</div>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-emerald-400 transition">Twitter</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Telegram</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Discord</a></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-3">Developers</div>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-emerald-400 transition">Docs</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">GitHub</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Grants</a></li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-3">Team</div>
              <ul className="space-y-2">
                <li><a href="mailto:hello@rampz.xyz" className="hover:text-emerald-400 transition">Contact</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 my-6 sm:my-8"></div>
          <div className="flex flex-col xs:flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src="/RampzLogo.png" alt="Rampz Logo" className="h-8 sm:h-10 w-auto" />
              <span className="font-bold text-white text-base sm:text-lg tracking-wide">RAMPZ</span>
            </div>
            <div className="flex gap-3 sm:gap-5 text-xl sm:text-2xl mt-2 xs:mt-0">
              <a href="#" className="hover:text-emerald-400 transition" aria-label="Twitter"><svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195A4.916 4.916 0 0 0 16.616 3c-2.72 0-4.924 2.206-4.924 4.924 0 .386.044.763.127 1.124C7.728 8.807 4.1 6.884 1.671 3.965c-.423.724-.666 1.561-.666 2.475 0 1.708.87 3.216 2.188 4.099a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.212c9.057 0 14.009-7.514 14.009-14.009 0-.213-.005-.425-.014-.636A10.012 10.012 0 0 0 24 4.557z"/></svg></a>
              <a href="#" className="hover:text-emerald-400 transition" aria-label="GitHub"><svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.809 1.304 3.495.997.108-.775.418-1.305.762-1.605-2.665-.305-5.466-1.334-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.018.005 2.045.138 3.003.404 2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.803 5.624-5.475 5.921.43.371.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.218.694.825.576C20.565 21.796 24 17.299 24 12c0-6.627-5.373-12-12-12z"/></svg></a>
              <a href="#" className="hover:text-emerald-400 transition" aria-label="Telegram"><svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.371 0 0 5.371 0 12c0 6.627 5.371 12 12 12s12-5.373 12-12c0-6.629-5.371-12-12-12zm5.707 8.293l-1.414 8.485c-.104.623-.441.771-.893.48l-2.475-1.826-1.193 1.15c-.132.132-.242.242-.495.242l.176-2.497 4.545-4.104c.198-.176-.043-.274-.308-.098l-5.617 3.537-2.419-.756c-.527-.164-.537-.527.11-.777l9.447-3.646c.441-.164.827.098.684.771z"/></svg></a>
            </div>
            <div className="text-gray-500 text-xs sm:text-sm mt-2 xs:mt-0">&copy; {new Date().getFullYear()} Rampz. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;