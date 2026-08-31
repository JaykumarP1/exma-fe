import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, FileText } from 'lucide-react';


interface DeleteStatementModalProps {
  isOpen: boolean;
  filename: string;
  bankTitle?: string;
  expensesCount?: number;
  formattedAmount?: string;
  onClose: () => void;
  onConfirm: (deleteExpenses: boolean) => Promise<void> | void;
  loading?: boolean;
}

export const DeleteStatementModal: React.FC<DeleteStatementModalProps> = ({
  isOpen,
  filename,
  bankTitle,
  expensesCount = 0,
  formattedAmount = '$0.00',
  onClose,
  onConfirm,
  loading = false
}) => {
  const [deleteExpenses, setDeleteExpenses] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm(deleteExpenses);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'grid',
      placeItems: 'center',
      padding: '1rem',
      background: 'rgba(9, 13, 22, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: 'min(100%, 480px)',
        padding: '1.75rem',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                Delete Bank Statement?
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                This action will remove the statement record from your project.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{ color: 'var(--text-dim)', padding: '0.2rem', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Statement Info Card */}
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-glass)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <FileText size={24} style={{ color: '#818cf8', minWidth: '24px' }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {filename}
            </div>
            {bankTitle && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Bank Account: <strong style={{ color: '#e2e8f0' }}>{bankTitle}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Expenses Option Checkbox Box */}
        {expensesCount > 0 && (
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            background: deleteExpenses ? 'rgba(225, 29, 72, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            border: deleteExpenses ? '1px solid rgba(225, 29, 72, 0.3)' : '1px solid var(--border-glass)',
            marginBottom: '1.5rem',
            transition: 'all 0.2s ease'
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={deleteExpenses}
                onChange={(e) => setDeleteExpenses(e.target.checked)}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#e11d48', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: deleteExpenses ? '#fb7185' : '#f8fafc' }}>
                  Also delete {expensesCount} extracted expense record{expensesCount === 1 ? '' : 's'} ({formattedAmount})
                </span>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                  {deleteExpenses
                    ? 'All transaction expenses linked to this statement will be deleted from your reports.'
                    : 'Expenses extracted from this statement will remain in your reports without statement linkage.'}
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '0.65rem 1.15rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.06)',
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
            onClick={handleConfirm}
            disabled={loading}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: deleteExpenses ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: deleteExpenses ? '0 4px 14px rgba(225, 29, 72, 0.35)' : 'none',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={16} />
            {loading ? 'Deleting…' : deleteExpenses && expensesCount > 0 ? 'Delete Statement & Expenses' : 'Delete Statement Only'}
          </button>
        </div>
      </div>
    </div>
  );
};
