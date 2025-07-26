'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { SystemHealth, HealthStatus, HealthMonitor, startHealthMonitoring, stopHealthMonitoring } from '@/lib/healthMonitor';
import { 
  Play, Pause, RefreshCw, AlertTriangle, CheckCircle, XCircle, 
  Activity, Database, Globe, Zap, HardDrive, Wifi, Cpu, Server,
  TrendingUp, Clock, BarChart3, ExternalLink
} from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

interface HealthDashboardProps {}

const HealthDashboard = ({}: HealthDashboardProps) => {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [uptimeStats, setUptimeStats] = useState({ uptimePercentage: 0, totalChecks: 0, successfulChecks: 0 });

    // Load initial data
    useEffect(() => {
        loadHealthData();
        const monitor = HealthMonitor.getInstance();
        setIsMonitoring(monitor.getMonitoringStatus().isActive);
        setUptimeStats(monitor.getUptimeStats());
    }, []);

    // Set up real-time listeners
    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, "platformConfig", "health"),
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    if (data.lastHealthCheck) {
                        setHealth(data.lastHealthCheck);
                    }
                }
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const loadHealthData = async () => {
        try {
            const healthDoc = await getDoc(doc(db, "platformConfig", "health"));
            if (healthDoc.exists()) {
                const data = healthDoc.data();
                if (data.lastHealthCheck) {
                    setHealth(data.lastHealthCheck);
                }
            }
        } catch (error) {
            console.error('Failed to load health data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartMonitoring = async () => {
        try {
            await startHealthMonitoring();
            setIsMonitoring(true);
        } catch (error) {
            console.error('Failed to start monitoring:', error);
        }
    };

    const handleStopMonitoring = () => {
        stopHealthMonitoring();
        setIsMonitoring(false);
    };

    const handleManualCheck = async () => {
        setIsLoading(true);
        try {
            const monitor = HealthMonitor.getInstance();
            await monitor['performHealthCheck']();
            await loadHealthData();
            setUptimeStats(monitor.getUptimeStats());
        } catch (error) {
            console.error('Manual health check failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="h-4 w-4" />;
            case 'warning': return <AlertTriangle className="h-4 w-4" />;
            case 'critical': return <XCircle className="h-4 w-4" />;
            default: return <XCircle className="h-4 w-4" />;
        }
    };

    const getComponentIcon = (component: string) => {
        switch (component.toLowerCase()) {
            case 'website': return <Globe className="h-4 w-4" />;
            case 'database': return <Database className="h-4 w-4" />;
            case 'blockchain': return <Server className="h-4 w-4" />;
            case 'smart contract': return <Zap className="h-4 w-4" />;
            case 'api': return <Activity className="h-4 w-4" />;
            case 'storage': return <HardDrive className="h-4 w-4" />;
            case 'network': return <Wifi className="h-4 w-4" />;
            case 'performance': return <Cpu className="h-4 w-4" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    const formatResponseTime = (time?: number) => {
        if (!time) return 'N/A';
        return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
    };

    const truncateAddress = (address: string) => {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const formatDetailValue = (key: string, value: any) => {
        if (typeof value === 'string' && value.startsWith('0x')) {
            return truncateAddress(value);
        }
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (typeof value === 'number' && key.includes('Time')) {
            return formatResponseTime(value);
        }
        return String(value);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner text="Loading health data..." />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Controls */}
            <div className="flex justify-between items-center">
                <div className="flex gap-3">
                    <button
                        onClick={handleManualCheck}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Manual Check
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

            {/* Overall Status Cards */}
            {health && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Overall Status</p>
                                <p className={`text-xl font-bold mt-1 ${health.overall === 'healthy' ? 'text-emerald-400' : health.overall === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {health.overall.toUpperCase()}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full ${health.overall === 'healthy' ? 'bg-emerald-500/20' : health.overall === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                                {health.overall === 'healthy' ? <CheckCircle className="h-6 w-6 text-emerald-400" /> : 
                                 health.overall === 'warning' ? <AlertTriangle className="h-6 w-6 text-yellow-400" /> : 
                                 <XCircle className="h-6 w-6 text-red-400" />}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Uptime</p>
                                <p className="text-xl font-bold text-white mt-1">
                                    {uptimeStats.uptimePercentage.toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-500/20">
                                <TrendingUp className="h-6 w-6 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Avg Response</p>
                                <p className="text-xl font-bold text-white mt-1">
                                    {health.performance.averageResponseTime ? formatResponseTime(health.performance.averageResponseTime) : 'N/A'}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-purple-500/20">
                                <BarChart3 className="h-6 w-6 text-purple-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600/50 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm font-medium">Last Check</p>
                                <p className="text-xl font-bold text-white mt-1">
                                    {health.lastUpdated ? new Date(health.lastUpdated).toLocaleTimeString() : 'Never'}
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-orange-500/20">
                                <Clock className="h-6 w-6 text-orange-400" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Component Health */}
            {health && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-full bg-blue-500/20">
                            <Activity className="h-5 w-5 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Component Health</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {health.components.map((component, index) => (
                            <div key={index} className="bg-slate-700/50 rounded-xl p-6 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-slate-600/50">
                                            {getComponentIcon(component.component)}
                                        </div>
                                        <span className="font-semibold text-white text-lg">{component.component}</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(component.status)}`}>
                                        {component.status.toUpperCase()}
                                    </span>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-600/30">
                                        <span className="text-gray-400 font-medium">Response Time</span>
                                        <span className="text-white font-semibold">{formatResponseTime(component.responseTime)}</span>
                                    </div>
                                    
                                    {component.error && (
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <XCircle className="h-4 w-4 text-red-400" />
                                                <span className="text-red-400 font-medium text-sm">Error</span>
                                            </div>
                                            <p className="text-red-300 text-xs">{component.error}</p>
                                        </div>
                                    )}
                                    
                                    {component.details && Object.keys(component.details).length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-gray-400 text-sm font-medium mb-2">Details</p>
                                            <div className="space-y-2">
                                                {Object.entries(component.details).map(([key, value]) => (
                                                    <div key={key} className="flex justify-between items-center py-1">
                                                        <span className="text-gray-400 text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                                        <span className="text-white text-sm font-medium">{formatDetailValue(key, value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Performance Metrics */}
            {health && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-full bg-purple-500/20">
                            <BarChart3 className="h-5 w-5 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Performance Metrics</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/30">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-full bg-emerald-500/20">
                                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                                </div>
                                <span className="text-gray-400 font-medium">Fastest Component</span>
                            </div>
                            <p className="text-xl font-bold text-emerald-400">{health.performance.fastestComponent}</p>
                        </div>
                        
                        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/30">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-full bg-red-500/20">
                                    <AlertTriangle className="h-4 w-4 text-red-400" />
                                </div>
                                <span className="text-gray-400 font-medium">Slowest Component</span>
                            </div>
                            <p className="text-xl font-bold text-red-400">{health.performance.slowestComponent}</p>
                        </div>
                        
                        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/30">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-full bg-blue-500/20">
                                    <Activity className="h-4 w-4 text-blue-400" />
                                </div>
                                <span className="text-gray-400 font-medium">Total Checks</span>
                            </div>
                            <p className="text-xl font-bold text-white">{uptimeStats.totalChecks}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Monitoring Status */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 border border-slate-600/50 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-full bg-orange-500/20">
                        <Clock className="h-5 w-5 text-orange-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Monitoring Status</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-full ${isMonitoring ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                {isMonitoring ? <Play className="h-4 w-4 text-emerald-400" /> : <Pause className="h-4 w-4 text-red-400" />}
                            </div>
                            <span className="text-gray-400 font-medium">Monitoring Status</span>
                        </div>
                        <p className={`text-xl font-bold ${isMonitoring ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isMonitoring ? 'Active' : 'Inactive'}
                        </p>
                    </div>
                    
                    <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600/30">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-full bg-green-500/20">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                            </div>
                            <span className="text-gray-400 font-medium">Successful Checks</span>
                        </div>
                        <p className="text-xl font-bold text-white">{uptimeStats.successfulChecks}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthDashboard; 