// lib/config.ts

import { http, createConfig, createStorage, noopStorage } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

// Core Testnet chain config
export const coreTestnet = {
  id: 1114,
  name: 'Core Testnet',
  network: 'core-testnet',
  nativeCurrency: {
    name: 'Core',
    symbol: 'tCORE',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.test2.btcs.network'] },
    public: { http: ['https://rpc.test2.btcs.network'] },
  },
  blockExplorers: {
    default: { name: 'CoreScan', url: 'https://scan.test.btcs.network' },
  },
  testnet: true,
};

// Lisk Sepolia Testnet chain config
export const liskSepolia = {
  id: 4202,
  name: 'Lisk Sepolia Testnet',
  network: 'lisk-sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia-api.lisk.com'] },
    public: { http: ['https://rpc.sepolia-api.lisk.com'] },
  },
  blockExplorers: {
    default: { name: 'Lisk Blockscout', url: 'https://sepolia-blockscout.lisk.com' },
  },
  testnet: true,
};

// Morph Holesky chain config
export const morphHolesky = {
  id: 2810,
  name: 'Morph Holesky',
  network: 'morph-holesky',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc-holesky.morphl2.io'] },
    public: { http: ['https://rpc-holesky.morphl2.io'] },
  },
  blockExplorers: {
    default: { name: 'Morph Bridge', url: 'https://bridge-holesky.morphl2.io/' },
  },
  testnet: true,
};

// Example: How to add a new chain (Ethereum Mainnet)
// export const ethereumMainnet = {
//   id: 1,
//   name: 'Ethereum',
//   network: 'ethereum',
//   nativeCurrency: {
//     name: 'Ether',
//     symbol: 'ETH',
//     decimals: 18,
//   },
//   rpcUrls: {
//     default: { http: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'] },
//     public: { http: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'] },
//   },
//   blockExplorers: {
//     default: { name: 'Etherscan', url: 'https://etherscan.io' },
//   },
//   testnet: false,
// };

export const config = createConfig({
  chains: [liskSepolia, morphHolesky, baseSepolia, coreTestnet], // All networks enabled
  connectors: [
    injected({
        target: 'metaMask',
    }),
    coinbaseWallet({
        appName: 'Rampz: P2P DEX',
        preference: 'smartWalletOnly',
    }),
  ],
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : noopStorage,
  }),
  transports: {
    [liskSepolia.id]: http('https://rpc.sepolia-api.lisk.com'), // Lisk first
    [morphHolesky.id]: http('https://rpc-holesky.morphl2.io'), // Morph Holesky
    [baseSepolia.id]: http(),
    [coreTestnet.id]: http('https://rpc.test2.btcs.network'),
    // Add your new network transport here:
    // [ethereumMainnet.id]: http('https://mainnet.infura.io/v3/YOUR_INFURA_KEY'),
  },
});

// --- Shared price fetching logic for API routes ---
const coinIdMap: { [symbol: string]: string } = {
  'ETH': 'ethereum',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'IDRX': 'idrx',
  'tCORE': 'coredaoorg', // Add this line for testnet symbol
  'CORE': 'coredaoorg',  // Add this line for mainnet symbol
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