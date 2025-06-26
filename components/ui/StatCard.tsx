import { ReactNode } from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative';
    valueClassName?: string;
}

const StatCard = ({ title, value, icon, change, changeType, valueClassName }: StatCardProps) => {
    const changeColor = changeType === 'positive' ? 'text-emerald-400' : 'text-red-400';

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700/50 flex flex-col justify-between">
            <div className="flex justify-between items-center text-gray-400">
                <span className="text-sm font-medium">{title}</span>
                {icon}
            </div>
            <div>
                {/* --- THIS IS THE CHANGE --- */}
                {/* We are changing the default font size from text-4xl to text-3xl */}
                <p className={`block break-all font-bold text-white mt-2 ${valueClassName || 'text-3xl'}`}>
                    {value}
                </p>
                {change && (
                    <p className={`text-xs mt-1 ${changeColor}`}>
                        {change}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatCard;