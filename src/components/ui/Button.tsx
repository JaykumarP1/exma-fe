import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emerald' | 'danger' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs font-bold gap-2',
    lg: 'px-5 py-2.5 text-sm font-bold gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30',
    secondary: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 shadow-sm',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/30',
    danger: 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/25 border border-rose-400/30',
    ghost: 'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white',
    glass: 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md shadow-sm',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

