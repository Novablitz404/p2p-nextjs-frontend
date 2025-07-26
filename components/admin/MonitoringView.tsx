'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { SyncMetrics, MismatchAlert } from '@/lib/monitoring';
import { startRemainingAmountMonitoring, stopRemainingAmountMonitoring, RemainingAmountMonitor } from '@/lib/monitoring';
import { Play, Pause, RefreshCw, AlertTriangle, CheckCircle, XCircle, Gem, Activity } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import MonitoringChart from './MonitoringChart';

interface MonitoringViewProps {}

const MonitoringView = ({}: MonitoringViewProps) => {
    const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
    const [alerts, setAlerts] = useState<MismatchAlert[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastScan, setLastScan] = useState<Date | null>(null);

    // Load initial data
    useEffect(() => {
        loadMonitoringData();
        const monitor = RemainingAmountMonitor.getInstance();
        setIsMonitoring(monitor.getMonitoringStatus().isActive);
    }, []);

    // Set up real-time listeners
    useEffect(() => {
        const unsubscribeMetrics = onSnapshot(
            doc(db, "platformConfig", "monitoring"),
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    if (data.lastSyncMetrics) {
                        setMetrics(data.lastSyncMetrics);
                        setLastScan(data.lastUpdated?.toDate() || new Date());
                    }
                }
                setIsLoading(false);
            },
            (error) => {
                console.error('Failed to listen to monitoring metrics:', error);
                setIsLoading(false);
            }
        );

        const unsubscribeAlerts = onSnapshot(
            query(collection(db, "alerts"), where("type", "==", "remainingAmount_mismatch")),
            (snapshot) => {
                const alertData = snapshot.docs.map(doc => ({
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate() || new Date()
                })) as MismatchAlert[];
                setAlerts(alertData);
            },
            (error) => {
                console.error('Failed to listen to alerts:', error);
                // Don't set loading to false here as metrics might still load
            }
        );

        return () => {
            unsubscribeMetrics();
            unsubscribeAlerts();
        };
    }, []);

    const loadMonitoringData = async () => {
        try {
            const metricsDoc = await getDoc(doc(db, "platformConfig", "monitoring"));
            if (metricsDoc.exists()) {
                const data = metricsDoc.data();
                if (data.lastSyncMetrics) {
                    setMetrics(data.lastSyncMetrics);
                    setLastScan(data.lastUpdated?.toDate() || new Date());
                }
            }

            try {
                const alertsSnapshot = await getDocs(
                    query(collection(db, "alerts"), where("type", "==", "remainingAmount_mismatch"))
                );
                const alertData = alertsSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate() || new Date()
                })) as MismatchAlert[];
                setAlerts(alertData);
            } catch (alertsError) {
                console.error('Failed to load alerts (this is normal if alerts collection is not set up):', alertsError);
                // Don't fail the entire load if alerts fail
            }
        } catch (error) {
            console.error('Failed to load monitoring data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartMonitoring = async () => {
        try {
            await startRemainingAmountMonitoring();
            setIsMonitoring(true);
        } catch (error) {
            console.error('Failed to start monitoring:', error);
        }
    };

    const handleStopMonitoring = () => {
        stopRemainingAmountMonitoring();
        setIsMonitoring(false);
    };

    const handleManualScan = async () => {
        setIsLoading(true);
        try {
            const monitor = RemainingAmountMonitor.getInstance();
            await monitor['performFullScan']();
            await loadMonitoringData();
        } catch (error) {
            console.error('Manual scan failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high': return <AlertTriangle className="h-4 w-4" />;
            case 'medium': return <AlertTriangle className="h-4 w-4" />;
            case 'low': return <CheckCircle className="h-4 w-4" />;
            default: return <XCircle className="h-4 w-4" />;
        }
    };

    const formatPercentage = (value: number, total: number) => {
        if (total === 0) return '0%';
        return `${((value / total) * 100).toFixed(1)}%`;
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">RemainingAmount Monitoring</h1>
                        <p className="text-gray-400 mt-1">
                            Monitor and manage blockchain-Firestore synchronization
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleManualScan}
                            disabled={true}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Manual Scan
                        </button>
                        <button
                            onClick={handleStartMonitoring}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                        >
                            <Play className="h-4 w-4" />
                            Start Monitoring
                        </button>
                    </div>
                </div>
                
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <Spinner text="Loading monitoring data..." />
                        <p className="text-gray-400 mt-4 text-sm">
                            Setting up monitoring dashboard...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <button
                        onClick={handleManualScan}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Manual Scan
                    </button>
                    {isMonitoring ? (
                        <button
                            onClick={handleStopMonitoring}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                        >
                            <Pause className="h-4 w-4" />
                            Stop Monitoring
                        </button>
                    ) : (
                        <button
                            onClick={handleStartMonitoring}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                        >
                            <Play className="h-4 w-4" />
                            Start Monitoring
                        </button>
                    )}
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Monitoring Status</p>
                            <p className={`text-lg font-semibold ${isMonitoring ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isMonitoring ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                        <div className={`p-2 rounded-full ${isMonitoring ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                            {isMonitoring ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Orders</p>
                            <p className="text-lg font-semibold text-white">
                                {metrics?.totalOrders || 0}
                            </p>
                        </div>
                        <div className="p-2 rounded-full bg-blue-500/20">
                            <Gem className="h-5 w-5 text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Sync Success Rate</p>
                            <p className="text-lg font-semibold text-white">
                                {metrics ? formatPercentage(metrics.syncedOrders, metrics.totalOrders) : '0%'}
                            </p>
                        </div>
                        <div className="p-2 rounded-full bg-emerald-500/20">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Active Alerts</p>
                            <p className="text-lg font-semibold text-white">
                                {alerts.filter(a => !a.resolved).length}
                            </p>
                        </div>
                        <div className="p-2 rounded-full bg-yellow-500/20">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* No Data State */}
            {!metrics && (
                <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">No Monitoring Data Available</h3>
                        <p className="text-gray-400 mb-6">
                            Start monitoring to track blockchain-Firestore synchronization and view metrics.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleStartMonitoring}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                            >
                                <Play className="h-4 w-4" />
                                Start Monitoring
                            </button>
                            <button
                                onClick={handleManualScan}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Run Manual Scan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics Details */}
            {metrics && (
                <div className="space-y-6">
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-4">Sync Metrics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <p className="text-gray-400 text-sm">Synced Orders</p>
                                <p className="text-2xl font-bold text-emerald-400">{metrics.syncedOrders}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Failed Orders</p>
                                <p className="text-2xl font-bold text-red-400">{metrics.failedOrders}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Total Mismatches</p>
                                <p className="text-2xl font-bold text-yellow-400">{metrics.totalMismatches}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Average Difference</p>
                                <p className="text-2xl font-bold text-white">{metrics.averageDifference.toFixed(6)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Last Scan</p>
                                <p className="text-lg font-semibold text-white">
                                    {lastScan ? lastScan.toLocaleString() : 'Never'}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Sync Efficiency</p>
                                <p className="text-lg font-semibold text-white">
                                    {metrics.totalOrders > 0 ? `${((metrics.syncedOrders / metrics.totalOrders) * 100).toFixed(1)}%` : '0%'}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Chart Visualization */}
                    <MonitoringChart metrics={metrics} />
                </div>
            )}

            {/* Alerts */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-4">Recent Alerts</h2>
                {alerts.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No alerts found</p>
                ) : (
                    <div className="space-y-3">
                        {alerts
                            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                            .slice(0, 10)
                            .map((alert, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                                            {getSeverityIcon(alert.severity)}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                Order {alert.orderId} (Chain: {alert.onChainId})
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                Difference: {alert.difference.toFixed(6)} | 
                                                Firestore: {alert.firestoreAmount.toFixed(6)} | 
                                                Blockchain: {alert.blockchainAmount.toFixed(6)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                                            {alert.severity.toUpperCase()}
                                        </span>
                                        <p className="text-gray-400 text-xs mt-1">
                                            {alert.timestamp.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Configuration */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-4">Monitoring Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-gray-400 text-sm">Scan Interval</p>
                        <p className="text-white font-medium">5 minutes</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Tolerance Threshold</p>
                        <p className="text-white font-medium">0.000001</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Alert Thresholds</p>
                        <p className="text-white font-medium">Low: 0.1% | Medium: 1% | High: 10%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonitoringView; 