'use client';

import { useState, useEffect } from 'react';
import Spinner from '../ui/Spinner';
import PaymentChannelIcon from '../ui/PaymentChannelIcon';
import CustomDropdown from '../ui/CustomDropdown';
import { CURRENCY_PAYMENT_METHODS } from '@/constants';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AddPaymentMethodFormProps {
    onAdd: (methodData: any) => Promise<void>;
}

const AddPaymentMethodForm = ({ onAdd }: AddPaymentMethodFormProps) => {
    const [channel, setChannel] = useState('');
    const [accountName, setAccountName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState('PHP');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

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
            setFeedback({ type: 'error', message: 'Please fill out all fields.' });
            return;
        }
        
        setIsSubmitting(true);
        setFeedback({ type: null, message: '' });
        
        try {
            await onAdd({ channel, accountName, accountNumber });
            setFeedback({ type: 'success', message: 'Payment method added successfully!' });
            setAccountName('');
            setAccountNumber('');
        } catch (error) {
            setFeedback({ type: 'error', message: 'Failed to add payment method. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = channel && accountName.trim() && accountNumber.trim();

    // Create currency options for dropdown
    const currencyOptions = Object.keys(CURRENCY_PAYMENT_METHODS).map(currency => ({
        value: currency,
        label: currency,
        icon: <span className="text-lg font-bold">{currency}</span>
    }));

    // Create channel options for dropdown
    const channelOptions = availableChannels.map(ch => ({
        value: ch,
        label: ch,
        icon: <PaymentChannelIcon channel={ch} size={16} />
    }));

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-white">Add New Payment Method</h3>
            
            {/* Feedback Message */}
            {feedback.type && (
                <div className={`flex items-center gap-2 p-3 rounded-xl ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                    {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span className="text-sm font-medium">{feedback.message}</span>
                </div>
            )}
            
            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Currency</label>
                <CustomDropdown
                    options={currencyOptions}
                    value={selectedCurrency}
                    onChange={(value) => {
                        setSelectedCurrency(value);
                        setChannel(''); // Reset channel when currency changes
                    }}
                    placeholder="Select currency"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Payment Channel</label>
                <CustomDropdown
                    options={channelOptions}
                    value={channel}
                    onChange={setChannel}
                    placeholder="Select payment channel"
                    disabled={availableChannels.length === 0}
                />
                {availableChannels.length === 0 && (
                    <p className="text-xs text-yellow-400 mt-2">
                        Available for {selectedCurrency}: {CURRENCY_PAYMENT_METHODS[selectedCurrency]?.join(', ') || 'None'}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Account Name</label>
                <input 
                    type="text" 
                    value={accountName} 
                    onChange={e => setAccountName(e.target.value)} 
                    placeholder="Juan Dela Cruz" 
                    className="w-full bg-slate-700/60 border border-slate-600/40 rounded-xl p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition-all duration-200" 
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Account / Mobile Number</label>
                <input 
                    type="text" 
                    value={accountNumber} 
                    onChange={e => setAccountNumber(e.target.value)} 
                    placeholder="09171234567" 
                    className="w-full bg-slate-700/60 border border-slate-600/40 rounded-xl p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition-all duration-200" 
                />
            </div>

            <button 
                type="submit" 
                disabled={isSubmitting || !isFormValid || availableChannels.length === 0} 
                className="w-full font-bold py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Spinner />
                        <span>Adding Method...</span>
                    </>
                ) : (
                    "Add Payment Method"
                )}
            </button>
        </form>
    );
};

export default AddPaymentMethodForm;