import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-white/5 border border-white/10 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-150 ${
            icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2'
          } ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

