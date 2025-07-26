'use client';

import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose?: () => void;
    title: string;
    children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
        <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex justify-center items-center p-4 animate-fade-in"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(8px)',
            }}
        >
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl w-full max-w-md m-4 transform transition-all duration-300 animate-fade-in-up hover:shadow-3xl">
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

    // Use portal to render modal outside normal DOM hierarchy
    return createPortal(modalContent, document.body);
};

export default Modal;