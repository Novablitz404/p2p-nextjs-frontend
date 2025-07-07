'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Spinner from '@/components/ui/Spinner';
import AddPaymentMethodForm from '@/components/forms/AddPaymentMethodForm';
import PaymentChannelIcon from '@/components/ui/PaymentChannelIcon';
import { Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import ConnectWalletMessage from '@/components/ui/ConnectWalletMessage';

interface PaymentMethod {
    id: string;
    channel: string;
    accountName: string;
    accountNumber: string;
}

const PaymentMethodsPage = () => {
    const { address } = useWeb3();
    const [myPaymentMethods, setMyPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Effect to fetch the user's saved payment methods in real-time
    useEffect(() => {
        if (!address) {
            setMyPaymentMethods([]);
            return;
        }
        setIsLoading(true);
        const userMethodsRef = collection(db, `users/${address}/paymentMethods`);
        const unsubscribe = onSnapshot(userMethodsRef, (snapshot) => {
            const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
            setMyPaymentMethods(methods);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [address]);

    // Handler to add a new payment method
    const handleAddMethod = async (methodData: any) => {
        if (!address) return;
        const userMethodsRef = collection(db, `users/${address}/paymentMethods`);
        await addDoc(userMethodsRef, methodData);
        // UI will update automatically via the snapshot listener
    };
    
    // Handler to delete a payment method
    const handleDeleteMethod = async (methodId: string) => {
        if (!address) return;
        if (!window.confirm("Are you sure you want to delete this payment method?")) return;
        
        setDeletingId(methodId);
        try {
            const docRef = doc(db, `users/${address}/paymentMethods`, methodId);
            await deleteDoc(docRef);
            setFeedback({ type: 'success', message: 'Payment method deleted successfully!' });
        } catch (error) {
            setFeedback({ type: 'error', message: 'Failed to delete payment method. Please try again.' });
        } finally {
            setDeletingId(null);
            // Clear feedback after 3 seconds
            setTimeout(() => setFeedback({ type: null, message: '' }), 3000);
        }
    }

    if (!address) {
        return (
            <div className="max-w-4xl mx-auto">
                 <ConnectWalletMessage />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Payment Methods</h1>
            
            {/* Feedback Message */}
            {feedback.type && (
                <div className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
                    feedback.type === 'success' 
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                    {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span className="font-medium">{feedback.message}</span>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Form to add new method */}
                <AddPaymentMethodForm onAdd={handleAddMethod} />
                
                {/* Right Column: List of saved methods */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Your Saved Methods</h3>
                    {isLoading && (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="p-4 bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl animate-pulse">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-slate-700/60 rounded-full"></div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 bg-slate-700/60 rounded w-24"></div>
                                            <div className="h-3 bg-slate-700/60 rounded w-32"></div>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-slate-700/60 rounded w-40"></div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!isLoading && myPaymentMethods.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-700/60 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PaymentChannelIcon channel="Bank Transfer" size={24} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-lg font-medium">No payment methods yet</p>
                            <p className="text-gray-400 text-sm mt-1">Add your first payment method to start trading</p>
                        </div>
                    )}
                    {!isLoading && myPaymentMethods.map(method => (
                        <div 
                            key={method.id} 
                            className="p-5 bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-700/60 shadow-xl hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-200"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 bg-slate-700/60 rounded-full flex items-center justify-center text-emerald-400">
                                        <PaymentChannelIcon channel={method.channel} size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white text-base">{method.channel}</p>
                                        <p className="text-sm text-gray-300">{method.accountName}</p>
                                        <p className="text-sm text-gray-400 font-mono">{method.accountNumber}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteMethod(method.id)} 
                                    disabled={deletingId === method.id}
                                    className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-full transition-all duration-200 disabled:opacity-50"
                                >
                                    {deletingId === method.id ? (
                                        <Spinner />
                                    ) : (
                                        <Trash2 size={18}/>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodsPage;