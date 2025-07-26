'use client';

import MonitoringView from '@/components/admin/MonitoringView';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen h-screen flex flex-col bg-slate-900">
      <main className="flex-1 overflow-y-auto p-6 pb-20">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Monitoring</h1>
          <p className="text-gray-400 mt-2">Real-time order synchronization monitoring</p>
        </div>
        <MonitoringView />
      </main>
    </div>
  );
} 