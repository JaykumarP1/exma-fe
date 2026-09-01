import React, { useState } from 'react';
import { X, CreditCard, Plus, ShieldCheck } from 'lucide-react';

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
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState<'active' | 'locked'>('active');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber.trim() || !cardHolderName.trim() || !expiryDate.trim()) return;

    onSubmit({
      card_number: cardNumber,
      card_holder_name: cardHolderName,
      card_type: cardType,
      expiry_date: expiryDate,
      status
    });

    setCardNumber('');
    setCardHolderName('');
    setCardType('Visa');
    setExpiryDate('');
    setStatus('active');
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
        style={{ width: '100%', maxWidth: '460px', padding: '1.75rem', background: '#0f172a' }}
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
          <button onClick={onClose} style={{ color: 'var(--text-dim)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              Card Network / Type
            </label>
            <select
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: '#1e293b',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="Visa">Visa Commercial</option>
              <option value="Mastercard">Mastercard Corporate</option>
              <option value="Amex">American Express</option>
              <option value="Virtual">Virtual Card</option>
              <option value="Debit">Business Debit</option>
            </select>
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
              Cardholder Name
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
                Card Number / Last 4 Digits
              </label>
              <input
                type="text"
                required
                placeholder="•••• •••• •••• 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none'
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
                Expiry (MM/YY)
              </label>
              <input
                type="text"
                required
                placeholder="12/28"
                maxLength={5}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none'
                }}
              />
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
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'locked')}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: '#1e293b',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="active">Active</option>
              <option value="locked">Locked</option>
            </select>
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
