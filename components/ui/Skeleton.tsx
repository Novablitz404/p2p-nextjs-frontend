'use client';

import { ReactNode } from 'react';

interface SkeletonProps {
    className?: string;
    children?: ReactNode;
}

const Skeleton = ({ className = '', children }: SkeletonProps) => {
    return (
        <div className={`animate-pulse bg-slate-700/40 rounded ${className}`}>
            {children}
        </div>
    );
};

export default Skeleton; 