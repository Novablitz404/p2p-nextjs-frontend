'use client';

import Skeleton from './Skeleton';

const TradeHistoryCardSkeleton = () => {
    return (
        <div className="relative bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    {/* Avatar skeleton */}
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                {/* Status pill skeleton */}
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="pt-3 mt-3 border-t border-slate-700/40 flex items-center justify-center gap-4">
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-8 w-36 rounded-full" />
            </div>
        </div>
    );
};

export default TradeHistoryCardSkeleton; 