import { NextRequest, NextResponse } from 'next/server';
import { startRemainingAmountMonitoring, stopRemainingAmountMonitoring, RemainingAmountMonitor } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();
        
        switch (action) {
            case 'start':
                await startRemainingAmountMonitoring();
                return NextResponse.json({ success: true, message: 'Monitoring started' });
                
            case 'stop':
                stopRemainingAmountMonitoring();
                return NextResponse.json({ success: true, message: 'Monitoring stopped' });
                
            case 'scan':
                const monitorScan = RemainingAmountMonitor.getInstance();
                await monitorScan['performFullScan']();
                return NextResponse.json({ success: true, message: 'Manual scan completed' });
                
            case 'status':
                const monitorStatus = RemainingAmountMonitor.getInstance();
                const status = monitorStatus.getMonitoringStatus();
                return NextResponse.json({ 
                    success: true, 
                    isActive: status.isActive,
                    lastScan: status.lastScan
                });
                
            default:
                return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Monitoring API error:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || 'Internal server error' 
        }, { status: 500 });
    }
}

export async function GET() {
    try {
        const monitor = RemainingAmountMonitor.getInstance();
        const status = monitor.getMonitoringStatus();
        
        return NextResponse.json({
            success: true,
            isActive: status.isActive,
            lastScan: status.lastScan
        });
    } catch (error: any) {
        console.error('Monitoring status error:', error);
        return NextResponse.json({ 
            success: false, 
            message: error.message || 'Internal server error' 
        }, { status: 500 });
    }
} 