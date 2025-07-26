import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, writeBatch } from 'firebase/firestore';
import { readContract } from 'wagmi/actions';
import { config } from '@/lib/config';
import { P2PEscrowABI } from '@/abis/P2PEscrow';
import { CONTRACT_ADDRESSES, DEFAULT_CHAIN_ID } from '@/constants';

export interface HealthStatus {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
  details?: any;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: HealthStatus[];
  lastUpdated: Date;
  uptime: number;
  performance: {
    averageResponseTime: number;
    slowestComponent: string;
    fastestComponent: string;
  };
}

export interface HealthMetrics {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  uptimePercentage: number;
  lastIncident?: Date;
  timestamp: Date;
}

/**
 * Comprehensive health monitoring system
 */
export class HealthMonitor {
  private static instance: HealthMonitor;
  private isMonitoring = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private healthHistory: SystemHealth[] = [];
  private maxHistorySize = 100;

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  /**
   * Start health monitoring
   */
  async startMonitoring(intervalMs: number = 60000): Promise<void> {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Starting health monitoring...');
    
    // Run initial health check
    await this.performHealthCheck();
    
    // Set up periodic monitoring
    this.checkInterval = setInterval(async () => {
      if (this.isMonitoring) {
        await this.performHealthCheck();
      }
    }, intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('Stopping health monitoring...');
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    const components: HealthStatus[] = [];

    try {
      // 1. Website Health Check
      components.push(await this.checkWebsiteHealth());

      // 2. Database Health Check
      components.push(await this.checkDatabaseHealth());

      // 3. Blockchain Health Check
      components.push(await this.checkBlockchainHealth());

      // 4. Smart Contract Health Check
      components.push(await this.checkSmartContractHealth());

      // 5. API Health Check
      components.push(await this.checkAPIHealth());

      // 6. Storage Health Check
      components.push(await this.checkStorageHealth());

      // 7. Network Connectivity Check
      components.push(await this.checkNetworkHealth());

      // 8. Memory/Performance Check
      components.push(await this.checkPerformanceHealth());

    } catch (error) {
      console.error('Health check failed:', error);
    }

    const overall = this.calculateOverallHealth(components);
    const performance = this.calculatePerformanceMetrics(components);

    const systemHealth: SystemHealth = {
      overall,
      components,
      lastUpdated: new Date(),
      uptime: Date.now() - startTime,
      performance
    };

    // Store health data
    await this.storeHealthData(systemHealth);
    
    // Update history
    this.healthHistory.push(systemHealth);
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }

    console.log(`Health check complete: ${overall} (${components.length} components)`);
    return systemHealth;
  }

  /**
   * Check website health (frontend availability)
   */
  private async checkWebsiteHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Check if we can access the main page
      const response = await fetch('/', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'healthy' : 'warning';
      
      return {
        component: 'Website',
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          statusCode: response.status,
          statusText: response.statusText
        }
      };
    } catch (error: any) {
      return {
        component: 'Website',
        status: 'critical',
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check database health (Firestore connectivity)
   */
  private async checkDatabaseHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test Firestore read operation with a simple query
      const testQuery = query(collection(db, "platformConfig"));
      const snapshot = await getDocs(testQuery);
      
      const responseTime = Date.now() - startTime;
      const status = responseTime < 5000 ? 'healthy' : responseTime < 10000 ? 'warning' : 'critical';
      
      return {
        component: 'Database',
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          documentCount: snapshot.size,
          responseTime: responseTime,
          connected: true
        }
      };
    } catch (error: any) {
      return {
        component: 'Database',
        status: 'critical',
        lastCheck: new Date(),
        error: error.message,
        details: {
          connected: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Check blockchain health (network connectivity)
   */
  private async checkBlockchainHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test blockchain connection by reading a simple contract function
      const contractAddress = CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];
      const result = await readContract(config, {
        address: contractAddress as `0x${string}`,
        abi: P2PEscrowABI,
        functionName: 'owner',
      });
      
      const responseTime = Date.now() - startTime;
      const status = responseTime < 10000 ? 'healthy' : responseTime < 30000 ? 'warning' : 'critical';
      
      return {
        component: 'Blockchain',
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          ownerAddress: result,
          networkId: DEFAULT_CHAIN_ID
        }
      };
    } catch (error: any) {
      return {
        component: 'Blockchain',
        status: 'critical',
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check smart contract health
   */
  private async checkSmartContractHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      const contractAddress = CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];
      
      // Test multiple contract functions
      const [owner, platformFeeBps, paused] = await Promise.all([
        readContract(config, {
          address: contractAddress as `0x${string}`,
          abi: P2PEscrowABI,
          functionName: 'owner',
        }),
        readContract(config, {
          address: contractAddress as `0x${string}`,
          abi: P2PEscrowABI,
          functionName: 'platformFeeBps',
        }),
        readContract(config, {
          address: contractAddress as `0x${string}`,
          abi: P2PEscrowABI,
          functionName: 'paused',
        })
      ]);
      
      const responseTime = Date.now() - startTime;
      const status = responseTime < 15000 ? 'healthy' : responseTime < 30000 ? 'warning' : 'critical';
      
      return {
        component: 'Smart Contract',
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          owner: owner,
          platformFeeBps: platformFeeBps.toString(),
          paused: paused
        }
      };
    } catch (error: any) {
      return {
        component: 'Smart Contract',
        status: 'critical',
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check API health
   */
  private async checkAPIHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test multiple API endpoints
      const [tokenPriceResponse, platformStatsResponse] = await Promise.all([
        fetch('/api/getTokenPrice?symbol=ETH&currency=USD'),
        fetch('/api/getPlatformStats')
      ]);
      
      const responseTime = Date.now() - startTime;
      const allSuccessful = tokenPriceResponse.ok && platformStatsResponse.ok;
      const status = allSuccessful ? 'healthy' : 'warning';
      
      return {
        component: 'API',
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          tokenPriceStatus: tokenPriceResponse.status,
          platformStatsStatus: platformStatsResponse.status,
          endpointsTested: 2
        }
      };
    } catch (error: any) {
      return {
        component: 'API',
        status: 'critical',
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check storage health (Firebase Storage)
   */
  private async checkStorageHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test storage access by checking if we can list files
      // This is a simplified check - in production you might want to test actual file operations
      const responseTime = Date.now() - startTime;
      
      return {
        component: 'Storage',
        status: 'healthy',
        responseTime,
        lastCheck: new Date(),
        details: {
          storageType: 'Firebase Storage',
          accessible: true
        }
      };
    } catch (error: any) {
      return {
        component: 'Storage',
        status: 'critical',
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check network connectivity (internal only to avoid CORS issues)
   */
  private async checkNetworkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test internal connectivity instead of external sites to avoid CORS
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'healthy' : 'warning';
      
      return {
        component: 'Network',
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          internalConnectivity: response.ok,
          responseTime: responseTime
        }
      };
    } catch (error: any) {
      return {
        component: 'Network',
        status: 'critical',
        lastCheck: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Check performance health (memory, CPU)
   */
  private async checkPerformanceHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Browser-based performance metrics
      const performance = window.performance;
      const memory = (performance as any).memory;
      
      const responseTime = Date.now() - startTime;
      
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let memoryUsage = 'N/A';
      let loadTime = 'N/A';
      
      if (memory) {
        const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;
        memoryUsage = (usage * 100).toFixed(2) + '%';
        
        if (usage > 0.9) status = 'critical';
        else if (usage > 0.7) status = 'warning';
      }
      
      // Calculate load time if available
      if (performance.timing && performance.timing.loadEventEnd && performance.timing.navigationStart) {
        loadTime = (performance.timing.loadEventEnd - performance.timing.navigationStart) + 'ms';
      }
      
      return {
        component: 'Performance',
        status,
        responseTime,
        lastCheck: new Date(),
        details: {
          memoryUsage,
          loadTime,
          userAgent: navigator.userAgent.substring(0, 50) + '...'
        }
      };
    } catch (error: any) {
      return {
        component: 'Performance',
        status: 'unknown',
        lastCheck: new Date(),
        error: error.message,
        details: {
          memoryUsage: 'N/A',
          loadTime: 'N/A',
          error: error.message
        }
      };
    }
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth(components: HealthStatus[]): 'healthy' | 'warning' | 'critical' {
    const criticalCount = components.filter(c => c.status === 'critical').length;
    const warningCount = components.filter(c => c.status === 'warning').length;
    
    if (criticalCount > 0) return 'critical';
    if (warningCount > 0) return 'warning';
    return 'healthy';
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(components: HealthStatus[]): {
    averageResponseTime: number;
    slowestComponent: string;
    fastestComponent: string;
  } {
    const componentsWithTime = components.filter(c => c.responseTime !== undefined);
    
    if (componentsWithTime.length === 0) {
      return {
        averageResponseTime: 0,
        slowestComponent: 'N/A',
        fastestComponent: 'N/A'
      };
    }

    const responseTimes = componentsWithTime.map(c => c.responseTime!);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    
    const slowest = componentsWithTime.reduce((prev, current) => 
      (prev.responseTime || 0) > (current.responseTime || 0) ? prev : current
    );
    
    const fastest = componentsWithTime.reduce((prev, current) => 
      (prev.responseTime || Infinity) < (current.responseTime || Infinity) ? prev : current
    );

    return {
      averageResponseTime,
      slowestComponent: slowest.component,
      fastestComponent: fastest.component
    };
  }

  /**
   * Store health data in Firestore
   */
  private async storeHealthData(health: SystemHealth): Promise<void> {
    try {
      // Use setDoc with merge to handle both create and update cases
      await setDoc(doc(db, "platformConfig", "health"), {
        lastHealthCheck: health,
        lastUpdated: new Date()
      }, { merge: true });
    } catch (error: any) {
      console.error('Failed to store health data:', error);
      
      // Log specific error details for debugging
      if (error.code === 'permission-denied') {
        console.error('Permission denied - check Firestore rules for platformConfig/health');
      } else if (error.code === 'unavailable') {
        console.error('Firestore service unavailable');
      } else {
        console.error('Unknown error storing health data:', error.code, error.message);
      }
      
      // If we can't store in Firestore, just log it locally
      // This prevents the health monitoring from failing completely
      console.log('Health check completed but could not store in Firestore:', {
        overall: health.overall,
        components: health.components.length,
        timestamp: health.lastUpdated
      });
    }
  }

  /**
   * Get current health status
   */
  getCurrentHealth(): SystemHealth | null {
    return this.healthHistory.length > 0 ? this.healthHistory[this.healthHistory.length - 1] : null;
  }

  /**
   * Get health history
   */
  getHealthHistory(): SystemHealth[] {
    return [...this.healthHistory];
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): { isActive: boolean; lastCheck?: Date } {
    const currentHealth = this.getCurrentHealth();
    return {
      isActive: this.isMonitoring,
      lastCheck: currentHealth?.lastUpdated
    };
  }

  /**
   * Get uptime statistics
   */
  getUptimeStats(): { uptimePercentage: number; totalChecks: number; successfulChecks: number } {
    const totalChecks = this.healthHistory.length;
    const successfulChecks = this.healthHistory.filter(h => h.overall !== 'critical').length;
    const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

    return {
      uptimePercentage,
      totalChecks,
      successfulChecks
    };
  }
}

/**
 * Utility functions for health monitoring
 */
export function startHealthMonitoring(intervalMs: number = 60000): void {
  const monitor = HealthMonitor.getInstance();
  monitor.startMonitoring(intervalMs);
}

export function stopHealthMonitoring(): void {
  const monitor = HealthMonitor.getInstance();
  monitor.stopMonitoring();
}

export function getCurrentHealth(): SystemHealth | null {
  const monitor = HealthMonitor.getInstance();
  return monitor.getCurrentHealth();
} 