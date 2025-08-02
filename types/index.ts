import { Timestamp } from "firebase/firestore";

// The main blueprint for an Order document in Firestore
export interface Order {
    id: string; // Firestore document ID
    onChainId: string;
    seller: string;
    buyer?: string;
    markupPercentage: number;
    fiatCurrency: string;
    totalAmount: number;
    remainingAmount: number;
    status: 'OPEN' | 'PENDING' | 'CLOSED' | 'CANCELED';
    paymentMethods: string[];
    createdAt: Timestamp;
    orderType: 'NATIVE' | 'ERC20'; // To match the contract enum
    tokenAddress: string; // address(0) for native
    tokenSymbol: string; // e.g., 'ETH' or 'USDT'
    tokenDecimals: number;
    paymentDetails?: any;
    minBuyerCancellationRate?: number;
    chainId: number; // Add chainId for network filtering
}

// For the Buyer's trade plan
export interface MatchedOrder {
    firestoreId: string;
    onChainId: string;
    seller: string;
    amountToTake: number;
    price: number;
    fiatCost: number;
    fiatCurrency: string; // Ensure this is here
    markupPercentage: number;
    paymentMethod: string;
    tokenAddress: string; // Add this
    tokenSymbol: string;  // Add this
    tokenDecimals: number;
    sellerPaymentDetails?: string; 
    paymentDetails?: any;
    remainingAmount: number;
    sellerProfile?: UserProfile;
    amountToTakeInWei?: bigint;
    chainId: number; // Add chainId for network filtering
}

export interface TradePlan {
    matches: MatchedOrder[];
    totalCrypto: number;
    totalFiat: number;
    avgPrice: number;
    buyerId: string;
}

export interface Trade {
    id: string; // Firestore document ID
    onChainId: string;
    orderId: string;
    buyer: string;
    seller: string;
    amount: number;
    price: number;
    fiatCurrency: string;
    tokenSymbol: string;
    tokenAddress: string;
    tokenDecimals: number;
    status: 'LOCKED' | 'FIAT_PAID' | 'RELEASED' | 'CANCELED' | 'DISPUTED' | 'REQUESTING_SCREENSHOT';
    createdAt: Timestamp;
    fiatSentAt?: Timestamp;
    sellerPaymentDetails?: any;
    proofOfPaymentURL?: string;
    proofFilePath?: string;
    releaseTxHash?: string;
    creationTxHash?: string;
    cancellationTxHash?: string;
    reviewLeft?: boolean;
    disputeExplanation?: string;
    disputeRaisedAt?: Timestamp;
    disputeRaisedBy?: string;
    arbitratorAddress?: string;
    disputeResolvedAt?: Timestamp;
    disputeResolutionTime?: number;
    disputeWinner?: string;
    // New fields for screenshot requests
    screenshotRequestedAt?: Timestamp;
    screenshotRequestDeadline?: Timestamp;
    screenshotRequestReason?: string;
    screenshotRequestedBy?: string;
    chainId?: number; // Add chainId for network filtering
}


export interface Token {
    address: string;
    symbol: string;
    decimals: number;
}

export interface UserProfile {
    // These fields will be stored in /users/{userId}
    averageRating: number;
    ratingCount: number;
    tradeCount?: number; 
    cancellationCount?: number;
    averageReleaseTime?: number;
    releaseTimeCount?: number;
}

export interface Review {
    tradeId: string;
    reviewerId: string; // Buyer's address
    revieweeId: string; // Seller's address
    rating: number; // 1-5
    comment: string;
    createdAt: Timestamp;
}

export interface AppNotification {
    id: string;
    type: 'success' | 'info' | 'error';
    message: string;
    timestamp: Timestamp; // Use the Firestore Timestamp type
    read: boolean;
    link?: string;
}