'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Zap, Users, Globe } from 'lucide-react';
import { Order } from '@/types';
import PublicOrderCard from '../ui/PublicOrderCard';
import PlatformStats from '../ui/PlatformStats';
import PriceCarousel from '../ui/PriceCarousel';

interface LandingPageProps {
  liveOrders: Order[];
}

const LandingPage = ({ liveOrders }: LandingPageProps) => {
    return (
        <>
            {/* Price Carousel */}
            <PriceCarousel />
            
            {/* Continuous Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Primary animated background pattern */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Ccircle cx='100' cy='100' r='4'/%3E%3Ccircle cx='50' cy='50' r='3'/%3E%3Ccircle cx='150' cy='150' r='3'/%3E%3Ccircle cx='50' cy='150' r='2'/%3E%3Ccircle cx='150' cy='50' r='2'/%3E%3Ccircle cx='25' cy='75' r='1'/%3E%3Ccircle cx='175' cy='125' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  animation: 'slide 180s linear infinite'
                }}></div>
                
                {/* Secondary subtle pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  animation: 'slide 240s linear infinite reverse'
                }}></div>
                
                {/* Gradient overlays for depth and focus */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-800/70 to-slate-900/90"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 via-transparent to-slate-900/50"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent"></div>
                
                {/* Floating ambient elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-emerald-500/8 to-blue-500/8 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-500/8 to-pink-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/8 to-purple-500/8 rounded-full blur-3xl animate-pulse delay-500"></div>
                <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-gradient-to-r from-emerald-500/6 to-purple-500/6 rounded-full blur-3xl animate-pulse delay-1500"></div>
            </div>

                        {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="relative flex flex-col items-center justify-center text-center pt-20 pb-16 px-4">
                    <div className="relative z-10 max-w-5xl mx-auto">

                        
                        {/* Main headline */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-8">
                            The future of <br />
                            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                decentralized peer-to-peer
                            </span>
                        </h1>
                        
                        {/* Subtitle */}
                        <p className="mt-8 max-w-3xl mx-auto text-lg md:text-xl text-gray-300 leading-relaxed mb-10">
                            The most secure and efficient P2P trading platform. 
                            <span className="text-emerald-400 font-semibold"> Zero fees</span>, instant settlements, and 
                            <span className="text-emerald-400 font-semibold"> smart contract escrow</span>.
                        </p>
                        
                        {/* CTA buttons */}
                        <div className="flex justify-center items-center mb-8">
                            <Link 
                                href="/dapp" 
                                className="group inline-flex items-center justify-center px-8 py-4 font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105 hover:from-emerald-600 hover:to-emerald-700"
                            >
                                <span className="mr-2">Launch App</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        
                        {/* Platform Stats in Hero */}
                        <div className="mt-8">
                            <PlatformStats />
                        </div>
                    </div>
                </div>
            </div>



            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
                <div className="absolute inset-0 bg-slate-800/10 rounded-3xl backdrop-blur-sm"></div>
                <div className="relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-4">Built for Traders</h2>
                        <p className="text-gray-400 max-w-3xl mx-auto text-lg">
                            Professional-grade P2P trading with institutional-level security and DeFi-native features.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-emerald-500/30 backdrop-blur-sm">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Smart Contract Escrow</h3>
                            <p className="text-gray-400 leading-relaxed">
                                All funds are locked in audited smart contracts with automatic dispute resolution and timeouts.
                            </p>
                        </div>
                        
                        <div className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-blue-500/30 backdrop-blur-sm">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="w-7 h-7 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Instant Settlement</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Real-time price feeds and instant confirmations with no waiting periods or delays.
                            </p>
                        </div>
                        
                        <div className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-purple-500/30 backdrop-blur-sm">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Globe className="w-7 h-7 text-purple-400" />
                                </div>
                            <h3 className="text-xl font-bold text-white mb-3">Global Liquidity</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Access to worldwide markets with support for multiple currencies and payment methods.
                            </p>
                        </div>
                        
                        <div className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:bg-slate-800/80 transition-all duration-300 hover:border-orange-500/30 backdrop-blur-sm">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Users className="w-7 h-7 text-orange-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Zero Fees</h3>
                            <p className="text-gray-400 leading-relaxed">
                                No platform fees, no hidden costs. Trade directly with peers without intermediaries.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Orders Section */}
            {liveOrders && liveOrders.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
                    <div className="absolute inset-0 bg-slate-800/15 rounded-3xl backdrop-blur-sm"></div>
                    <div className="relative z-10">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-white mb-4">Live Marketplace</h2>
                            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
                                Discover real-time orders from verified sellers across the globe. 
                                Start trading instantly with secure peer-to-peer transactions.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {liveOrders.map(order => (
                                <PublicOrderCard key={order.id} order={order} />
                            ))}
                        </div>
                        
                        <div className="text-center mt-12">
                            <Link 
                                href="/dapp" 
                                className="group inline-flex items-center justify-center px-8 py-4 font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105"
                            >
                                <span className="mr-2">Explore All Markets</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Section */}
            <div className="border-t border-slate-800/50 relative z-20">
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Brand */}
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-2xl font-bold text-white mb-4">P2P Exchange</h3>
                            <p className="text-gray-400 mb-6 max-w-md">
                                The most secure and efficient peer-to-peer trading platform. 
                                Built on Base Network with smart contract escrow.
                            </p>
                            <div className="flex space-x-4">
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-purple-400" />
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-4">Platform</h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/dapp" className="text-gray-400 hover:text-white transition-colors">
                                        Launch App
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dapp/trades" className="text-gray-400 hover:text-white transition-colors">
                                        View Markets
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dapp/orders" className="text-gray-400 hover:text-white transition-colors">
                                        Create Order
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Support */}
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
                                        Admin Panel
                                    </Link>
                                </li>
                                <li>
                                    <span className="text-gray-400">Base Network</span>
                                </li>
                                <li>
                                    <span className="text-gray-400">Smart Contracts</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 mt-12 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-400 text-sm">
                                © 2024 P2P Exchange. Built on Base Network.
                            </p>
                            <div className="flex items-center space-x-4 mt-4 md:mt-0">
                                <span className="text-xs text-gray-500">Live on Base</span>
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LandingPage;