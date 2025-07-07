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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl w-full max-w-md m-4 transform transition-all duration-300 animate-fade-in-up hover:shadow-3xl">
                <div className="flex justify-between items-center p-6 border-b border-slate-700/40">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    {onClose && (
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700/50"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

export default Modal;