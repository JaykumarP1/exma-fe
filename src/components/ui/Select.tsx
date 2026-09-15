import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

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
  creatable?: boolean;
  onCreateOption?: (newOption: string) => void;
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
  creatable = false,
  onCreateOption
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value.toLowerCase() === (value || '').toLowerCase());

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsTyping(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSmall = size === 'sm';

  const queryTrimmed = searchQuery.trim();
  const filteredOptions = queryTrimmed.length > 0
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(queryTrimmed.toLowerCase()) ||
          opt.value.toLowerCase().includes(queryTrimmed.toLowerCase())
      )
    : options;

  const hasExactMatch = options.some(
    (opt) =>
      opt.label.toLowerCase() === queryTrimmed.toLowerCase() ||
      opt.value.toLowerCase() === queryTrimmed.toLowerCase()
  );

  const handleCreateNewOption = (customVal: string) => {
    const trimmed = customVal.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (onCreateOption) {
      onCreateOption(formatted);
    } else {
      onChange(formatted);
    }
    setIsOpen(false);
    setIsTyping(false);
    setSearchQuery('');
  };

  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (hasExactMatch) {
        const exact = options.find(
          (opt) =>
            opt.label.toLowerCase() === queryTrimmed.toLowerCase() ||
            opt.value.toLowerCase() === queryTrimmed.toLowerCase()
        );
        if (exact) onChange(exact.value);
        setIsOpen(false);
        setIsTyping(false);
        setSearchQuery('');
      } else if (filteredOptions.length === 1 && queryTrimmed.length > 0) {
        onChange(filteredOptions[0].value);
        setIsOpen(false);
        setIsTyping(false);
        setSearchQuery('');
      } else if (creatable && queryTrimmed.length > 0) {
        handleCreateNewOption(queryTrimmed);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsTyping(false);
      setSearchQuery('');
    }
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`} style={{ position: 'relative', width: '100%', ...style }}>
      {/* Trigger: Button (regular) or Combobox Input (creatable) */}
      {!creatable ? (
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
            {selectedOption ? selectedOption.label : value || placeholder}
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
      ) : (
        <div
          onClick={() => {
            if (disabled) return;
            if (!isOpen) {
              setIsOpen(true);
              setIsTyping(false);
              setSearchQuery('');
              inputRef.current?.focus();
              inputRef.current?.select();
            }
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: icon
              ? isSmall ? '0.25rem 0.45rem 0.25rem 1.8rem' : '0.55rem 0.75rem 0.55rem 2.4rem'
              : isSmall ? '0.25rem 0.45rem' : '0.55rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(15, 23, 42, 0.7)',
            border: error ? '1px solid #f87171' : isOpen ? '1px solid #818cf8' : '1px solid var(--border-glass)',
            color: '#ffffff',
            fontSize: isSmall ? '0.78rem' : '0.88rem',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1,
            transition: 'all 0.2s ease',
            boxShadow: isOpen ? '0 0 0 2px rgba(129, 140, 248, 0.2)' : 'none',
            ...buttonStyle
          }}
        >
          {icon && (
            <span style={{ position: 'absolute', left: isSmall ? '0.5rem' : '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
              {icon}
            </span>
          )}

          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={isTyping ? searchQuery : (selectedOption ? selectedOption.label : value || '')}
            placeholder={placeholder}
            onChange={(e) => {
              setIsTyping(true);
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={(e) => {
              if (!disabled) {
                setIsOpen(true);
                e.target.select();
              }
            }}
            onKeyDown={handleEnterKey}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: isSmall ? '0.78rem' : '0.88rem',
              fontWeight: 500,
              width: '100%',
              padding: 0,
              cursor: disabled ? 'not-allowed' : 'text'
            }}
          />

          <div
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                const nextState = !isOpen;
                setIsOpen(nextState);
                if (nextState) {
                  inputRef.current?.focus();
                  inputRef.current?.select();
                }
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.15rem',
              cursor: 'pointer',
              marginLeft: '0.25rem'
            }}
          >
            <ChevronDown
              size={isSmall ? 13 : 16}
              style={{
                color: 'var(--text-dim)',
                transition: 'transform 0.2s ease',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                flexShrink: 0
              }}
            />
          </div>
        </div>
      )}

      {/* Popover Options Menu */}
      {isOpen && !disabled && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            minWidth: isSmall ? '160px' : '100%',
            background: '#0f172a',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.65)',
            maxHeight: '240px',
            overflowY: 'auto',
            zIndex: 999,
            padding: '0.35rem',
            ...menuStyle
          }}
        >
          {/* Add Option Action if creatable and query is non-empty and no exact match */}
          {creatable && queryTrimmed.length > 0 && !hasExactMatch && (
            <div
              onClick={() => handleCreateNewOption(queryTrimmed)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: isSmall ? '0.45rem 0.6rem' : '0.55rem 0.75rem',
                borderRadius: '6px',
                fontSize: isSmall ? '0.78rem' : '0.85rem',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px dashed rgba(56, 189, 248, 0.4)',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '0.35rem',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
              }}
            >
              <Plus size={isSmall ? 13 : 15} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Add "{queryTrimmed.charAt(0).toUpperCase() + queryTrimmed.slice(1)}"
              </span>
            </div>
          )}

          {filteredOptions.length === 0 && (!creatable || queryTrimmed.length === 0) && (
            <div style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              No categories found
            </div>
          )}

          {filteredOptions.map((opt) => {
            const isSelected = opt.value.toLowerCase() === (value || '').toLowerCase();
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setIsTyping(false);
                  setSearchQuery('');
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

