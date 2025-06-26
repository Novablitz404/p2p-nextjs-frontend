'use client';

import Modal from './Modal';
import Image from 'next/image';

interface ImageViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
}

const ImageViewModal = ({ isOpen, onClose, imageUrl }: ImageViewModalProps) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Proof of Payment Screenshot">
            <div className="relative w-full h-96 bg-slate-900 rounded-lg">
                <Image 
                    src={imageUrl} 
                    alt="Proof of payment screenshot" 
                    fill 
                    style={{ objectFit: 'contain' }} 
                    className="rounded-md"
                />
            </div>
        </Modal>
    );
};

export default ImageViewModal;