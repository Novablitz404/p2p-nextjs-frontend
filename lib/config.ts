// lib/config.ts

import { http, createConfig, createStorage, noopStorage } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected({
        target: 'metaMask',
    }),
    coinbaseWallet({
        appName: 'Rampz: P2P DEX',
        preference: 'smartWalletOnly',
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    }),
  ],
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : noopStorage,
  }),
  transports: {
    [baseSepolia.id]: http(),
  },
});