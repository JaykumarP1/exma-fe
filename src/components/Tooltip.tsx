import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 150
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getPositionStyles = (): React.CSSProperties => {
    switch (position) {
      case 'bottom':
        return {
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-4px)'
        };
      case 'left':
        return {
          right: 'calc(100% + 8px)',
          top: '50%',
          transform: isVisible ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(4px)'
        };
      case 'right':
        return {
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: isVisible ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-4px)'
        };
      case 'top':
      default:
        return {
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(4px)'
        };
    }
  };

  if (!content) return <>{children}</>;

  return (
    <div
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center'
      }}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 9999,
            padding: '0.35rem 0.65rem',
            borderRadius: 'var(--radius-xs, 6px)',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            color: '#f8fafc',
            fontSize: '0.72rem',
            fontWeight: 600,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            ...getPositionStyles()
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};
