import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, writeBatch } from 'firebase/firestore';
import { syncOrderRemainingAmount, batchSyncOrders } from './syncUtils';

export interface MismatchAlert {
  orderId: string;
  onChainId: string;
  firestoreAmount: number;
  blockchainAmount: number;
  difference: number;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  resolved?: boolean;
}

export interface SyncMetrics {
  totalOrders: number;
  syncedOrders: number;
  failedOrders: number;
  totalMismatches: number;
  averageDifference: number;
  timestamp: Date;
}

/**
 * Monitoring service for tracking remainingAmount consistency
 */
export class RemainingAmountMonitor {
  private static instance: RemainingAmountMonitor;
  private isMonitoring = false;
  private alertThresholds = {
    low: 0.001,    // 0.1% difference
    medium: 0.01,   // 1% difference
    high: 0.1       // 10% difference
  };

  static getInstance(): RemainingAmountMonitor {
    if (!RemainingAmountMonitor.instance) {
      RemainingAmountMonitor.instance = new RemainingAmountMonitor();
    }
    return RemainingAmountMonitor.instance;
  }

  /**
   * Start monitoring for mismatches
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Starting remainingAmount monitoring...');
    
    // Run initial scan
    await this.performFullScan();
    
    // Set up periodic monitoring
    setInterval(async () => {
      if (this.isMonitoring) {
        await this.performFullScan();
      }
    }, 300000); // Every 5 minutes
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('Stopping remainingAmount monitoring...');
  }

  /**
   * Perform a full scan of all orders
   */
  private async performFullScan(): Promise<SyncMetrics> {
    try {
      console.log('Performing full remainingAmount scan...');
      
      // Get all active orders
      const ordersQuery = query(
        collection(db, "orders"),
        where("status", "in", ["OPEN", "PENDING"])
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      if (orders.length === 0) {
        console.log('No active orders found for monitoring');
        return this.createEmptyMetrics();
      }

      // Prepare sync data
      const syncData = orders.map(order => ({
        orderId: order.id,
        onChainId: order.onChainId,
        tokenDecimals: order.tokenDecimals,
        chainId: order.chainId || 84532
      }));

      // Perform batch sync
      const syncResults = await batchSyncOrders(syncData);
      
      // Analyze results
      const metrics = this.analyzeSyncResults(syncResults);
      
      // Store metrics
      await this.storeMetrics(metrics);
      
      // Generate alerts for significant mismatches
      await this.generateAlerts(syncResults);
      
      console.log(`Scan complete: ${metrics.syncedOrders}/${metrics.totalOrders} orders synced`);
      return metrics;
      
    } catch (error) {
      console.error('Full scan failed:', error);
      return this.createEmptyMetrics();
    }
  }

  /**
   * Analyze sync results and calculate metrics
   */
  private analyzeSyncResults(results: any[]): SyncMetrics {
    const totalOrders = results.length;
    const syncedOrders = results.filter(r => r.success && r.firestoreUpdated).length;
    const failedOrders = results.filter(r => !r.success).length;
    const mismatches = results.filter(r => r.success && r.difference && r.difference > 0);
    const totalMismatches = mismatches.length;
    
    const averageDifference = mismatches.length > 0 
      ? mismatches.reduce((sum, r) => sum + (r.difference || 0), 0) / mismatches.length
      : 0;

    return {
      totalOrders,
      syncedOrders,
      failedOrders,
      totalMismatches,
      averageDifference,
      timestamp: new Date()
    };
  }

  /**
   * Generate alerts for significant mismatches
   */
  private async generateAlerts(syncResults: any[]): Promise<void> {
    const alerts: MismatchAlert[] = [];
    
    for (const result of syncResults) {
      if (!result.success || !result.difference) continue;
      
      const severity = this.calculateSeverity(result.difference);
      
      if (severity !== 'low') {
        alerts.push({
          orderId: result.orderId || 'unknown',
          onChainId: result.onChainId || 'unknown',
          firestoreAmount: result.firestoreAmount,
          blockchainAmount: result.blockchainAmount,
          difference: result.difference,
          timestamp: new Date(),
          severity
        });
      }
    }

    if (alerts.length > 0) {
      await this.storeAlerts(alerts);
      console.warn(`Generated ${alerts.length} mismatch alerts`);
    }
  }

  /**
   * Calculate alert severity based on difference
   */
  private calculateSeverity(difference: number): 'low' | 'medium' | 'high' {
    if (difference >= this.alertThresholds.high) return 'high';
    if (difference >= this.alertThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Store monitoring metrics
   */
  private async storeMetrics(metrics: SyncMetrics): Promise<void> {
    try {
      await setDoc(doc(db, "platformConfig", "monitoring"), {
        lastSyncMetrics: metrics,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error: any) {
      console.error('Failed to store metrics:', error);
      
      // Log specific error details for debugging
      if (error.code === 'permission-denied') {
        console.error('Permission denied - check Firestore rules for platformConfig/monitoring');
      } else if (error.code === 'unavailable') {
        console.error('Firestore service unavailable');
      } else {
        console.error('Unknown error storing metrics:', error.code, error.message);
      }
    }
  }

  /**
   * Store mismatch alerts
   */
  private async storeAlerts(alerts: MismatchAlert[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      alerts.forEach(alert => {
        const alertRef = doc(collection(db, "alerts"));
        batch.set(alertRef, {
          ...alert,
          type: 'remainingAmount_mismatch',
          resolved: false
        });
      });
      
      await batch.commit();
    } catch (error: any) {
      console.error('Failed to store alerts:', error);
      
      // Log specific error details for debugging
      if (error.code === 'permission-denied') {
        console.error('Permission denied - check Firestore rules for alerts collection');
      } else if (error.code === 'unavailable') {
        console.error('Firestore service unavailable');
      } else {
        console.error('Unknown error storing alerts:', error.code, error.message);
      }
    }
  }

  /**
   * Create empty metrics for error cases
   */
  private createEmptyMetrics(): SyncMetrics {
    return {
      totalOrders: 0,
      syncedOrders: 0,
      failedOrders: 0,
      totalMismatches: 0,
      averageDifference: 0,
      timestamp: new Date()
    };
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): { isActive: boolean; lastScan?: Date } {
    return {
      isActive: this.isMonitoring,
      lastScan: this.isMonitoring ? new Date() : undefined
    };
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(thresholds: { low: number; medium: number; high: number }): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
  }
}

/**
 * Utility function to start monitoring
 */
export function startRemainingAmountMonitoring(): void {
  const monitor = RemainingAmountMonitor.getInstance();
  monitor.startMonitoring();
}

/**
 * Utility function to stop monitoring
 */
export function stopRemainingAmountMonitoring(): void {
  const monitor = RemainingAmountMonitor.getInstance();
  monitor.stopMonitoring();
} 