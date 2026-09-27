import React, { useState, useEffect, useMemo } from 'react';
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
  Upload,
  KeyRound,
  Check,
  CreditCard
} from 'lucide-react';
import { Statement, Project, Card } from '../types';
import * as api from '../services/api';

interface UnlockStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  statement: Statement | null;
  onUnlocked: (updatedStatement: Statement, extractedCount?: number) => void;
  projects?: Project[];
  cards?: Card[];
}

export const UnlockStatementModal: React.FC<UnlockStatementModalProps> = ({
  isOpen,
  onClose,
  statement,
  onUnlocked,
  projects = [],
  cards = []
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockAndStore, setUnlockAndStore] = useState(true);
  const [savePasswordForBank, setSavePasswordForBank] = useState(true);
  const [savePasswordForCard, setSavePasswordForCard] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPasswordSource, setSelectedPasswordSource] = useState<string | null>(null);
  const [loadedCards, setLoadedCards] = useState<Card[]>(cards);

  useEffect(() => {
    if (cards && cards.length > 0) {
      setLoadedCards(cards);
    } else if (isOpen) {
      api.fetchCards()
        .then((res) => {
          if (res && res.cards) setLoadedCards(res.cards);
        })
        .catch(() => {});
    }
  }, [cards, isOpen]);

  // Find matching bank and card to determine default password
  const matchingBank = useMemo(() => {
    if (!statement || !projects) return undefined;
    return projects.find((p) => {
      if (statement.bank_id && p.id === statement.bank_id) return true;
      const sBank = (statement.bank_name || statement.bank_title || '').toLowerCase().trim();
      return sBank && p.title.toLowerCase().trim() === sBank;
    });
  }, [statement, projects]);

  const matchingCard = useMemo(() => {
    if (!statement || !loadedCards) return undefined;
    return loadedCards.find((c) => {
      if (statement.card_id && c.id === statement.card_id) return true;
      const stmtDigits = statement.card_last_four || statement.detected_card_last_four;
      const cardDigits = c.last_four || (c.card_number ? c.card_number.slice(-4) : '');
      return stmtDigits && cardDigits && stmtDigits === cardDigits;
    });
  }, [statement, loadedCards]);

  const defaultPassword =
    statement?.saved_password ||
    statement?.saved_statement_password ||
    matchingCard?.statement_password ||
    matchingBank?.statement_password;
  const defaultSourceName =
    statement?.saved_password_target_name ||
    matchingCard?.card_name ||
    matchingBank?.title ||
    statement?.bank_name ||
    statement?.bank_title;

  const savedPasswordOptions = useMemo(() => {
    const list: { id: string | number; label: string; subtitle?: string; password: string; sourceType: 'card' | 'bank' | 'stmt' }[] = [];
    const seen = new Set<string>();

    if (statement?.saved_password || statement?.saved_statement_password) {
      const pwd = (statement.saved_password || statement.saved_statement_password)!;
      list.push({
        id: 'auto-stmt',
        sourceType: 'stmt',
        label: statement.saved_password_target_name || statement.bank_name || statement.bank_title || 'Statement Bank',
        subtitle: 'Auto-detected',
        password: pwd
      });
      seen.add(pwd);
    }

    if (loadedCards) {
      loadedCards.forEach((c) => {
        if (c.has_statement_password && c.statement_password && !seen.has(c.statement_password)) {
          const last4 = c.last_four || (c.card_number ? c.card_number.slice(-4) : '');
          const label = c.card_name || `${c.card_type || 'Credit'} Card`;
          const subtitle = c.bank_name ? `${c.bank_name} • •••• ${last4}` : `•••• ${last4}`;
          list.push({
            id: `card-${c.id}`,
            sourceType: 'card',
            label,
            subtitle,
            password: c.statement_password
          });
          seen.add(c.statement_password);
        }
      });
    }

    if (projects) {
      projects.forEach((p) => {
        if (p.has_statement_password && p.statement_password && !seen.has(p.statement_password)) {
          list.push({
            id: `bank-${p.id}`,
            sourceType: 'bank',
            label: p.title,
            subtitle: p.email || 'Bank Account',
            password: p.statement_password
          });
          seen.add(p.statement_password);
        }
      });
    }

    return list;
  }, [statement, projects, loadedCards]);

  useEffect(() => {
    if (isOpen) {
      if (defaultPassword) {
        setPassword(defaultPassword);
        setSelectedPasswordSource(defaultSourceName || 'Bank Manager');
      } else {
        setPassword('');
        setSelectedPasswordSource(null);
      }
      setError(null);
      setUnlockAndStore(true);
      setSavePasswordForBank(true);
      setSavePasswordForCard(true);
      setShowPassword(false);
    }
  }, [isOpen, statement, defaultPassword, defaultSourceName]);

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
          {/* Saved Passwords Quick-Fill Chips */}
          {savedPasswordOptions.length > 0 && (
            <div
              style={{
                padding: '0.75rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.06) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <KeyRound size={14} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                    Saved Passwords (Cards & Banks)
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                  Click to quick-fill
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {savedPasswordOptions.map((opt) => {
                  const isSelected = password === opt.password;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setPassword(opt.password);
                        setSelectedPasswordSource(opt.label);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                        border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title={`Apply saved password for ${opt.label}`}
                    >
                      {opt.sourceType === 'card' ? (
                        <CreditCard size={12} style={{ color: isSelected ? '#10b981' : '#c084fc' }} />
                      ) : (
                        <Building2 size={12} style={{ color: isSelected ? '#10b981' : '#38bdf8' }} />
                      )}
                      <span>{opt.label}</span>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          padding: '0.05rem 0.3rem',
                          borderRadius: '3px',
                          background: opt.sourceType === 'card' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: opt.sourceType === 'card' ? '#c084fc' : '#38bdf8'
                        }}
                      >
                        {opt.sourceType === 'card' ? 'Card' : opt.sourceType === 'stmt' ? 'Auto' : 'Bank'}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          color: isSelected ? '#a7f3d0' : 'var(--text-dim)',
                          letterSpacing: '0.08em'
                        }}
                      >
                        ••••••••
                      </span>
                      {isSelected && <Check size={13} style={{ color: '#10b981' }} />}
                    </button>
                  );
                })}
              </div>

              {selectedPasswordSource && password && (
                <div style={{ fontSize: '0.7rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '0.35rem', paddingTop: '0.15rem' }}>
                  <Check size={11} style={{ color: '#10b981' }} />
                  <span>Password applied from <strong>{selectedPasswordSource}</strong></span>
                </div>
              )}
            </div>
          )}

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

