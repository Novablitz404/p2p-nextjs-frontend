'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';

interface LeaveReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
}

const LeaveReviewModal = ({ isOpen, onClose, onSubmit }: LeaveReviewModalProps) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        await onSubmit(rating, comment);
        // Reset state for next time
        setIsSubmitting(false);
        setRating(5);
        setComment('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Leave a Review">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Your Rating</label>
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setRating(star)} className="text-3xl transition-transform hover:scale-125">
                                {star <= rating ? <span className="text-yellow-400">★</span> : <span className="text-gray-500">☆</span>}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Comment (Optional)</label>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-900 rounded-md p-2 border border-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="How was your experience with this seller?"
                    />
                </div>
                <div className="flex justify-end pt-2">
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 font-semibold text-white disabled:opacity-50 flex items-center"
                    >
                        {isSubmitting ? <Spinner /> : "Submit Review"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default LeaveReviewModal;