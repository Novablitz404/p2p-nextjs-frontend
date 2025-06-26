'use client';

import { useState } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import Spinner from '@/components/ui/Spinner';
import dynamic from 'next/dynamic';

// Import all the necessary components for the admin section
import AdminSidebar, { AdminView } from '@/components/admin/AdminSidebar';
import NotAuthorizedMessage from '@/components/ui/NotAuthorizedMessage'; // Ensure this component exists
import ConnectWalletMessage from '@/components/ui/ConnectWalletMessage';

// Dynamically import the views for better performance
const DashboardView = dynamic(() => import('@/components/admin/DashboardView'));
const TokenManagement = dynamic(() => import('@/components/admin/TokenManagement'));
const ArbitratorManagementView = dynamic(() => import('@/components/admin/ArbitratorManagementView'));
const ManagerManagementView = dynamic(() => import('@/components/admin/ManagerManagementView'));
const ContractSettingsView = dynamic(() => import('@/components/admin/ContractSettingsView'));


const AdminPage = () => {
    // FIX: Use the new `isAuthenticating` state from our wagmi-powered hook
    const { isInitializing, isAuthenticating, address, isManager, isOwner } = useWeb3();
    const [activeView, setActiveView] = useState<AdminView>('dashboard');

    // The main loading state now correctly waits for both wallet connection and Firebase authentication
    const isLoading = isInitializing || isAuthenticating;

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Spinner text="Verifying credentials..." /></div>;
    }

    if (!address) {
        return <ConnectWalletMessage />;
    }
    
    // This authorization check remains the same
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
                // FIX: Use the new, more complete ManagerManagementView component
                return <ManagerManagementView />;
            case 'settings':
                // The ContractSettingsView likely needs refactoring as well if it makes contract calls
                return isOwner ? <ContractSettingsView /> : <NotAuthorizedMessage />;
            default:
                return <DashboardView />;
        }
    };

    return (
        <div className="flex h-full bg-slate-900">
            <AdminSidebar 
                activeView={activeView}
                setActiveView={setActiveView}
                isOwner={isOwner}
            />
            <main className="flex-1 p-6">
                {renderActiveView()}
            </main>
        </div>
    );
};

export default AdminPage;