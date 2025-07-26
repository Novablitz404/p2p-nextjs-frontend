'use client';

import { useState, useEffect, useRef } from 'react';
import Tooltip from '../ui/Tooltip';
import { Info } from 'lucide-react';

interface BuyerSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (markup: string) => void;
    initialMarkup: string;
    toggleButtonRef?: React.RefObject<HTMLButtonElement>;
}

const BuyerSettingsModal = ({
    isOpen,
    onClose,
    onSave,
    initialMarkup,
    toggleButtonRef,
}: BuyerSettingsModalProps) => {
    const [markup, setMarkup] = useState(initialMarkup);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Click outside to close logic
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toggleButtonRef?.current && toggleButtonRef.current.contains(event.target as Node)) {
                return;
            }
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, toggleButtonRef]);

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMarkup(initialMarkup);
        }
    }, [isOpen, initialMarkup]);

    const handleSave = () => {
        onSave(markup);
        onClose();
    };

    if (!isOpen) return null;

    // Render the modal as a popover positioned absolutely relative to the gear icon
    return (
        <div
            ref={popoverRef}
            className="absolute right-0 top-full mt-2 w-80 bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl z-[60] p-5 animate-fade-in-up"
        >
            <div className="flex justify-between items-center mb-5">
                 <h3 className="text-base font-bold text-white">Buyer Settings</h3>
            </div>
            <div className="space-y-5">
                {/* Max Markup Setting */}
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                        <span>Max. Seller Markup</span>
                        <Tooltip text="Only find sellers with a markup at or below this rate. Leave blank to see all offers.">
                            <Info className="h-4 w-4 text-gray-500 cursor-help hover:text-gray-400 transition-colors" />
                        </Tooltip>
                    </div>
                    <div className="relative bg-slate-700/60 rounded-full p-1.5 border border-slate-600/40">
                        <input
                           type="number"
                           value={markup}
                           onChange={(e) => setMarkup(e.target.value)}
                           placeholder="Any"
                           className="hide-number-arrows w-24 bg-transparent text-white text-center font-mono focus:outline-none px-2 pr-7"
                           min="0"
                       />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span>
                   </div>
                </div>
                {/* Action Button */}
                <div className="flex justify-end pt-3">
                     <button 
                         onClick={handleSave} 
                         className="w-full py-2.5 px-4 text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
                     >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BuyerSettingsModal;