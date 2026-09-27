import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, Clock, X, Calendar, AlertCircle } from 'lucide-react';
import { Statement } from '../types';
import { formatCurrency } from '../utils/currency';
import * as api from '../services/api';

interface UpdatePaymentModalProps {
  isOpen: boolean;
  statement: Statement | null;
  currency?: string;
  onClose: () => void;
  onUpdated: (updatedStatement: Statement) => void;
}

export const UpdatePaymentModal: React.FC<UpdatePaymentModalProps> = ({
  isOpen,
  statement,
  currency = 'USD',
  onClose,
  onUpdated
}) => {
  const [status, setStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (statement) {
      const isPaid = statement.payment_status === 'paid' || Boolean(statement.payment_date);
      setStatus(isPaid ? 'paid' : 'unpaid');
      if (statement.payment_date) {
        setPaymentDate(statement.payment_date.slice(0, 10));
      } else if (isPaid) {
        setPaymentDate(new Date().toISOString().split('T')[0]);
      } else {
        setPaymentDate('');
      }
      setError(null);
    }
  }, [statement]);

  if (!isOpen || !statement) return null;

  const handleStatusChange = (newStatus: 'paid' | 'unpaid') => {
    setStatus(newStatus);
    if (newStatus === 'paid' && !paymentDate) {
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        payment_status: status,
        payment_date: status === 'paid' ? (paymentDate || new Date().toISOString().split('T')[0]) : null
      };

      const res = await api.updateStatement(statement.id, payload);
      onUpdated(res.statement);
      onClose();
    } catch (err: any) {
      console.error('Failed to update statement payment', err);
      setError(err?.message || 'Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  const statementTitle = statement.statement_month_year || statement.filename;
  const totalAmountDue = statement.total_due || statement.total_amount || 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        background: 'rgba(9, 13, 22, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: 'min(100%, 460px)',
          padding: '1.75rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <DollarSign size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>Payment Details</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Update statement payment status and date
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{ color: 'var(--text-dim)', padding: '0.2rem', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Statement Details Card */}
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ minWidth: 0, flex: 1, marginRight: '1rem' }}>
            <div
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {statementTitle}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Bank: <strong style={{ color: '#e2e8f0' }}>{statement.bank_name || statement.bank_title}</strong>
              {statement.due_date && <span> • Due: {statement.due_date}</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Due</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalAmountDue, currency)}
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Status Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}
          >
            Payment Status
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => handleStatusChange('paid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 700,
                border: status === 'paid' ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid var(--border-glass)',
                background: status === 'paid' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                color: status === 'paid' ? '#34d399' : 'var(--text-dim)',
                boxShadow: status === 'paid' ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <CheckCircle2 size={18} />
              Paid
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('unpaid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 700,
                border: status === 'unpaid' ? '1px solid rgba(148, 163, 184, 0.5)' : '1px solid var(--border-glass)',
                background: status === 'unpaid' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: status === 'unpaid' ? '#f8fafc' : 'var(--text-dim)',
                transition: 'all 0.2s ease'
              }}
            >
              <Clock size={18} />
              Unpaid
            </button>
          </div>
        </div>

        {/* Payment Date Input (Shown when Paid) */}
        {status === 'paid' ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Calendar size={13} style={{ color: '#38bdf8' }} />
                Payment Date
              </label>
              <button
                type="button"
                onClick={() => setPaymentDate(new Date().toISOString().split('T')[0])}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Set to Today
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-glass)',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--border-glass)',
              marginBottom: '1.5rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Clock size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <span>Marking as unpaid will clear any recorded payment date for this statement.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
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
            type="button"
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '0.65rem 1.35rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={16} />
            {loading ? 'Saving…' : 'Save Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};
