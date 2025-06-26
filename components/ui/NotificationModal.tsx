'use client';

import Modal from './Modal';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    action?: {
        text: string;
        onClick: () => void;
    };
}

const NotificationModal = ({ isOpen, onClose, title, message, action }: NotificationModalProps) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <p className="text-gray-300 whitespace-pre-wrap">{message}</p>
        
        {/* --- THIS IS THE FIX: A more flexible button layout --- */}
        <div className="mt-6 flex justify-end space-x-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-slate-600 hover:bg-slate-500 transition-colors font-semibold text-white">
                {action ? 'Close' : 'OK'}
            </button>
            {action && (
                <button 
                    onClick={action.onClick} 
                    className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 transition-colors font-semibold text-white"
                >
                    {action.text}
                </button>
            )}
        </div>
    </Modal>
);

export default NotificationModal;