'use client';

import Skeleton from './Skeleton';

const TradeCardSkeleton = () => {
    return (
        <div className="relative bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    {/* Avatar skeleton */}
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
                {/* Status pill skeleton */}
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="text-sm border-t border-slate-700/40 pt-3 mt-2 space-y-2">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </div>

            <div className="!mt-4 pt-3 border-t border-slate-700/40 flex flex-col sm:flex-row gap-2">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
            </div>
        </div>
    );
};

export default TradeCardSkeleton; 