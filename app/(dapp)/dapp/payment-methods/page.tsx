'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/lib/Web3Provider';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import Spinner from '@/components/ui/Spinner';
import AddPaymentMethodForm from '@/components/forms/AddPaymentMethodForm';
import { Trash2 } from 'lucide-react';
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
        const docRef = doc(db, `users/${address}/paymentMethods`, methodId);
        await deleteDoc(docRef);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left Column: Form to add new method */}
                <AddPaymentMethodForm onAdd={handleAddMethod} />
                
                {/* Right Column: List of saved methods */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Your Saved Methods</h3>
                    {isLoading && <Spinner />}
                    {!isLoading && myPaymentMethods.length === 0 && (
                        <p className="text-gray-500 text-center py-10">You have no saved payment methods.</p>
                    )}
                    {!isLoading && myPaymentMethods.map(method => (
                        <div key={method.id} className="p-4 bg-slate-800 rounded-lg flex justify-between items-center border border-slate-700">
                            <div>
                                <p className="font-bold text-white">{method.channel}</p>
                                <p className="text-sm text-gray-300">{method.accountName}</p>
                                <p className="text-sm text-gray-400 font-mono">{method.accountNumber}</p>
                            </div>
                            <button onClick={() => handleDeleteMethod(method.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-full">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodsPage;