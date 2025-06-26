'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';

interface SellerSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: { markup: number; cancellationRate: string }) => void;
    initialMarkup: number;
    initialCancellationRate: string;
}

const SellerSettingsModal = ({
    isOpen,
    onClose,
    onSave,
    initialMarkup,
    initialCancellationRate,
}: SellerSettingsModalProps) => {
    const [markup, setMarkup] = useState(initialMarkup);
    const [cancellationRate, setCancellationRate] = useState(initialCancellationRate);

    const handleSave = () => {
        onSave({ markup, cancellationRate });
        onClose();
    };

    const handleMarkupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newMarkup = parseFloat(e.target.value);
        if (isNaN(newMarkup)) newMarkup = 0;
        if (newMarkup > 3) newMarkup = 3;
        if (newMarkup < 0) newMarkup = 0;
        setMarkup(newMarkup);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Seller Settings">
            <div className="space-y-6">
                {/* Markup Setting */}
                <div className="space-y-3">
                    <label htmlFor="markup" className="block text-sm font-medium text-white">
                        Your Markup (Max 3%)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={markup}
                            onChange={handleMarkupChange}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="relative">
                            <input
                                type="number"
                                value={markup}
                                onChange={handleMarkupChange}
                                className="hide-number-arrows w-24 bg-slate-800 text-white rounded-md p-1 pl-2 pr-6 text-right font-mono text-sm border border-slate-600"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                        </div>
                    </div>
                </div>

                {/* Cancellation Rate Setting */}
                <div>
                    <label htmlFor="min-cancellation-rate" className="block text-sm font-medium text-gray-300">
                        Max. Buyer Cancellation Rate (%)
                    </label>
                    <input
                        id="min-cancellation-rate"
                        type="number"
                        value={cancellationRate}
                        onChange={(e) => setCancellationRate(e.target.value)}
                        placeholder="e.g., 10"
                        className="w-full mt-2 bg-slate-900 rounded-md p-2 border border-slate-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Optional: Only match with buyers below this rate.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                    <button onClick={onClose} className="py-2 px-4 text-sm font-semibold rounded-lg bg-slate-700 hover:bg-slate-600">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="py-2 px-4 text-sm font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600">
                        Save Settings
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SellerSettingsModal;