'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastComponent, { Toast, ToastType } from './Toast';

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    addToast,
    removeToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastComponent toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Convenience functions for common toast types
export const useToastHelpers = () => {
  const { addToast } = useToast();
  
  return {
    success: (title: string, message?: string, duration?: number) => 
      addToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) => 
      addToast({ type: 'error', title, message, duration }),
    info: (title: string, message?: string, duration?: number) => 
      addToast({ type: 'info', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) => 
      addToast({ type: 'warning', title, message, duration }),
  };
}; 