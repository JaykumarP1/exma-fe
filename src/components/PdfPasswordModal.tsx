import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, FileText, Sparkles } from 'lucide-react';

interface PdfPasswordModalProps {
  isOpen: boolean;
  filename: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export const PdfPasswordModal: React.FC<PdfPasswordModalProps> = ({ isOpen, filename, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    onSubmit(password);
    setPassword('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '1.75rem',
          background: '#0f172a',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24'
              }}
            >
              <Lock size={20} />
            </div>

            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>Password Required</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF is password-protected</p>
            </div>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Info card */}
        <div
          style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            marginBottom: '1.25rem',
            fontSize: '0.82rem',
            color: '#fef3c7',
            lineHeight: '1.4'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              marginBottom: '0.3rem',
              color: '#fbbf24'
            }}
          >
            <FileText size={15} /> {filename || 'bank_statement.pdf'}
          </div>
          This PDF bank statement is encrypted. Please enter the document password to unlock and extract expenses.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#e2e8f0',
                marginBottom: '0.45rem'
              }}
            >
              PDF Document Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter PDF password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={15} /> Unlock & Extract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
