import React, { useState } from 'react';
import { X, CreditCard, Plus, ShieldCheck, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Select } from './ui/Select';
import {
  detectCardNetwork,
  validateCardNumber,
  formatCardNumber,
  validateExpiryDate,
  formatExpiryDate
} from '../utils/cardValidation';
import { CardNetworkBadge } from './ui/CardNetworkBadge';

interface AddCardModalProps {
  isOpen: boolean;
  bankName: string;
  onClose: () => void;
  onSubmit: (cardData: {
    card_number: string;
    card_holder_name: string;
    card_type: string;
    expiry_date: string;
    status: 'active' | 'locked';
  }) => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, bankName, onClose, onSubmit }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardType, setCardType] = useState('Visa');
  const [userSelectedType, setUserSelectedType] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState<'active' | 'locked'>('active');
  const [error, setError] = useState<string | null>(null);

  // Live card and expiry validation
  const cardValidation = validateCardNumber(cardNumber);
  const expiryValidation = validateExpiryDate(expiryDate);

  if (!isOpen) return null;

  const handleCardNumberChange = (raw: string) => {
    if (raw.includes('•') || raw.includes('*')) {
      setCardNumber(raw);
      return;
    }
    const formatted = formatCardNumber(raw);
    setCardNumber(formatted);

    const detected = detectCardNetwork(formatted);
    if (detected !== 'Unknown' && !userSelectedType) {
      setCardType(detected);
    }
  };

  const handleExpiryChange = (raw: string) => {
    const formatted = formatExpiryDate(raw);
    setExpiryDate(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber.trim() || !cardHolderName.trim() || !expiryDate.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (cardValidation.error) {
      setError(cardValidation.error);
      return;
    }
    if (!cardValidation.isPartial && !cardValidation.isValid) {
      setError(cardValidation.error || 'Please enter a valid card number.');
      return;
    }
    if (expiryValidation.error) {
      setError(expiryValidation.error);
      return;
    }

    onSubmit({
      card_number: cardNumber.trim(),
      card_holder_name: cardHolderName.trim(),
      card_type: cardType,
      expiry_date: expiryDate.trim(),
      status
    });

    setCardNumber('');
    setCardHolderName('');
    setCardType('Visa');
    setUserSelectedType(false);
    setExpiryDate('');
    setStatus('active');
    setError(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{ width: '100%', maxWidth: '480px', padding: '1.75rem', background: '#0f172a' }}
      >
        {/* Modal Header */}
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                padding: '0.4rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8'
              }}
            >
              <CreditCard size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>Attach Card to Bank</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bankName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600
                }}
              >
                Card Network / Type
              </label>
              {cardValidation.network !== 'Unknown' && (
                <span style={{ fontSize: '0.68rem', color: '#818cf8', fontWeight: 600 }}>
                  Auto-detected
                </span>
              )}
            </div>
            <Select
              value={cardType}
              onChange={(val) => {
                setCardType(val);
                setUserSelectedType(true);
              }}
              options={[
                { value: 'Visa', label: 'Visa Commercial' },
                { value: 'Mastercard', label: 'Mastercard Corporate' },
                { value: 'Amex', label: 'American Express' },
                { value: 'RuPay', label: 'RuPay Platinum' },
                { value: 'Discover', label: 'Discover Card' },
                { value: 'Virtual', label: 'Virtual Card' },
                { value: 'Debit', label: 'Business Debit' }
              ]}
              buttonStyle={{
                padding: '0.6rem 0.85rem',
                fontSize: '0.85rem',
                background: '#1e293b'
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginBottom: '0.35rem',
                fontWeight: 600
              }}
            >
              Cardholder Name <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Jane Doe"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.35rem',
                  fontWeight: 600
                }}
              >
                Card Number / Last 4 Digits <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4315 8157 2560 7017"
                  value={cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 6.5rem 0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: cardValidation.error
                      ? '1px solid #ef4444'
                      : cardValidation.isValid && cardValidation.isComplete
                      ? '1px solid #10b981'
                      : '1px solid var(--border-glass)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    pointerEvents: 'none'
                  }}
                >
                  {cardValidation.isValid && cardValidation.isComplete && (
                    <CheckCircle2 size={15} color="#34d399" />
                  )}
                  <CardNetworkBadge
                    network={cardValidation.network !== 'Unknown' ? cardValidation.network : cardType}
                    size="sm"
                  />
                </div>
              </div>

              {/* Validation status feedback */}
              <div style={{ marginTop: '0.35rem', minHeight: '1.1rem', fontSize: '0.72rem' }}>
                {cardValidation.error && (
                  <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={12} /> {cardValidation.error}
                  </span>
                )}
                {!cardValidation.error && cardValidation.isValid && cardValidation.isComplete && (
                  <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Check size={12} /> Valid {cardValidation.network} card (checksum verified)
                  </span>
                )}
                {!cardValidation.error && cardValidation.warning && (
                  <span style={{ color: 'var(--text-dim)' }}>
                    {cardValidation.warning}
                  </span>
                )}
                {!cardValidation.error && !cardValidation.warning && cardValidation.isPartial && (
                  <span style={{ color: 'var(--text-dim)' }}>
                    Partial card: •••• {cardValidation.digits.slice(-4) || 'XXXX'}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.35rem',
                  fontWeight: 600
                }}
              >
                Expiry (MM/YY) <span style={{ color: '#f43f5e' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="12/28"
                maxLength={5}
                value={expiryDate}
                onChange={(e) => handleExpiryChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: expiryDate && expiryValidation.error
                    ? '1px solid #ef4444'
                    : expiryDate && expiryValidation.isValid
                    ? '1px solid #10b981'
                    : '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
              />
              {expiryDate && expiryValidation.error && (
                <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: '#f87171' }}>
                  {expiryValidation.error}
                </div>
              )}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginBottom: '0.35rem',
                fontWeight: 600
              }}
            >
              Initial Status
            </label>
            <Select
              value={status}
              onChange={(val) => setStatus(val as 'active' | 'locked')}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'locked', label: 'Locked' }
              ]}
              buttonStyle={{
                padding: '0.6rem 0.85rem',
                fontSize: '0.85rem',
                background: '#1e293b'
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-dim)',
              fontSize: '0.72rem',
              marginTop: '0.2rem'
            }}
          >
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>Card numbers are automatically masked and stored securely.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '0.82rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Plus size={15} /> Attach Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
