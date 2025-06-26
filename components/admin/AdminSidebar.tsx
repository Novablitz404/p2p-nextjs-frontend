'use client';

import { LayoutDashboard, Gem, Shield, UserCog, Settings } from 'lucide-react';

// NEW: Define the type for the views
export type AdminView = 'dashboard' | 'tokens' | 'arbitrators' | 'managers' | 'settings';

interface AdminSidebarProps {
    activeView: AdminView;
    setActiveView: (view: AdminView) => void;
    isOwner: boolean;
}

const AdminSidebar = ({ activeView, setActiveView, isOwner }: AdminSidebarProps) => {
    const navLinks = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, ownerOnly: false },
        { id: 'tokens', label: 'Manage Tokens', icon: Gem, ownerOnly: false },
        { id: 'arbitrators', label: 'Manage Arbitrators', icon: Shield, ownerOnly: false },
        { id: 'managers', label: 'Manage Managers', icon: UserCog, ownerOnly: true },
        { id: 'settings', label: 'Contract Settings', icon: Settings, ownerOnly: true },
    ];

    return (
        <aside className="w-64 flex-shrink-0 bg-slate-800 p-4 flex flex-col border-r border-slate-700/50">
            <div className="flex-grow">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-4">
                    Admin Menu
                </h2>
                <nav className="space-y-2">
                    {navLinks.map((link) => {
                        // Don't render owner-only links if the user is not the owner
                        if (link.ownerOnly && !isOwner) {
                            return null;
                        }

                        const isActive = activeView === link.id;
                        return (
                            <button
                                key={link.id}
                                onClick={() => setActiveView(link.id as AdminView)}
                                className={`w-full flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                                    isActive
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                                }`}
                            >
                                <link.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                                {link.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
};

export default AdminSidebar;