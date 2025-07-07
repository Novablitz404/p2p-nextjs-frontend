export const P2P_ESCROW_CONTRACT_ADDRESS = "0xE7222b0CBD56CAb0cebD26Bfec5579d495e0CE11";

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

// Array of all supported networks for the dropdown
export const SUPPORTED_NETWORKS: NetworkConfig[] = [
    BASE_SEPOLIA_CONFIG,
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