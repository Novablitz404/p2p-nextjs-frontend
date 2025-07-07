'use client';

import Skeleton from './Skeleton';

const BuyerTradeCardSkeleton = () => {
    return (
        <div className="bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-36" />
            </div>
        </div>
    );
};

export default BuyerTradeCardSkeleton; 