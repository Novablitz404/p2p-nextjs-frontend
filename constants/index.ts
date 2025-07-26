
// Maximum uint256 value for unlimited token approvals
export const MAX_UINT256 = 2n ** 256n - 1n;

export interface NetworkConfig {
    chainId: number;
    chainName: string;
    rpcUrls: string[];
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrls: string[];
    logoUrl: string; // For the dropdown UI
}

// Define Base Sepolia configuration
export const BASE_SEPOLIA_CONFIG: NetworkConfig = {
    chainId: 84532,
    chainName: "Base Sepolia",
    rpcUrls: [""],
    nativeCurrency: {
        name: "Sepolia Ether",
        symbol: "ETH",
        decimals: 18,
    },
    blockExplorerUrls: ["https://sepolia.basescan.org"],
    logoUrl: '/Base_Network_Logo.svg' // You will need to add this logo to your /public folder
};

export const CORE_TESTNET_CONFIG: NetworkConfig = {
    chainId: 1114,
    chainName: "Core Testnet",
    rpcUrls: ["https://rpc.test2.btcs.network"],
    nativeCurrency: {
        name: "Core",
        symbol: "tCORE",
        decimals: 18,
    },
    blockExplorerUrls: ["https://scan.test2.btcs.network"],
    logoUrl: '/core.svg',
};

// Example: How to add a new network (Ethereum Mainnet)
// export const ETHEREUM_MAINNET_CONFIG: NetworkConfig = {
//     chainId: 1,
//     chainName: "Ethereum Mainnet",
//     rpcUrls: ["https://mainnet.infura.io/v3/YOUR_INFURA_KEY"],
//     nativeCurrency: {
//         name: "Ether",
//         symbol: "ETH",
//         decimals: 18,
//     },
//     blockExplorerUrls: ["https://etherscan.io"],
//     logoUrl: '/eth.svg', // Add this logo to your /public folder
// };

// Array of all supported networks for the dropdown
export const SUPPORTED_NETWORKS: NetworkConfig[] = [
    BASE_SEPOLIA_CONFIG,
    CORE_TESTNET_CONFIG,
    // Add your new network here:
    // ETHEREUM_MAINNET_CONFIG,
    // You can add more supported networks here in the future
];

// Define the default network your app should run on
export const DEFAULT_CHAIN_ID = BASE_SEPOLIA_CONFIG.chainId;

// Currency to Payment Method Mapping
export const CURRENCY_PAYMENT_METHODS: { [key: string]: string[] } = {
    'PHP': [
        'GCash',
        'PayMaya',
        'Bank Transfer',
        'Cash Pickup',
        'Palawan Express',
        'Western Union',
        'MoneyGram'
    ],
    'USD': [
        'PayPal',
        'Venmo',
        'Zelle',
        'Bank Transfer',
        'Cash App',
        'Western Union',
        'MoneyGram'
    ],
    'EUR': [
        'PayPal',
        'Bank Transfer',
        'SEPA Transfer',
        'Western Union',
        'MoneyGram',
        'Revolut',
        'N26'
    ],
    'THB': [
        'PromptPay',
        'Bank Transfer',
        'Cash Pickup',
        'Western Union',
        'MoneyGram'
    ],
    'IDR': [
        'Bank Transfer',
        'OVO',
        'DANA',
        'GoPay',
        'ShopeePay',
        'Cash Pickup',
        'Western Union',
        'MoneyGram'
    ],
};

export const CONTRACT_ADDRESSES: Record<number, string> = {
  84532: "0xCE18CE7b380D35B01681259124E5E9d3Aa1ab325", // Base Sepolia
  1114:  "0xdE049eD3Cf212B54013367757149e347fd7172b4",   // Core Testnet
  // Add your new network contract address here:
  // 1: "0xYOUR_CONTRACT_ADDRESS_HERE", // Ethereum Mainnet
};