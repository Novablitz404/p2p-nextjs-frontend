'use client';

interface SpinnerProps {
    text?: string;
}

const Spinner = ({ text }: SpinnerProps) => (
    <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        {text && <span className="ml-3">{text}</span>}
    </div>
);

export default Spinner;