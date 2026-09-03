import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false }) => {
  return (
    <div
      className={`bg-slate-900/70 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl transition-all duration-250 ${
        hoverable ? 'hover:border-indigo-500/40 hover:-translate-y-0.5 hover:shadow-indigo-500/10' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 md:p-5 border-b border-white/10 flex items-center justify-between gap-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-base md:text-lg font-bold text-slate-100 flex items-center gap-2 ${className}`}>
    {children}
  </h3>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 md:p-5 ${className}`}>{children}</div>
);

