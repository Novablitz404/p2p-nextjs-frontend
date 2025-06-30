// lib/config.ts

import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    // This now specifically targets MetaMask
    injected({
        target: 'metaMask',
    }),
    // This specifically targets Coinbase Wallet
    coinbaseWallet({
        appName: 'Rampz: P2P DEX',
        preference: 'smartWalletOnly',
    }),
    // Adding WalletConnect is a good practice for mobile users
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
  // Adding a session manager is recommended for better performance and stability
  storage: createStorage({ storage: window.localStorage }),
});

// You will also need to add a createStorage import
import { createStorage } from 'wagmi'