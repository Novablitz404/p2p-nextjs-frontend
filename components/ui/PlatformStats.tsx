'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Shield, Zap, BarChart3, Coins, Activity } from 'lucide-react';

interface PlatformStats {
  allTimeVolume: number;
  assetsOnPlatform: number;
  volume24h: number;
}

const PlatformStats = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/getPlatformStats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch platform stats:', response.statusText);
          // Set default values if API fails
          setStats({
            allTimeVolume: 0,
            assetsOnPlatform: 0,
            volume24h: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
        // Set default values if API fails
        setStats({
          allTimeVolume: 0,
          assetsOnPlatform: 0,
          volume24h: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Platform Statistics</h2>
          <p className="text-gray-400">Real-time metrics from our decentralized P2P exchange</p>
        </div>
        
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded mb-2"></div>
              <div className="h-8 bg-slate-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '$0';
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const statItems = [
    {
      title: 'All-Time Volume',
      value: formatCurrency(stats?.allTimeVolume),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      icon: BarChart3
    },
    {
      title: 'Assets on Platform',
      value: formatCurrency(stats?.assetsOnPlatform),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      icon: Coins
    },
    {
      title: '24h Volume',
      value: formatCurrency(stats?.volume24h),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      icon: Activity
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
      {statItems.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <div
            key={index}
            className={`group bg-slate-800/30 border border-slate-700/30 rounded-xl p-6 text-center transition-all duration-300 hover:bg-slate-800/50 hover:border-${item.color.split('-')[1]}-500/30 backdrop-blur-sm hover:scale-105`}
          >
            <div className="flex items-center justify-center mb-3">
              <IconComponent className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              {item.value}
            </div>
            <div className="text-lg text-gray-400 font-medium">
              {item.title}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlatformStats; 