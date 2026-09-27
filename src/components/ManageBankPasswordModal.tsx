import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  Building2,
  Trash2,
  Save,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Project } from '../types';
import { parseBankTags, getTagColor } from '../utils/tagColors';

interface ManageBankPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: Project | null;
  onSave: (bankId: number, password: string | null) => Promise<void>;
}

export const ManageBankPasswordModal: React.FC<ManageBankPasswordModalProps> = ({
  isOpen,
  onClose,
  bank,
  onSave
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && bank) {
      setPassword(bank.statement_password || '');
      setShowPassword(false);
      setError(null);
    }
  }, [isOpen, bank]);

  if (!isOpen || !bank) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await onSave(bank.id, password.trim() ? password.trim() : null);
      onClose();
    } catch (err: any) {
      console.error('Failed to update bank statement password', err);
      setError(err?.message || 'Failed to update statement password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      setError(null);
      await onSave(bank.id, null);
      onClose();
    } catch (err: any) {
      console.error('Failed to remove bank statement password', err);
      setError(err?.message || 'Failed to remove password.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="modal-backdrop"
      style={{ zIndex: 1100 }}
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
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Bank Statement Password
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Manage auto-unlock credentials for {bank.title}
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

        {/* Bank Banner */}
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
            <Building2 size={16} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.88rem' }}>{bank.title}</span>
            {parseBankTags(bank.tags, bank.category).map((tag) => {
              const style = getTagColor(tag);
              return (
                <span
                  key={tag}
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: style.text,
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px'
                  }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              background: bank.has_statement_password ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.12)',
              color: bank.has_statement_password ? '#10b981' : '#94a3b8',
              border: `1px solid ${bank.has_statement_password ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.25)'}`
            }}
          >
            {bank.has_statement_password ? 'Configured' : 'Not Set'}
          </span>
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
              Default PDF Statement Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                disabled={loading}
                placeholder="Enter statement password (e.g. DDMMYYYY, PAN, etc.)"
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
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: '1.4' }}>
              Most banks protect statements with date of birth (e.g. <code>01011990</code>), PAN number, or card/account digits.
            </div>
          </div>

          <div
            style={{
              padding: '0.7rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              fontSize: '0.75rem',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem'
            }}
          >
            <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span>
              This password is encrypted with <strong>AES-256-GCM</strong>. It will be used to automatically unlock statements synced from email or uploaded for {bank.title}, and will appear as a quick-fill option in statement unlock dialogs.
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
            {bank.has_statement_password ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                style={{
                  padding: '0.6rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                <Trash2 size={13} />
                <span>Remove Password</span>
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '0.6rem 1.15rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-glass)',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '1px solid #10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Password</span>
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

