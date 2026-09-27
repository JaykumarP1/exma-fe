import React from 'react';
import { CreditCard } from 'lucide-react';
import { CardNetwork } from '../../utils/cardValidation';

interface CardNetworkBadgeProps {
  network: CardNetwork | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const CardNetworkBadge: React.FC<CardNetworkBadgeProps> = ({
  network,
  size = 'md',
  showLabel = true,
  className = '',
  style = {}
}) => {
  const norm = (network || '').toLowerCase().trim();

  // Determine normalized network
  let normalizedNetwork: 'visa' | 'mastercard' | 'amex' | 'rupay' | 'discover' | 'generic' = 'generic';
  if (norm.includes('visa')) normalizedNetwork = 'visa';
  else if (norm.includes('master')) normalizedNetwork = 'mastercard';
  else if (norm.includes('amex') || norm.includes('american express')) normalizedNetwork = 'amex';
  else if (norm.includes('rupay')) normalizedNetwork = 'rupay';
  else if (norm.includes('discover')) normalizedNetwork = 'discover';

  // Sizing definitions
  const sizeStyles = {
    sm: {
      padding: '0.15rem 0.4rem',
      fontSize: '0.65rem',
      height: '20px',
      gap: '0.25rem',
      borderRadius: '4px'
    },
    md: {
      padding: '0.25rem 0.55rem',
      fontSize: '0.75rem',
      height: '26px',
      gap: '0.35rem',
      borderRadius: '5px'
    },
    lg: {
      padding: '0.35rem 0.75rem',
      fontSize: '0.85rem',
      height: '32px',
      gap: '0.45rem',
      borderRadius: '6px'
    }
  }[size];

  switch (normalizedNetwork) {
    case 'visa':
      return (
        <span
          className={className}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1f71 0%, #004fb4 100%)',
            color: '#ffffff',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            boxShadow: '0 2px 5px rgba(0, 79, 180, 0.25)',
            fontWeight: 800,
            letterSpacing: '0.04em',
            fontStyle: 'italic',
            userSelect: 'none',
            flexShrink: 0,
            ...sizeStyles,
            ...style
          }}
          title="Visa Network"
        >
          <span>VISA</span>
        </span>
      );

    case 'mastercard':
      return (
        <span
          className={className}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(235, 0, 27, 0.12)',
            color: '#f8fafc',
            border: '1px solid rgba(235, 0, 27, 0.35)',
            fontWeight: 700,
            userSelect: 'none',
            flexShrink: 0,
            ...sizeStyles,
            ...style
          }}
          title="Mastercard Network"
        >
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: size === 'sm' ? '18px' : '24px', height: size === 'sm' ? '12px' : '14px' }}>
            <div
              style={{
                width: size === 'sm' ? '12px' : '14px',
                height: size === 'sm' ? '12px' : '14px',
                borderRadius: '50%',
                background: '#eb001b',
                position: 'absolute',
                left: 0
              }}
            />
            <div
              style={{
                width: size === 'sm' ? '12px' : '14px',
                height: size === 'sm' ? '12px' : '14px',
                borderRadius: '50%',
                background: '#ff5f00',
                position: 'absolute',
                right: 0,
                opacity: 0.95
              }}
            />
          </div>
          {showLabel && <span style={{ fontSize: sizeStyles.fontSize, fontWeight: 700 }}>Mastercard</span>}
        </span>
      );

    case 'amex':
      return (
        <span
          className={className}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #002663 0%, #006fcf 100%)',
            color: '#ffffff',
            border: '1px solid rgba(14, 165, 233, 0.5)',
            boxShadow: '0 2px 5px rgba(0, 111, 207, 0.25)',
            fontWeight: 800,
            letterSpacing: '0.06em',
            userSelect: 'none',
            flexShrink: 0,
            ...sizeStyles,
            ...style
          }}
          title="American Express"
        >
          <span>AMEX</span>
        </span>
      );

    case 'rupay':
      return (
        <span
          className={className}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
            color: '#ffffff',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 2px 5px rgba(4, 120, 87, 0.25)',
            fontWeight: 800,
            userSelect: 'none',
            flexShrink: 0,
            ...sizeStyles,
            ...style
          }}
          title="RuPay Network"
        >
          <span style={{ color: '#ffffff' }}>Ru</span>
          <span style={{ color: '#38bdf8' }}>Pay</span>
        </span>
      );

    case 'discover':
      return (
        <span
          className={className}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
            color: '#ffffff',
            border: '1px solid rgba(249, 115, 22, 0.5)',
            boxShadow: '0 2px 5px rgba(234, 88, 12, 0.25)',
            fontWeight: 800,
            letterSpacing: '0.04em',
            userSelect: 'none',
            flexShrink: 0,
            ...sizeStyles,
            ...style
          }}
          title="Discover Network"
        >
          <span>DISCOVER</span>
        </span>
      );

    default:
      return (
        <span
          className={className}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-muted)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontWeight: 600,
            userSelect: 'none',
            flexShrink: 0,
            ...sizeStyles,
            ...style
          }}
        >
          <CreditCard size={size === 'sm' ? 12 : 14} />
          {showLabel && <span>{network || 'Card'}</span>}
        </span>
      );
  }
};

