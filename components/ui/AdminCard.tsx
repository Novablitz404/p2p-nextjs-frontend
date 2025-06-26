import { ReactNode } from 'react';

interface AdminCardProps {
    title: string;
    children: ReactNode;
    className?: string;
    headerAction?: ReactNode; // <-- 1. Add new optional prop
}

const AdminCard = ({ title, children, className = '', headerAction }: AdminCardProps) => {
    return (
        <div className={`bg-slate-800 rounded-2xl border border-slate-700/50 flex flex-col ${className}`}>
            {/* 2. Update the header to be a flex container */}
            <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
                <h3 className="text-xl font-semibold text-white">
                    {title}
                </h3>
                {/* 3. Render the action button if it exists */}
                {headerAction}
            </div>
            <div className="p-6 flex-grow">
                {children}
            </div>
        </div>
    );
};

export default AdminCard;