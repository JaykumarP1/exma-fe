import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  bankTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, bankTitle, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '1.75rem',
          background: '#0f172a',
          border: '1px solid rgba(225, 29, 72, 0.3)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(225, 29, 72, 0.15)',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185'
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>Confirm Delete Bank</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Action cannot be undone</p>
            </div>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Warning */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: '1.5' }}>
            Are you sure you want to delete <strong style={{ color: '#fb7185' }}>"{bankTitle}"</strong>?
          </p>
          <div
            style={{
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(225, 29, 72, 0.08)',
              border: '1px solid rgba(225, 29, 72, 0.2)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              lineHeight: '1.4'
            }}
          >
            Warning: This will permanently remove this bank entry along with all attached statements, payment cards, and
            extracted expenses.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={16} /> Delete Bank Entry
          </button>
        </div>
      </div>
    </div>
  );
};
