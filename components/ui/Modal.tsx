'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose?: () => void;
    title: string;
    children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md m-4 transform transition-all duration-300 animate-fade-in-up">
                <div className="flex justify-between items-center p-5 border-b border-slate-700">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    {onClose && <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>}
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export default Modal;