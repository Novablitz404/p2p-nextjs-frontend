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

// --- Shared price fetching logic for API routes ---
const coinIdMap: { [symbol: string]: string } = {
  'ETH': 'ethereum',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'IDRX': 'idrx',
};

export async function fetchTokenPrice(tokenSymbol: string, currency: string): Promise<number> {
  const coinId = coinIdMap[tokenSymbol];
  if (!coinId) {
    throw new Error(`Token symbol '${tokenSymbol}' is not supported.`);
  }
  const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${currency.toLowerCase()}`;
  const response = await fetch(coingeckoUrl, { next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error(`CoinGecko API responded with status ${response.status}`);
  }
  const data = await response.json();
  const price = data[coinId]?.[currency.toLowerCase()];
  if (price === undefined) {
    throw new Error(`Price for '${coinId}' in '${currency}' not found.`);
  }
  return price;
}