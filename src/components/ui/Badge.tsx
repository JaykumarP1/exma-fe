import React from 'react';

export interface BadgeProps {
  variant?: 'success' | 'danger' | 'info' | 'purple' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  size = 'md',
  pulse = false,
  icon,
  children,
  className = '',
  style = {},
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    info: {
      background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%)',
      border: '1px solid rgba(56, 189, 248, 0.4)',
      color: '#38bdf8',
    },
    purple: {
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.4)',
      color: '#818cf8',
    },
    success: {
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
      border: '1px solid rgba(16, 185, 129, 0.4)',
      color: '#34d399',
    },
    danger: {
      background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(225, 29, 72, 0.15) 100%)',
      border: '1px solid rgba(244, 63, 94, 0.4)',
      color: '#f87171',
    },
    warning: {
      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.4)',
      color: '#fbbf24',
    },
    neutral: {
      background: 'rgba(255, 255, 255, 0.06)',
      border: '1px solid var(--border-glass)',
      color: '#9ca3af',
    },
  };

  const paddingStyle =
    size === 'sm'
      ? { padding: '0.15rem 0.45rem', fontSize: '0.7rem' }
      : { padding: '0.25rem 0.6rem', fontSize: '0.74rem' };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        borderRadius: '20px',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...paddingStyle,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {pulse && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            boxShadow: '0 0 6px currentColor',
          }}
        />
      )}
      {icon}
      {children}
    </span>
  );
};
