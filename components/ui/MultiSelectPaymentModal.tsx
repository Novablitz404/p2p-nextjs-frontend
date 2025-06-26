'use client';

import Modal from './Modal';
import { CheckCircle, Circle } from 'lucide-react';

interface PaymentMethod {
    id: string;
    channel: string;
}

interface MultiSelectPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    myPaymentMethods: PaymentMethod[];
    selectedIds: string[];
    onSelectionChange: (id: string) => void;
}

const MultiSelectPaymentModal = ({ isOpen, onClose, myPaymentMethods, selectedIds, onSelectionChange }: MultiSelectPaymentModalProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Select Payment Methods">
            <div className="flex flex-col space-y-2 max-h-[60vh] overflow-y-auto -mr-2 pr-2">
                {myPaymentMethods.map(method => {
                    const isSelected = selectedIds.includes(method.id);
                    return (
                        <button 
                            key={method.id}
                            onClick={() => onSelectionChange(method.id)}
                            className={`w-full flex items-center p-3 rounded-lg transition-colors text-left border-2 ${
                                isSelected 
                                ? 'bg-emerald-500/10 border-emerald-500' 
                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                            }`}
                        >
                            {isSelected ? 
                                <CheckCircle className="h-5 w-5 mr-3 text-emerald-400"/> :
                                <Circle className="h-5 w-5 mr-3 text-slate-500"/>
                            }
                            <span className="font-semibold text-white">{method.channel}</span>
                        </button>
                    );
                })}
                 <div className="!mt-6 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold text-white">
                        Done
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default MultiSelectPaymentModal;