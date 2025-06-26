'use client';

import { useState, useEffect } from 'react';
import Spinner from '../ui/Spinner';

interface AddPaymentMethodFormProps {
    approvedChannels: string[];
    onAdd: (methodData: any) => Promise<void>;
}

const AddPaymentMethodForm = ({ approvedChannels, onAdd }: AddPaymentMethodFormProps) => {
    const [channel, setChannel] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (approvedChannels.length > 0 && !channel) {
            setChannel(approvedChannels[0]);
        }
    }, [approvedChannels, channel]);

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
                <label className="block text-sm font-medium text-gray-300 mb-1">Payment Channel</label>
                <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full bg-slate-900 rounded-md p-2 border border-slate-600">
                    {approvedChannels.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account Name</label>
                <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Juan Dela Cruz" className="w-full bg-slate-900 rounded-md p-2 border border-slate-600" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Account / Mobile Number</label>
                <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="09171234567" className="w-full bg-slate-900 rounded-md p-2 border border-slate-600" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full font-semibold py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50">
                {isSubmitting ? <Spinner /> : "Add Method"}
            </button>
        </form>
    );
};

export default AddPaymentMethodForm;