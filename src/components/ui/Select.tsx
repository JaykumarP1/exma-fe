import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  menuStyle?: React.CSSProperties;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  icon,
  error,
  className = '',
  style = {},
  buttonStyle = {},
  menuStyle = {},
  disabled = false,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSmall = size === 'sm';

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: icon
            ? isSmall ? '0.35rem 0.55rem 0.35rem 1.8rem' : '0.7rem 0.85rem 0.7rem 2.4rem'
            : isSmall ? '0.35rem 0.55rem' : '0.7rem 0.85rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(15, 23, 42, 0.7)',
          border: error ? '1px solid #f87171' : isOpen ? '1px solid #818cf8' : '1px solid var(--border-glass)',
          color: '#ffffff',
          fontSize: isSmall ? '0.78rem' : '0.88rem',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(129, 140, 248, 0.2)' : 'none',
          userSelect: 'none',
          ...buttonStyle
        }}
      >
        {icon && (
          <span style={{ position: 'absolute', left: isSmall ? '0.5rem' : '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
        )}

        <span style={{ color: selectedOption ? '#f8fafc' : 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          size={isSmall ? 13 : 16}
          style={{
            color: 'var(--text-dim)',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
            marginLeft: '0.4rem'
          }}
        />
      </button>

      {/* Popover Options Menu */}
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            minWidth: isSmall ? '130px' : '100%',
            background: '#0f172a',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.65)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 999,
            padding: '0.35rem',
            ...menuStyle
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: isSmall ? '0.4rem 0.6rem' : '0.55rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: isSmall ? '0.78rem' : '0.85rem',
                  color: isSelected ? '#818cf8' : '#e2e8f0',
                  background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check size={isSmall ? 12 : 14} style={{ color: '#818cf8' }} />}
              </div>
            );
          })}
        </div>
      )}

      {error && <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.35rem' }}>{error}</p>}
    </div>
  );
};

