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
        <div className="flex h-full bg-slate-900">
            <AdminSidebar 
                activeView={activeView}
                setActiveView={setActiveView}
                isOwner={isOwner}
            />
            <main className="flex-1 p-6 overflow-y-auto">
                {renderActiveView()}
            </main>
        </div>
    );
};

export default AdminPage;