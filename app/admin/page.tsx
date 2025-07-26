'use client';

import { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import Spinner from '@/components/ui/Spinner';
import dynamic from 'next/dynamic';
import { 
  ExternalLink, 
  Monitor, 
  Activity, 
  Heart, 
  Crown, 
  Shield, 
  Settings,
  UserCheck,
  Gem,
  LayoutDashboard
} from 'lucide-react';

// Import all the necessary components for the admin section
import AdminSidebar, { AdminView } from '@/components/admin/AdminSidebar';
import NotAuthorizedMessage from '@/components/ui/NotAuthorizedMessage';
import ConnectWalletMessage from '@/components/ui/ConnectWalletMessage';

// Dynamically import the views for better performance
const DashboardView = dynamic(() => import('@/components/admin/DashboardView'));
const TokenManagement = dynamic(() => import('@/components/admin/TokenManagement'));
const ArbitratorManagementView = dynamic(() => import('@/components/admin/ArbitratorManagementView'));
const ManagerManagementView = dynamic(() => import('@/components/admin/ManagerManagementView'));
const ContractSettingsView = dynamic(() => import('@/components/admin/ContractSettingsView'));
const MonitoringView = dynamic(() => import('@/components/admin/MonitoringView'));
const HealthDashboard = dynamic(() => import('@/components/admin/HealthDashboard'));

const AdminPage = () => {
    const { isInitializing, isAuthenticating, address, isManager, isOwner } = useWeb3();
    const [activeView, setActiveView] = useState<AdminView>('dashboard');

    const isLoading = isInitializing || isAuthenticating;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center items-center">
                <div className="text-center">
                    <Spinner text="Verifying credentials..." />
                </div>
            </div>
        );
    }

    if (!address) {
        return <ConnectWalletMessage />;
    }
    
    if (!isManager && !isOwner) {
        return <NotAuthorizedMessage />;
    }

    const renderActiveView = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardView />;
            case 'tokens':
                return <TokenManagement />;
            case 'arbitrators':
                return <ArbitratorManagementView />;
            case 'managers':
                return <ManagerManagementView />;
            case 'settings':
                return isOwner ? <ContractSettingsView /> : <NotAuthorizedMessage />;
            case 'monitoring':
                return <MonitoringView />;
            case 'health':
                return <HealthDashboard />;
            default:
                return <DashboardView />;
        }
    };

    const openInNewWindow = (url: string, title: string) => {
        const width = 1200;
        const height = 800;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        
        window.open(
            url,
            title,
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );
    };

    const getViewInfo = (view: AdminView) => {
        const viewInfo = {
            dashboard: { title: 'Dashboard', description: 'Platform overview and statistics', icon: LayoutDashboard, color: 'blue' },
            tokens: { title: 'Token Management', description: 'Manage approved tokens and fees', icon: Gem, color: 'purple' },
            arbitrators: { title: 'Arbitrator Management', description: 'Manage dispute arbitrators', icon: Shield, color: 'emerald' },
            managers: { title: 'Manager Management', description: 'Manage platform managers', icon: UserCheck, color: 'orange' },
            settings: { title: 'Contract Settings', description: 'Configure smart contract parameters', icon: Settings, color: 'red' },
            monitoring: { title: 'Monitoring', description: 'Real-time order synchronization monitoring', icon: Monitor, color: 'purple' },
            health: { title: 'System Health', description: 'Real-time system health monitoring', icon: Heart, color: 'emerald' },
        };
        return viewInfo[view];
    };

    const currentViewInfo = getViewInfo(activeView);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="flex h-screen">
                <AdminSidebar 
                    activeView={activeView}
                    setActiveView={setActiveView}
                    isOwner={isOwner}
                />
                
                <main className="flex-1 overflow-y-auto">
                    <div className="p-8 pb-20">
                        {/* Header Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full bg-${currentViewInfo.color}-500/20 border border-${currentViewInfo.color}-500/30`}>
                                        <currentViewInfo.icon className={`h-6 w-6 text-${currentViewInfo.color}-400`} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-white">{currentViewInfo.title}</h1>
                                        <p className="text-gray-400 mt-1">{currentViewInfo.description}</p>
                                    </div>
                                </div>
                                
                                {/* User Role Badge */}
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600/30">
                                        {isOwner ? (
                                            <>
                                                <Crown className="h-4 w-4 text-yellow-400" />
                                                <span className="text-sm font-medium text-white">Owner</span>
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="h-4 w-4 text-blue-400" />
                                                <span className="text-sm font-medium text-white">Manager</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Access Section - Only show on Dashboard */}
                        {activeView === 'dashboard' && (
                            <div className="mb-8">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 rounded-full bg-blue-500/20">
                                            <ExternalLink className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">Quick Access</h2>
                                    </div>
                                    <p className="text-gray-400 mb-6 leading-relaxed">
                                        Open these dashboards in separate windows for multi-monitor setup and comprehensive monitoring.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <button
                                            onClick={() => openInNewWindow('/admin/dashboard', 'Dashboard')}
                                            className="group relative overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                                                    <Activity className="h-6 w-6 text-blue-400" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="font-bold text-white text-lg mb-1">Dashboard</p>
                                                    <p className="text-sm text-gray-400">Platform overview and statistics</p>
                                                </div>
                                                <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                        </button>
                                        
                                        <button
                                            onClick={() => openInNewWindow('/admin/monitoring', 'Monitoring')}
                                            className="group relative overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                                                    <Monitor className="h-6 w-6 text-purple-400" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="font-bold text-white text-lg mb-1">Monitoring</p>
                                                    <p className="text-sm text-gray-400">Order synchronization monitoring</p>
                                                </div>
                                                <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                                            </div>
                                        </button>
                                        
                                        <button
                                            onClick={() => openInNewWindow('/admin/system-health', 'System Health')}
                                            className="group relative overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-xl p-6 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 hover:scale-105"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                                                    <Heart className="h-6 w-6 text-emerald-400" />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="font-bold text-white text-lg mb-1">System Health</p>
                                                    <p className="text-sm text-gray-400">Component health monitoring</p>
                                                </div>
                                                <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Main Content Area */}
                        <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30 shadow-lg overflow-hidden">
                            <div className="p-8">
                                {renderActiveView()}
                            </div>
                        </div>
                    </div>
                </main>
                
                {/* Enhanced Floating Action Button */}
                <div className="fixed bottom-8 right-8 z-50">
                    <div className="relative group">
                        <button
                            onClick={() => {
                                const menu = document.getElementById('quick-access-menu');
                                if (menu) {
                                    menu.classList.toggle('scale-100');
                                    menu.classList.toggle('scale-0');
                                }
                            }}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
                        >
                            <ExternalLink className="h-6 w-6" />
                        </button>
                        
                        {/* Enhanced Quick Access Menu */}
                        <div 
                            id="quick-access-menu"
                            className="absolute bottom-full right-0 mb-4 scale-0 transition-transform duration-300 origin-bottom-right"
                        >
                            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-slate-600 shadow-2xl p-3 space-y-2 min-w-[200px]">
                                <div className="px-3 py-2 border-b border-slate-600/30">
                                    <p className="text-sm font-semibold text-white">Quick Access</p>
                                    <p className="text-xs text-gray-400">Open in new window</p>
                                </div>
                                <button
                                    onClick={() => openInNewWindow('/admin/dashboard', 'Dashboard')}
                                    className="flex items-center gap-3 w-full px-3 py-3 text-left text-white hover:bg-slate-700/50 rounded-lg transition-colors group"
                                >
                                    <div className="p-1.5 rounded-full bg-blue-500/20">
                                        <Activity className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <span className="text-sm font-medium">Dashboard</span>
                                    <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-blue-400 transition-colors ml-auto" />
                                </button>
                                <button
                                    onClick={() => openInNewWindow('/admin/monitoring', 'Monitoring')}
                                    className="flex items-center gap-3 w-full px-3 py-3 text-left text-white hover:bg-slate-700/50 rounded-lg transition-colors group"
                                >
                                    <div className="p-1.5 rounded-full bg-purple-500/20">
                                        <Monitor className="h-4 w-4 text-purple-400" />
                                    </div>
                                    <span className="text-sm font-medium">Monitoring</span>
                                    <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-purple-400 transition-colors ml-auto" />
                                </button>
                                <button
                                    onClick={() => openInNewWindow('/admin/system-health', 'System Health')}
                                    className="flex items-center gap-3 w-full px-3 py-3 text-left text-white hover:bg-slate-700/50 rounded-lg transition-colors group"
                                >
                                    <div className="p-1.5 rounded-full bg-emerald-500/20">
                                        <Heart className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <span className="text-sm font-medium">System Health</span>
                                    <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-emerald-400 transition-colors ml-auto" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;