import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  ShieldAlert,
  X,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Lock
} from 'lucide-react';
import * as api from '../services/api';

interface TwoFactorModalProps {
  isOpen: boolean;
  mode: 'setup' | 'disable';
  onClose: () => void;
  onStatusChange: (enabled: boolean) => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  mode,
  onClose,
  onStatusChange,
  onShowToast
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qr_code_svg: string;
    provisioning_uri: string;
  } | null>(null);

  const [confirmCode, setConfirmCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setConfirmCode('');
      setDisablePassword('');
      setBackupCodes([]);
      setCopiedKey(false);
      setCopiedCodes(false);

      if (mode === 'setup') {
        loadSetupData();
      }
    }
  }, [isOpen, mode]);

  const loadSetupData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.setupMfa();
      setSetupData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize 2FA setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    if (!backupCodes.length) return;
    const text = `Exma 2FA Backup Recovery Codes:\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmCode.trim()) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.enableMfa(confirmCode.trim());
      setBackupCodes(res.backup_codes || []);
      onStatusChange(true);
      onShowToast('Two-factor authentication enabled successfully!', 'success');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please check your app.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      setError('Please enter your account password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.disableMfa(disablePassword);
      onStatusChange(false);
      onShowToast('Two-factor authentication disabled.', 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 15, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backupCodes.length === 0) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: 'min(100%, 480px)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)',
          background: '#0f172a',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {mode === 'setup' ? (
              <ShieldCheck size={22} style={{ color: '#10b981' }} />
            ) : (
              <ShieldAlert size={22} style={{ color: '#ef4444' }} />
            )}
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              {mode === 'setup'
                ? backupCodes.length > 0
                  ? 'Backup Recovery Codes'
                  : 'Enable Two-Factor Authentication'
                : 'Disable Two-Factor Authentication'}
            </h3>
          </div>
          {backupCodes.length === 0 && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: '6px'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Setup Flow - Step 1 & 2 */}
          {mode === 'setup' && backupCodes.length === 0 && (
            <>
              {loading && !setupData ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)' }}>
                  <RefreshCw size={26} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
                  <p style={{ fontSize: '0.85rem' }}>Generating secure authenticator key…</p>
                </div>
              ) : setupData ? (
                <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    1. Scan this QR code with <strong>Google Authenticator</strong>, <strong>1Password</strong>, or{' '}
                    <strong>Authy</strong>:
                  </p>

                  {/* QR Code Container */}
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '0.85rem',
                      borderRadius: '12px',
                      width: 'fit-content',
                      margin: '0 auto',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                    }}
                    dangerouslySetInnerHTML={{ __html: setupData.qr_code_svg }}
                  />

                  {/* Secret Key Manual Option */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600 }}>MANUAL SECRET KEY</div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.08em',
                          color: '#38bdf8'
                        }}
                      >
                        {setupData.secret}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.65rem',
                        color: copiedKey ? '#10b981' : 'var(--text-main)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Step 2: Confirmation input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.45rem' }}>
                      2. Enter the 6-digit code shown in your app:
                    </label>
                    <input
                      type="text"
                      autoComplete="one-time-code"
                      value={confirmCode}
                      onChange={(e) => setConfirmCode(e.target.value)}
                      placeholder="e.g. 123456"
                      maxLength={8}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-glass)',
                        color: '#ffffff',
                        fontSize: '1.1rem',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.15em',
                        textAlign: 'center',
                        outline: 'none'
                      }}
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        flex: 1,
                        padding: '0.7rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-glass)',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        flex: 2,
                        padding: '0.7rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Verifying…</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={16} />
                          <span>Activate 2FA</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : null}
            </>
          )}

          {/* Setup Flow - Step 3: Backup Codes */}
          {mode === 'setup' && backupCodes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#6ee7b7',
                  fontSize: '0.84rem',
                  lineHeight: 1.4
                }}
              >
                🎉 <strong>Two-Factor Authentication is now active!</strong>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Save these backup recovery codes now. If you lose access to your authenticator app, each code can be used{' '}
                <strong>once</strong> to log in to your account.
              </p>

              {/* Codes Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                {backupCodes.map((code, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#f8fafc',
                      letterSpacing: '0.08em',
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '4px'
                    }}
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleCopyBackupCodes}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: copiedCodes ? '#10b981' : '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {copiedCodes ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedCodes ? 'Codes Copied!' : 'Copy All Codes'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Disable Flow */}
          {mode === 'disable' && (
            <form onSubmit={handleDisable} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                Turning off two-factor authentication will remove the requirement for an authenticator code when logging
                in. Please enter your account password to confirm:
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.45rem' }}>
                  Account Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
                  />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Enter your current password"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.4rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-glass)',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.7rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Disabling…</span>
                    </>
                  ) : (
                    <span>Confirm & Disable</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
