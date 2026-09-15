import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Lock,
  Unlock,
  X,
  FileText,
  Building2,
  Calendar,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Mail,
  Upload
} from 'lucide-react';
import { Statement } from '../types';
import * as api from '../services/api';

interface UnlockStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  statement: Statement | null;
  onUnlocked: (updatedStatement: Statement, extractedCount?: number) => void;
}

export const UnlockStatementModal: React.FC<UnlockStatementModalProps> = ({
  isOpen,
  onClose,
  statement,
  onUnlocked
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockAndStore, setUnlockAndStore] = useState(true);
  const [savePasswordForBank, setSavePasswordForBank] = useState(true);
  const [savePasswordForCard, setSavePasswordForCard] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setUnlockAndStore(true);
      setSavePasswordForBank(true);
      setSavePasswordForCard(true);
      setShowPassword(false);
    }
  }, [isOpen, statement]);

  if (!isOpen || !statement) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the PDF password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.unlockExistingStatement(
        statement.id,
        password.trim(),
        unlockAndStore,
        savePasswordForBank,
        savePasswordForCard
      );
      onUnlocked(res.statement, res.extracted_count);
      onClose();
    } catch (err: any) {
      console.error('Failed to unlock statement', err);
      setError(err?.message || 'Incorrect password for this PDF statement. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  const isEmailSource = statement.source === 'email' || statement.is_email_sync;

  return createPortal(
    <div
      className="modal-backdrop"
      style={{ zIndex: 1000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '500px', width: '92%' }}>
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
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b'
              }}
            >
              <Lock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Unlock Protected Statement
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Enter password to decrypt and extract statement transactions
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

        {/* Prefilled Statement Document Card */}
        <div
          style={{
            padding: '0.9rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            marginBottom: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  flexShrink: 0
                }}
              >
                <FileText size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: '#f8fafc',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={statement.filename}
                >
                  {statement.filename}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Statement #{statement.id}
                </div>
              </div>
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                flexShrink: 0
              }}
            >
              <Lock size={11} /> Locked
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingTop: '0.45rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.76rem',
              color: 'var(--text-muted)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building2 size={13} style={{ color: 'var(--text-dim)' }} />
              <span style={{ color: '#e2e8f0' }}>{statement.bank_name || statement.bank_title || 'Unassigned Bank'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {isEmailSource ? (
                <>
                  <Mail size={13} style={{ color: '#38bdf8' }} />
                  <span>Email Synced</span>
                </>
              ) : (
                <>
                  <Upload size={13} style={{ color: '#c084fc' }} />
                  <span>Manual Upload</span>
                </>
              )}
            </div>

            {statement.due_date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={13} style={{ color: 'var(--text-dim)' }} />
                <span>Due: {statement.due_date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Password Input */}
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
              PDF Document Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                disabled={loading}
                placeholder="Enter password to unlock..."
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
                  outline: 'none'
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
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
              Bank PDF statements are commonly protected with your DOB (DDMMYYYY) or Card/Account digits.
            </span>
          </div>

          {/* Option: Unlock & Store */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              background: unlockAndStore ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              border: unlockAndStore ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => !loading && setUnlockAndStore(!unlockAndStore)}
          >
            <input
              type="checkbox"
              id="modal-unlock-and-store-checkbox"
              checked={unlockAndStore}
              onChange={(e) => setUnlockAndStore(e.target.checked)}
              disabled={loading}
              style={{ marginTop: '0.2rem', cursor: 'pointer', accentColor: '#10b981' }}
              onClick={(e) => e.stopPropagation()}
            />
            <div>
              <label
                htmlFor="modal-unlock-and-store-checkbox"
                style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  cursor: 'pointer',
                  display: 'block'
                }}
              >
                Unlock and store decrypted PDF
              </label>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: '1.35' }}>
                {unlockAndStore
                  ? 'Store the decrypted PDF permanently. Password will never be asked again when viewing or extracting.'
                  : 'Decrypt for this session only without overwriting the encrypted PDF file in storage.'}
              </div>
            </div>
          </div>

          {/* Option: Remember password for Bank & Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glass)'
            }}
          >
            {(statement.bank_name || statement.bank_title) && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: '#e2e8f0'
                }}
              >
                <input
                  type="checkbox"
                  checked={savePasswordForBank}
                  onChange={(e) => setSavePasswordForBank(e.target.checked)}
                  disabled={loading}
                  style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                />
                <span>
                  Remember password for <strong>{statement.bank_name || statement.bank_title}</strong> statements
                </span>
              </label>
            )}

            {(statement.card_last_four || statement.detected_card_last_four) && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: '#e2e8f0'
                }}
              >
                <input
                  type="checkbox"
                  checked={savePasswordForCard}
                  onChange={(e) => setSavePasswordForCard(e.target.checked)}
                  disabled={loading}
                  style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                />
                <span>
                  Remember password for Card ending in <strong>{statement.card_last_four || statement.detected_card_last_four}</strong>
                </span>
              </label>
            )}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Saved passwords are encrypted with AES-256-GCM and automatically applied to future email statement imports.
            </div>
          </div>

          {/* Security Note */}
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              fontSize: '0.75rem',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>Encrypted using bank-grade security. Used automatically for future statement syncs.</span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.4rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-glass)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              style={{
                padding: '0.65rem 1.35rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '1px solid #10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !password.trim() ? 0.6 : 1
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Unlocking & Extracting...</span>
                </>
              ) : (
                <>
                  <Unlock size={15} />
                  <span>Unlock Statement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

