import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  CreditCard,
  Building2,
  Trash2,
  Save,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card } from '../types';
import { CardNetworkBadge } from './ui/CardNetworkBadge';

interface ManageCardPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  onSave: (cardId: number, password: string | null) => Promise<void>;
}

export const ManageCardPasswordModal: React.FC<ManageCardPasswordModalProps> = ({
  isOpen,
  onClose,
  card,
  onSave
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && card) {
      setPassword(card.statement_password || '');
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen, card]);

  if (!isOpen || !card) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onSave(card.id, password.trim() ? password.trim() : null);
      onClose();
    } catch (err: any) {
      console.error('Failed to update card statement password', err);
      setError(err?.message || 'Failed to update statement password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      setError(null);
      await onSave(card.id, null);
      onClose();
    } catch (err: any) {
      console.error('Failed to remove card statement password', err);
      setError(err?.message || 'Failed to remove password.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="modal-backdrop"
      style={{ zIndex: 11000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '480px', width: '92%' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Card Statement Password
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage auto-unlock password for this card
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Card Banner */}
        <div
          style={{
            padding: '0.75rem 0.95rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            marginBottom: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <CreditCard size={16} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.88rem' }}>
              {card.card_name || `${card.card_type} Card`}
            </span>
            <CardNetworkBadge network={card.card_type} size="sm" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              •••• {card.last_four || (card.card_number ? card.card_number.slice(-4) : '')}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              background: card.has_statement_password ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)',
              color: card.has_statement_password ? '#10b981' : '#94a3b8',
              border: `1px solid ${card.has_statement_password ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.25)'}`
            }}
          >
            {card.has_statement_password ? 'Configured' : 'Not Set'}
          </span>
        </div>

        {/* Bank & Holder subtext */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
            marginBottom: '1.15rem',
            paddingLeft: '0.2rem'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Building2 size={13} style={{ color: '#38bdf8' }} />
            {card.bank_name || card.project_title || 'Unassigned Bank'}
          </span>
          <span>•</span>
          <span>Cardholder: <strong style={{ color: '#e2e8f0' }}>{card.card_holder_name}</strong></span>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-dim)',
                marginBottom: '0.45rem',
                display: 'block'
              }}
            >
              Card Statement PDF Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                disabled={loading}
                placeholder="Enter password (e.g. DDMMYYYY, first 4 letters + DOB, etc.)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.72rem 2.6rem 0.72rem 2.4rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid var(--border-glass)',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  fontFamily: showPassword ? 'inherit' : 'var(--font-mono)'
                }}
              />
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '0.4rem', marginBottom: 0 }}>
              Encrypted PDF statements from this credit card will automatically use this password.
            </p>
          </div>

          {/* Secure Storage Note */}
          <div
            style={{
              padding: '0.75rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem'
            }}
          >
            <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.75rem', color: '#a7f3d0', lineHeight: 1.4 }}>
              <strong>AES-256 Encrypted:</strong> Stored securely in your isolated workspace database. Only used during PDF extraction.
            </div>
          </div>

          {/* Modal Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem',
              gap: '0.75rem'
            }}
          >
            {card.has_statement_password ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <Trash2 size={14} /> Remove Password
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Password
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
