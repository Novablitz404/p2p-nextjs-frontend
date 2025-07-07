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
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Your Rating</label>
                    <div className="flex justify-center">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button 
                                key={star} 
                                onClick={() => setRating(star)} 
                                className="text-4xl transition-all duration-200 hover:scale-125 mx-1"
                            >
                                {star <= rating ? 
                                    <span className="text-yellow-400 drop-shadow-lg">★</span> : 
                                    <span className="text-gray-500 hover:text-yellow-300">☆</span>
                                }
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Comment (Optional)</label>
                    <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-700/60 border border-slate-600/40 rounded-xl p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition-all duration-200"
                        placeholder="How was your experience with this seller?"
                    />
                </div>
                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white disabled:opacity-50 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
                    >
                        {isSubmitting ? <Spinner /> : "Submit Review"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default LeaveReviewModal;