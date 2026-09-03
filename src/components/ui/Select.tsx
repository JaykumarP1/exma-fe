import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ icon, error, children, className = '', ...props }, ref) => {
    return (
      <div className="w-full relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <select
          ref={ref}
          className={`w-full bg-slate-800 border border-white/10 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150 cursor-pointer ${
            icon ? 'pl-9 pr-8 py-2' : 'px-3 py-2'
          } ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''} ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

