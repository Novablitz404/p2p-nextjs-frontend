'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWeb3 } from '@/lib/Web3Provider'; 

const Header = () => {
    const pathname = usePathname();
    const { isManager, isArbitrator } = useWeb3();

    // --- UPDATED: Navigation links now point to /dapp ---
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

    return (
        <nav className="hidden md:flex gap-2 bg-slate-800 p-1 rounded-full border border-slate-700">
            {navigation.map((item) => {
                // Check if the current path starts with the link's href for active state
                const isActive = pathname === item.href || (item.href !== '/dapp' && pathname.startsWith(item.href));
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                            isActive 
                                ? 'bg-slate-700 text-white' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );
};

export default Header;