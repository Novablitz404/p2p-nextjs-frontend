'use client';

import { useState, useEffect } from 'react';
import Spinner from '../ui/Spinner';
import { CURRENCY_PAYMENT_METHODS } from '@/constants';

interface AddPaymentMethodFormProps {
    onAdd: (methodData: any) => Promise<void>;
}

const AddPaymentMethodForm = ({ onAdd }: AddPaymentMethodFormProps) => {
    const [channel, setChannel] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('PHP');

    // Get available channels for the selected currency from the mapping
    const availableChannels = CURRENCY_PAYMENT_METHODS[selectedCurrency] || [];

    useEffect(() => {
        if (availableChannels.length > 0 && !channel) {
            setChannel(availableChannels[0]);
        }
    }, [availableChannels, channel]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel || !accountName || !accountNumber) {
            alert('Please fill out all fields.');
            return;
        }
        setIsSubmitting(true);
        await onAdd({ channel, accountName, accountNumber });
        setIsSubmitting(false);
        setAccountName('');
        setAccountNumber('');
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-800 rounded-lg border border-slate-700 space-y-4">
            <h3 className="text-lg font-semibold text-white">Add New Payment Method</h3>
            
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Currency</label>
                <select 
                    value={selectedCurrency} 
                    onChange={e => {
                        setSelectedCurrency(e.target.value);
                        setChannel(''); // Reset channel when currency changes
                    }} 
                    className="w-full bg-slate-900 rounded-md p-2 border border-slate-600"
                >
                    {Object.keys(CURRENCY_PAYMENT_METHODS).map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Channel</label>
                <select 
                    value={channel} 
                    onChange={e => setChannel(e.target.value)} 
                    className="w-full bg-slate-900 rounded-md p-2 border border-slate-600"
                    disabled={availableChannels.length === 0}
                >
                    {availableChannels.length > 0 ? (
                        availableChannels.map(ch => <option key={ch} value={ch}>{ch}</option>)
                    ) : (
                        <option value="">No payment methods available for {selectedCurrency}</option>
                    )}
                </select>
                {availableChannels.length === 0 && (
                    <p className="text-xs text-yellow-400 mt-1">
                        Available for {selectedCurrency}: {CURRENCY_PAYMENT_METHODS[selectedCurrency]?.join(', ') || 'None'}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Name</label>
                <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Juan Dela Cruz" className="w-full bg-slate-900 rounded-md p-2 border border-slate-600" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account / Mobile Number</label>
                <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="09171234567" className="w-full bg-slate-900 rounded-md p-2 border border-slate-600" />
            </div>

            <button type="submit" disabled={isSubmitting || availableChannels.length === 0} className="w-full font-semibold py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50">
                {isSubmitting ? <Spinner /> : "Add Method"}
            </button>
        </form>
    );
};

export default AddPaymentMethodForm;