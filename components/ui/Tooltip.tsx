import { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  text: string;
}

const Tooltip = ({ children, text }: TooltipProps) => {
  return (
    // The 'group' class on this parent div is what makes the hover effect work.
    <div className="relative flex items-center group">
      {children}
      {/* This is the tooltip pop-up. 
        - `opacity-0` and `group-hover:opacity-100` make it appear on hover.
        - `z-50` ensures it renders on top of other elements within the modal.
      */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 text-xs text-center bg-slate-700 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {text}
      </div>
    </div>
  );
};

export default Tooltip;