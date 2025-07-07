'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import PaymentChannelIcon from './PaymentChannelIcon';

interface Option {
    value: string;
    label: string;
    icon?: React.ReactNode;
}

interface CustomDropdownProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

const CustomDropdown = ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select an option", 
    disabled = false,
    className = ""
}: CustomDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(option => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full bg-slate-700/60 border border-slate-600/40 rounded-xl p-3 text-left text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 focus:outline-none transition-all duration-200 flex items-center justify-between ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-500/60'
                }`}
            >
                <div className="flex items-center gap-3">
                    {selectedOption ? (
                        <>
                            {selectedOption.icon && (
                                <div className="text-emerald-400">
                                    {selectedOption.icon}
                                </div>
                            )}
                            <span className="font-medium">{selectedOption.label}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <ChevronDown 
                    size={16} 
                    className={`text-gray-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`} 
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/60 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className={`w-full p-3 text-left hover:bg-slate-700/60 transition-colors duration-150 flex items-center justify-between ${
                                option.value === value ? 'bg-emerald-500/20 text-emerald-400' : 'text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                {option.icon && (
                                    <div className="text-emerald-400">
                                        {option.icon}
                                    </div>
                                )}
                                <span className="font-medium">{option.label}</span>
                            </div>
                            {option.value === value && (
                                <Check size={16} className="text-emerald-400" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown; 