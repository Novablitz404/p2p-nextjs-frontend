'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Order } from '@/types'; // Import the Order type
import PublicOrderCard from '../ui/PublicOrderCard'; // Import the new card

// Update the component props to accept liveOrders
interface LandingPageProps {
  liveOrders: Order[];
}

const LandingPage = ({ liveOrders }: LandingPageProps) => {
    return (
        // Wrap everything in a fragment
        <>
            <div className="flex flex-col items-center justify-center text-center pt-10 pb-5">
                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                    The Decentralized <br />
                    <span className="text-emerald-400">Peer-to-Peer</span> Ramp
                </h1>
                <p className="mt-6 max-w-2xl text-lg text-gray-300">
                    Seamlessly on-ramp and off-ramp from crypto to fiat directly with peers. Secure, fast, and fully decentralized, powered by smart contracts.
                </p>
                <div className="mt-10">
                    <Link 
                        href="/dapp" 
                        className="inline-flex items-center justify-center px-8 py-4 font-semibold bg-emerald-500 text-white rounded-lg shadow-lg hover:bg-emerald-600 transition-colors transform hover:scale-105"
                    >
                        Launch DApp
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </div>
            </div>

            {/* --- THIS IS THE NEW SECTION --- */}
            {liveOrders && liveOrders.length > 0 && (
                <div className="max-w-6xl mx-auto px-4 py-10">
                    <h2 className="text-3xl font-bold text-center text-white mb-8">
                        Live on the Marketplace
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {liveOrders.map(order => (
                            <PublicOrderCard key={order.id} order={order} />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default LandingPage;