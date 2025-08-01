import { readContract } from 'wagmi/actions';
import { config } from '@/lib/config';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { formatUnits, parseUnits } from 'viem';

export interface SyncResult {
  success: boolean;
  firestoreUpdated: boolean;
  blockchainAmount: bigint;
  firestoreAmount: number;
  difference?: number;
  error?: string;
}

export interface OrderSyncData {
  orderId: string;
  onChainId: string;
  tokenDecimals: number;
  chainId: number;
}

/**
 * Validates and synchronizes remainingAmount between blockchain and Firestore
 */
export async function syncOrderRemainingAmount(
  orderData: OrderSyncData,
  forceUpdate: boolean = false
): Promise<SyncResult> {
  try {
    const contractAddress = CONTRACT_ADDRESSES[orderData.chainId ?? DEFAULT_CHAIN_ID];
    const P2P_CONTRACT_CONFIG = {
      address: contractAddress as `0x${string}`,
      abi: P2PEscrowABI,
    };

    // 1. Read blockchain state
    const onChainOrder = await readContract(config, {
      ...P2P_CONTRACT_CONFIG,
      functionName: 'orders',
      args: [BigInt(orderData.onChainId)]
    });

    const blockchainRemainingAmount = onChainOrder[4] as bigint;
    const blockchainAmountFormatted = Number(formatUnits(blockchainRemainingAmount, orderData.tokenDecimals));

    // 2. Read Firestore state
    const orderDoc = await getDoc(doc(db, "orders", orderData.orderId));
    if (!orderDoc.exists()) {
      return {
        success: false,
        firestoreUpdated: false,
        blockchainAmount: blockchainRemainingAmount,
        firestoreAmount: 0,
        error: "Order not found in Firestore"
      };
    }

    const firestoreData = orderDoc.data();
    const firestoreRemainingAmount = firestoreData.remainingAmount || 0;

    // 3. Compare and calculate difference
    const difference = Math.abs(blockchainAmountFormatted - firestoreRemainingAmount);
    const tolerance = 0.000001; // Small tolerance for floating point precision

    // 4. Determine if sync is needed
    const needsSync = difference > tolerance || forceUpdate;

    if (!needsSync) {
      return {
        success: true,
        firestoreUpdated: false,
        blockchainAmount: blockchainRemainingAmount,
        firestoreAmount: firestoreRemainingAmount,
        difference
      };
    }

    // 5. Update Firestore to match blockchain
    await updateDoc(doc(db, "orders", orderData.orderId), {
      remainingAmount: blockchainAmountFormatted,
      lastSyncTimestamp: new Date(),
      syncSource: 'blockchain'
    });

    return {
      success: true,
      firestoreUpdated: true,
      blockchainAmount: blockchainRemainingAmount,
      firestoreAmount: blockchainAmountFormatted,
      difference
    };

  } catch (error: any) {
    return {
      success: false,
      firestoreUpdated: false,
      blockchainAmount: 0n,
      firestoreAmount: 0,
      error: error.message || 'Sync failed'
    };
  }
}

/**
 * Batch sync multiple orders
 */
export async function batchSyncOrders(orders: OrderSyncData[]): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);
    const batchPromises = batch.map(order => syncOrderRemainingAmount(order));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Validates order state before critical operations
 */
export async function validateOrderState(
  orderData: OrderSyncData,
  requiredAmount: number
): Promise<{ valid: boolean; availableAmount: number; error?: string }> {
  try {
    const syncResult = await syncOrderRemainingAmount(orderData);
    
    if (!syncResult.success) {
      return {
        valid: false,
        availableAmount: 0,
        error: syncResult.error
      };
    }

    const availableAmount = Number(formatUnits(syncResult.blockchainAmount, orderData.tokenDecimals));
    const valid = availableAmount >= requiredAmount;

    return {
      valid,
      availableAmount,
      error: valid ? undefined : `Insufficient remaining amount. Available: ${availableAmount}, Required: ${requiredAmount}`
    };
  } catch (error: any) {
    return {
      valid: false,
      availableAmount: 0,
      error: error.message || 'Validation failed'
    };
  }
}

/**
 * Atomic operation wrapper for trade creation with sync
 */
export async function atomicTradeCreation(
  tradeData: any,
  orderUpdates: Array<{ orderId: string; newRemainingAmount: number }>
): Promise<{ success: boolean; error?: string }> {
  const batch = writeBatch(db);
  
  try {
    console.log('AtomicTradeCreation Debug:', { tradeData, orderUpdates });
    
    // 1. Create trade document
    const tradeRef = doc(db, "trades", tradeData.id);
    batch.set(tradeRef, tradeData);

    // 2. Update order remaining amounts
    orderUpdates.forEach(({ orderId, newRemainingAmount }) => {
      console.log('Updating order:', { orderId, newRemainingAmount });
      const orderRef = doc(db, "orders", orderId);
      
      const updateData: any = {
        remainingAmount: newRemainingAmount,
        lastUpdated: new Date()
      };
      
      // If order is completely filled, update status to CLOSED
      if (newRemainingAmount <= 0) {
        updateData.status = 'CLOSED';
        console.log('Order completely filled, updating status to CLOSED');
      }
      
      batch.update(orderRef, updateData);
    });

    // 3. Commit all changes atomically
    await batch.commit();
    console.log('Atomic operation committed successfully');
    
    return { success: true };
  } catch (error: any) {
    console.error('Atomic operation failed:', error);
    return { 
      success: false, 
      error: error.message || 'Atomic operation failed' 
    };
  }
}

/**
 * Periodic reconciliation service
 */
export class ReconciliationService {
  private static instance: ReconciliationService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  static getInstance(): ReconciliationService {
    if (!ReconciliationService.instance) {
      ReconciliationService.instance = new ReconciliationService();
    }
    return ReconciliationService.instance;
  }

  startPeriodicSync(intervalMs: number = 300000): void { // 5 minutes default
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.syncInterval = setInterval(async () => {
      await this.performPeriodicSync();
    }, intervalMs);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
  }

  private async performPeriodicSync(): Promise<void> {
    try {
      // This would need to be implemented based on your specific needs
      // For now, it's a placeholder for the periodic sync logic
      console.log('Performing periodic sync...');
    } catch (error) {
      console.error('Periodic sync failed:', error);
    }
  }
} 