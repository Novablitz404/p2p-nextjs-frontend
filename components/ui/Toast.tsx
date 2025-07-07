'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastComponent = ({ toast, onRemove }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-remove after duration
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} className="text-emerald-400" />;
      case 'error':
        return <XCircle size={20} className="text-red-400" />;
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-400" />;
      case 'info':
        return <Info size={20} className="text-blue-400" />;
      default:
        return <Info size={20} className="text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <div
      className={`
        relative w-full max-w-sm bg-slate-800/95 backdrop-blur-sm border rounded-xl p-4 shadow-2xl
        transition-all duration-300 ease-out transform
        ${getBorderColor()}
        ${isVisible && !isExiting 
          ? 'opacity-100 translate-x-0 scale-100' 
          : 'opacity-0 translate-x-full scale-95'
        }
        ${isExiting ? 'translate-x-full opacity-0 scale-95' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white mb-1">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-xs text-gray-300 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 rounded-full hover:bg-slate-700/50 transition-colors group"
        >
          <X size={16} className="text-gray-400 group-hover:text-white" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-700/50 rounded-b-xl overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ease-linear ${
            toast.type === 'success' ? 'bg-emerald-400' :
            toast.type === 'error' ? 'bg-red-400' :
            toast.type === 'warning' ? 'bg-yellow-400' :
            'bg-blue-400'
          }`}
          style={{
            width: isExiting ? '0%' : '100%',
            transition: isExiting ? 'width 0.3s ease-out' : `width ${(toast.duration || 5000)}ms linear`
          }}
        />
      </div>
    </div>
  );
};

export default ToastComponent; 