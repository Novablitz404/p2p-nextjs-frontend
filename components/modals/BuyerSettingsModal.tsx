'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';

interface BuyerSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (markup: string) => void;
    initialMarkup: string;
}

const BuyerSettingsModal = ({
    isOpen,
    onClose,
    onSave,
    initialMarkup,
}: BuyerSettingsModalProps) => {
    const [markup, setMarkup] = useState(initialMarkup);

    const handleSave = () => {
        onSave(markup);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Buyer Matching Settings">
            <div className="space-y-6">
                <div>
                    <label htmlFor="max-markup" className="block text-sm font-medium text-gray-300">
                        Max. Seller Markup (%)
                    </label>
                    <div className="relative mt-2">
                        <input
                            id="max-markup"
                            type="number"
                            value={markup}
                            onChange={(e) => setMarkup(e.target.value)}
                            placeholder="e.g., 2 for 2%"
                            className="w-full bg-slate-900 text-white rounded-lg p-3 text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition border border-slate-700 pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Optional: Only find sellers with a markup at or below this rate.
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

export default BuyerSettingsModal;