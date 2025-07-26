'use client';

import { useState, useEffect, useRef } from 'react';
import Tooltip from '../ui/Tooltip';
import { Info } from 'lucide-react';

interface SellerSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: { markup: number; cancellationRate: string }) => void;
    initialMarkup: number;
    initialCancellationRate: string;
    toggleButtonRef?: React.RefObject<HTMLButtonElement>;
}

const DEFAULT_MARKUP = 1.5;

const SellerSettingsModal = ({
    isOpen,
    onClose,
    onSave,
    initialMarkup,
    initialCancellationRate,
    toggleButtonRef,
}: SellerSettingsModalProps) => {
    const [markup, setMarkup] = useState(initialMarkup.toString());
    const [cancellationRate, setCancellationRate] = useState(initialCancellationRate || '100');
    // --- THIS IS A CHANGE (Part 1) ---
    // Add state to handle the visual feedback for the error
    const [showMarkupError, setShowMarkupError] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (isOpen) {
            setMarkup(initialMarkup.toString());
            setCancellationRate(initialCancellationRate || '100');
        }
    }, [isOpen, initialMarkup, initialCancellationRate]);

    const handleSave = () => {
        const markupValue = parseFloat(markup) || DEFAULT_MARKUP;
        onSave({ markup: markupValue, cancellationRate });
        onClose();
    };

    // --- THIS IS A CHANGE (Part 2) ---
    // Updated handler to manage the error state and allow empty values
    const handleMarkupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        // Allow empty value
        if (value === '') {
            setMarkup('');
            return;
        }

        const newMarkup = parseFloat(value);

        if (isNaN(newMarkup)) {
            return; // Don't update if it's not a valid number
        }

        if (newMarkup > 3) {
            // Set the value to 3, but trigger the error flash
            setMarkup('3');
            setShowMarkupError(true);
            setTimeout(() => setShowMarkupError(false), 500); // Hide the error flash after 0.5s
        } else {
            setMarkup(newMarkup < 0 ? '0' : value);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={popoverRef}
            className="absolute right-0 top-full mt-2 w-80 bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl z-10 p-5 animate-fade-in-up"
        >
            <div className="flex justify-between items-center mb-5">
                 <h3 className="text-base font-bold text-white">Seller Settings</h3>
            </div>
           
            <div className="space-y-5">
                {/* Max Markup Setting */}
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                        <span>Max markup</span>
                        <Tooltip text="The percentage above market rate (max 3%).">
                            <Info className="h-4 w-4 text-gray-500 cursor-help hover:text-gray-400 transition-colors" />
                        </Tooltip>
                    </div>
                    <div className={`flex items-center gap-2 bg-slate-700/60 rounded-full p-1.5 border border-slate-600/40 transition-colors ${showMarkupError ? 'bg-red-500/30 border-red-400/50' : ''}`}>
                        <button
                            type="button"
                            onClick={() => setMarkup(DEFAULT_MARKUP.toString())}
                            className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${markup === DEFAULT_MARKUP.toString() ? 'bg-slate-600 text-white' : 'text-gray-300 hover:text-white'}`}
                        >
                            Auto
                        </button>
                        <div className="relative">
                            <input
                                type="number"
                                value={markup}
                                onChange={handleMarkupChange}
                                className="hide-number-arrows w-20 bg-transparent text-white text-right font-mono focus:outline-none pr-7"
                                step="0.1"
                                placeholder="1.5"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">%</span>
                        </div>
                    </div>
                </div>

                {/* Cancellation Rate Setting */}
                <div className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2 text-gray-300">
                        <span>Cancellation Rate</span>
                         <Tooltip text="Automatically decline trades from buyers with a cancellation rate higher than this percentage.">
                            <Info className="h-4 w-4 text-gray-500 cursor-help hover:text-gray-400 transition-colors" />
                        </Tooltip>
                    </div>
                     <div className="relative bg-slate-700/60 rounded-full p-1.5 border border-slate-600/40">
                         <input
                            type="number"
                            value={cancellationRate}
                            onChange={(e) => setCancellationRate(Math.min(Number(e.target.value), 100).toString())}
                            placeholder="100"
                            className="hide-number-arrows w-24 bg-transparent text-white text-center font-mono focus:outline-none px-2 pr-7"
                            min="0"
                            max="100"
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

export default SellerSettingsModal;