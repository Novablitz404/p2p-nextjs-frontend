// p2p-nextjs-frontend/components/ui/NotAuthorizedMessage.tsx

'use client';

import { ShieldAlert } from 'lucide-react';

const NotAuthorizedMessage = () => {
    return (
        <div className="text-center py-20 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col items-center justify-center">
             <ShieldAlert size={48} className="text-red-400 mb-4" />
             <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
             <p className="text-gray-400">You do not have the necessary permissions to view this page.</p>
        </div>
    );
};

export default NotAuthorizedMessage;