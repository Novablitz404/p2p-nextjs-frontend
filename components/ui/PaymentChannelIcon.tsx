'use client';

import { CreditCard, Banknote, Smartphone, Building2, Truck, Globe, DollarSign, Euro, Coins } from 'lucide-react';

interface PaymentChannelIconProps {
    channel: string;
    size?: number;
    className?: string;
}

const PaymentChannelIcon = ({ channel, size = 20, className = '' }: PaymentChannelIconProps) => {
    const getIcon = (channelName: string) => {
        const lowerChannel = channelName.toLowerCase();
        
        // Digital wallets
        if (lowerChannel.includes('gcash') || lowerChannel.includes('paymaya') || lowerChannel.includes('promptpay')) {
            return <Smartphone size={size} />;
        }
        
        // Payment apps
        if (lowerChannel.includes('paypal') || lowerChannel.includes('venmo') || lowerChannel.includes('cash app') || lowerChannel.includes('revolut') || lowerChannel.includes('n26')) {
            return <CreditCard size={size} />;
        }
        
        // Bank transfers
        if (lowerChannel.includes('bank') || lowerChannel.includes('sepa')) {
            return <Building2 size={size} />;
        }
        
        // Money transfer services
        if (lowerChannel.includes('western union') || lowerChannel.includes('moneygram') || lowerChannel.includes('palawan')) {
            return <Globe size={size} />;
        }
        
        // Cash pickup
        if (lowerChannel.includes('cash pickup')) {
            return <Truck size={size} />;
        }
        
        // Currency-specific icons
        if (lowerChannel.includes('zelle')) {
            return <DollarSign size={size} />;
        }
        
        // Default fallback
        return <Coins size={size} />;
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            {getIcon(channel)}
        </div>
    );
};

export default PaymentChannelIcon; 