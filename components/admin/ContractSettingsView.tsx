'use client';

import AdminCard from "../ui/AdminCard";
import FeeManagement from "./FeeManagement";
import TimeoutManagement from "./TimeoutManagement";

const ContractSettingsView = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Contract Settings</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <AdminCard title="Manage Platform Fees">
                    <FeeManagement />
                </AdminCard>
                <AdminCard title="Manage Contract Timeouts">
                    <TimeoutManagement />
                </AdminCard>
            </div>
        </div>
    );
};

export default ContractSettingsView;