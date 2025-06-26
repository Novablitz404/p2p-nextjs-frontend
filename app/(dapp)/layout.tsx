// p2p-nextjs-frontend/app/(dapp)/layout.tsx

import React from 'react';
import AppHeader from '@/components/layout/AppHeader';
import ClientOnly from '@/components/ui/ClientOnly'; // 1. Import the new component

export default function DappLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* 2. Wrap the AppHeader in the ClientOnly component */}
      <ClientOnly>
        <AppHeader />
      </ClientOnly>
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}