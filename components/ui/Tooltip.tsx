import { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  text: string;
}

const Tooltip = ({ children, text }: TooltipProps) => {
  return (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-max max-w-xs p-3 text-xs text-center bg-slate-700 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {text}
      </div>
    </div>
  );
};

export default Tooltip;