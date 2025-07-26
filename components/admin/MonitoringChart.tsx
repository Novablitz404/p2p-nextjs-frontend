'use client';

import { useEffect, useRef } from 'react';
import { SyncMetrics } from '@/lib/monitoring';

interface MonitoringChartProps {
    metrics: SyncMetrics;
    className?: string;
}

const MonitoringChart = ({ metrics, className = '' }: MonitoringChartProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !metrics) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = 200;

        // Calculate percentages
        const total = metrics.totalOrders;
        const synced = metrics.syncedOrders;
        const failed = metrics.failedOrders;
        const mismatches = metrics.totalMismatches;

        const syncedPercent = total > 0 ? (synced / total) * 100 : 0;
        const failedPercent = total > 0 ? (failed / total) * 100 : 0;
        const mismatchPercent = total > 0 ? (mismatches / total) * 100 : 0;

        // Colors
        const colors = {
            synced: '#10b981', // emerald-500
            failed: '#ef4444', // red-500
            mismatch: '#f59e0b', // amber-500
        };

        // Draw pie chart
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        let currentAngle = 0;

        // Draw synced orders
        if (syncedPercent > 0) {
            const angle = (syncedPercent / 100) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
            ctx.closePath();
            ctx.fillStyle = colors.synced;
            ctx.fill();
            currentAngle += angle;
        }

        // Draw failed orders
        if (failedPercent > 0) {
            const angle = (failedPercent / 100) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
            ctx.closePath();
            ctx.fillStyle = colors.failed;
            ctx.fill();
            currentAngle += angle;
        }

        // Draw mismatches
        if (mismatchPercent > 0) {
            const angle = (mismatchPercent / 100) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
            ctx.closePath();
            ctx.fillStyle = colors.mismatch;
            ctx.fill();
        }

        // Draw legend
        const legendY = 20;
        const legendSpacing = 25;

        // Synced legend
        ctx.fillStyle = colors.synced;
        ctx.fillRect(10, legendY, 15, 15);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`Synced: ${synced} (${syncedPercent.toFixed(1)}%)`, 30, legendY + 12);

        // Failed legend
        ctx.fillStyle = colors.failed;
        ctx.fillRect(10, legendY + legendSpacing, 15, 15);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`Failed: ${failed} (${failedPercent.toFixed(1)}%)`, 30, legendY + legendSpacing + 12);

        // Mismatch legend
        ctx.fillStyle = colors.mismatch;
        ctx.fillRect(10, legendY + legendSpacing * 2, 15, 15);
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(`Mismatches: ${mismatches} (${mismatchPercent.toFixed(1)}%)`, 30, legendY + legendSpacing * 2 + 12);

        // Center text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${total}`, centerX, centerY - 5);
        ctx.font = '12px Arial';
        ctx.fillText('Total Orders', centerX, centerY + 10);

    }, [metrics]);

    return (
        <div className={`bg-slate-800 rounded-lg p-4 border border-slate-700 ${className}`}>
            <h3 className="text-lg font-semibold text-white mb-4">Sync Distribution</h3>
            <canvas
                ref={canvasRef}
                className="w-full h-48"
                style={{ maxHeight: '200px' }}
            />
        </div>
    );
};

export default MonitoringChart; 