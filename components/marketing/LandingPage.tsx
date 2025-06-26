'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, HelpCircle, MessageCircle } from 'lucide-react';

const LandingPage = () => {
    return (
        // Wrap everything in a fragment
        <>
            <div className="flex flex-col items-center justify-center text-center px-4 py-20">
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
        </>
    );
};

export default LandingPage;