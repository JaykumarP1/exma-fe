import React from 'react';

export interface BadgeProps {
  variant?: 'success' | 'danger' | 'info' | 'purple' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  size = 'md',
  pulse = false,
  icon,
  children,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-bold rounded-full border transition-all duration-150 select-none';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const variantStyles = {
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    danger: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
    info: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
    purple: 'bg-indigo-500/20 border-indigo-400/35 text-indigo-300',
    warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    neutral: 'bg-slate-800/80 border-white/10 text-slate-300',
  };

  const pulseStyles = {
    success: 'bg-emerald-400',
    danger: 'bg-rose-400',
    info: 'bg-sky-400',
    purple: 'bg-indigo-400',
    warning: 'bg-amber-400',
    neutral: 'bg-slate-400',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseStyles[variant]}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseStyles[variant]}`} />
        </span>
      )}
      {icon}
      {children}
    </span>
  );
};

