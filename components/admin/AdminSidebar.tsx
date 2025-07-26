'use client';

import { LayoutDashboard, Gem, Shield, UserCog, Settings, Activity, Heart, Crown, Users, Settings2 } from 'lucide-react';

// NEW: Define the type for the views
export type AdminView = 'dashboard' | 'tokens' | 'arbitrators' | 'managers' | 'settings' | 'monitoring' | 'health';

interface AdminSidebarProps {
    activeView: AdminView;
    setActiveView: (view: AdminView) => void;
    isOwner: boolean;
}

const AdminSidebar = ({ activeView, setActiveView, isOwner }: AdminSidebarProps) => {
    const navLinks = [
        { 
            id: 'dashboard', 
            label: 'Dashboard', 
            icon: LayoutDashboard, 
            ownerOnly: false,
            color: 'blue',
            description: 'Platform overview',
            group: 'main'
        },
        { 
            id: 'tokens', 
            label: 'Manage Tokens', 
            icon: Gem, 
            ownerOnly: false,
            color: 'purple',
            description: 'Token management',
            group: 'management'
        },
        { 
            id: 'arbitrators', 
            label: 'Manage Arbitrators', 
            icon: Shield, 
            ownerOnly: false,
            color: 'emerald',
            description: 'Dispute resolution',
            group: 'management'
        },
        { 
            id: 'managers', 
            label: 'Manage Managers', 
            icon: UserCog, 
            ownerOnly: true,
            color: 'orange',
            description: 'User management',
            group: 'management'
        },
        { 
            id: 'settings', 
            label: 'Contract Settings', 
            icon: Settings, 
            ownerOnly: true,
            color: 'red',
            description: 'Smart contract config',
            group: 'main'
        },
        { 
            id: 'monitoring', 
            label: 'Monitoring', 
            icon: Activity, 
            ownerOnly: false,
            color: 'purple',
            description: 'System monitoring',
            group: 'monitoring'
        },
        { 
            id: 'health', 
            label: 'System Health', 
            icon: Heart, 
            ownerOnly: false,
            color: 'emerald',
            description: 'Health monitoring',
            group: 'monitoring'
        },
    ];

    const groupedLinks = {
        main: navLinks.filter(link => link.group === 'main'),
        management: navLinks.filter(link => link.group === 'management'),
        monitoring: navLinks.filter(link => link.group === 'monitoring'),
    };

    const renderNavSection = (links: typeof navLinks, title: string, description: string) => {
        const filteredLinks = links.filter(link => !link.ownerOnly || isOwner);
        
        if (filteredLinks.length === 0) return null;

        return (
            <div className="mb-6">
                <div className="px-2 mb-3">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {description}
                    </p>
                </div>
                <nav className="space-y-2">
                    {filteredLinks.map((link) => {
                        const isActive = activeView === link.id;
                        const colorClasses = {
                            blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                            purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                            emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                            orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                            red: 'bg-red-500/10 text-red-400 border-red-500/30',
                        };

                        return (
                            <button
                                key={link.id}
                                onClick={() => setActiveView(link.id as AdminView)}
                                className={`w-full group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${
                                    isActive
                                        ? `${colorClasses[link.color as keyof typeof colorClasses]} border shadow-lg`
                                        : 'text-gray-300 hover:bg-slate-700/50 hover:text-white hover:border-slate-600/50 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                                        isActive 
                                            ? `${colorClasses[link.color as keyof typeof colorClasses].replace('bg-', 'bg-').replace('/10', '/20')}` 
                                            : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                                    }`}>
                                        <link.icon className={`h-5 w-5 transition-colors duration-300 ${
                                            isActive 
                                                ? colorClasses[link.color as keyof typeof colorClasses].split(' ')[1]
                                                : 'text-gray-400 group-hover:text-white'
                                        }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm transition-colors duration-300 ${
                                            isActive 
                                                ? colorClasses[link.color as keyof typeof colorClasses].split(' ')[1]
                                                : 'text-gray-300 group-hover:text-white'
                                        }`}>
                                            {link.label}
                                        </p>
                                        <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-300">
                                            {link.description}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Active indicator */}
                                {isActive && (
                                    <div className={`absolute right-0 top-0 bottom-0 w-1 ${colorClasses[link.color as keyof typeof colorClasses].split(' ')[0].replace('bg-', 'bg-').replace('/10', '')} rounded-l-full`} />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        );
    };

    return (
        <aside className="w-72 flex-shrink-0 h-screen overflow-y-auto bg-gradient-to-b from-slate-800 to-slate-900 p-6 flex flex-col border-r border-slate-700/50 shadow-xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        <Crown className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                        <p className="text-xs text-gray-400">Platform Management</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-grow">
                {/* Main Section */}
                {renderNavSection(groupedLinks.main, 'Main', 'Core platform functions')}
                
                {/* Management Section */}
                {renderNavSection(groupedLinks.management, 'Management', 'User and token management')}
                
                {/* Monitoring Section */}
                {renderNavSection(groupedLinks.monitoring, 'Monitoring', 'System monitoring and health')}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-400">Admin Panel Active</span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {isOwner ? 'Owner Access' : 'Manager Access'}
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;