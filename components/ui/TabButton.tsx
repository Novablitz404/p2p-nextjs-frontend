// p2p-nextjs-frontend/components/ui/TabButton.tsx

'use client';

import React from 'react';

type TabId = 'buy' | 'sell'; // Create a specific type for the tab IDs

interface TabButtonProps {
    id: TabId;
    activeTab: TabId;
    // FIX: Update the prop type to be more specific and match the state setter
    setActiveTab: (id: TabId) => void; 
    color: 'emerald' | 'red';
    children: React.ReactNode;
}

const TabButton = ({ id, activeTab, setActiveTab, color, children }: TabButtonProps) => {
    const isActive = activeTab === id;
    
    const colorClasses = {
        emerald: 'text-emerald-400 border-emerald-400',
        red: 'text-red-400 border-red-400',
    };
    
    const activeClasses = colorClasses[color];
    const inactiveClasses = 'text-gray-400 border-transparent hover:text-white';
    
    return (
        <button 
            onClick={() => setActiveTab(id)} 
            className={`w-1/2 py-3 text-center font-semibold transition-all border-b-2 ${isActive ? activeClasses : inactiveClasses}`}
        >
            {children}
        </button>
    );
};

export default TabButton;