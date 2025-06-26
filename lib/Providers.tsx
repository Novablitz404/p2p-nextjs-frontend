// p2p-nextjs-frontend/lib/Providers.tsx

'use client';

import React, { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config';
import { Web3Provider } from './Web3Provider'; // Your existing provider
import { NotificationProvider } from './NotificationProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Web3Provider>
          <NotificationProvider>{children}</NotificationProvider>
        </Web3Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}