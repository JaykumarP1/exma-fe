import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle2,
  Clock,
  X,
  Calendar,
  AlertCircle,
  Trash2,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { Statement, StatementPaymentRecord } from '../types';
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
  const [currentStatement, setCurrentStatement] = useState<Statement | null>(statement);
  const [mode, setMode] = useState<'full' | 'partial' | 'unpaid'>('full');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (statement) {
      setCurrentStatement(statement);
      const totalDue = statement.total_due || statement.total_amount || 0;
      const paid = statement.amount_paid || (statement.payment_status === 'paid' ? totalDue : 0);
      const remaining = Math.max(0, totalDue - paid);

      if (remaining <= 0 && paid > 0) {
        setMode('full');
        setPaymentAmount(totalDue.toString());
      } else if (paid > 0) {
        setMode('partial');
        setPaymentAmount(remaining.toString());
      } else {
        setMode('full');
        setPaymentAmount(totalDue.toString());
      }

      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentNote('');
      setError(null);
    }
  }, [statement]);

  if (!isOpen || !currentStatement) return null;

  const totalAmountDue = currentStatement.total_due || currentStatement.total_amount || 0;
  const isZeroDue = totalAmountDue <= 0;
  const isStatementPaid = currentStatement.payment_status === 'paid' || (isZeroDue ? currentStatement.payment_status !== 'unpaid' : false);
  const amountPaid = currentStatement.amount_paid || (isStatementPaid && (!currentStatement.payment_history || currentStatement.payment_history.length === 0) ? (isZeroDue ? 0 : totalAmountDue) : 0);
  const remainingDue = isZeroDue ? 0 : Math.max(0, Number((totalAmountDue - amountPaid).toFixed(2)));
  const paidPercent = isZeroDue ? 100 : (totalAmountDue > 0 ? Math.min(100, Math.max(0, Math.round((amountPaid / totalAmountDue) * 100))) : 0);
  const paymentHistory: StatementPaymentRecord[] = currentStatement.payment_history || [];

  const handleRecordPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      let parsedAmount = 0;
      if (isZeroDue) {
        parsedAmount = 0;
      } else {
        parsedAmount = mode === 'full' ? remainingDue : parseFloat(paymentAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          setError('Please enter a payment amount greater than zero.');
          setLoading(false);
          return;
        }
      }

      const res = await api.recordStatementPayment(currentStatement.id, {
        amount: parsedAmount,
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
        note: paymentNote.trim() || (isZeroDue ? 'Zero due - No payment needed' : mode === 'full' ? 'Full payment' : 'Partial payment')
      });

      setCurrentStatement(res.statement);
      onUpdated(res.statement);
      setPaymentNote('');

      const newRemaining = isZeroDue ? 0 : Math.max(0, Number((totalAmountDue - (res.statement.amount_paid || 0)).toFixed(2)));
      setPaymentAmount(newRemaining > 0 ? newRemaining.toString() : '');
      if (newRemaining <= 0) {
        setMode('full');
      }
    } catch (err: any) {
      console.error('Failed to record payment', err);
      setError(err?.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUnpaid = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.updateStatement(currentStatement.id, {
        payment_status: 'unpaid',
        payment_date: null,
        amount_paid: 0,
        payment_history: []
      });

      setCurrentStatement(res.statement);
      onUpdated(res.statement);
      setPaymentAmount((res.statement.total_due || res.statement.total_amount || 0).toString());
      setMode('full');
    } catch (err: any) {
      console.error('Failed to reset payment', err);
      setError(err?.message || 'Failed to mark statement as unpaid');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      setDeletingPaymentId(paymentId);
      setError(null);

      const res = await api.deleteStatementPayment(currentStatement.id, paymentId);
      setCurrentStatement(res.statement);
      onUpdated(res.statement);

      const newRemaining = Math.max(0, Number((totalAmountDue - (res.statement.amount_paid || 0)).toFixed(2)));
      setPaymentAmount(newRemaining > 0 ? newRemaining.toString() : '');
    } catch (err: any) {
      console.error('Failed to delete payment entry', err);
      setError(err?.message || 'Failed to delete payment entry');
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const statementTitle = currentStatement.statement_month_year || currentStatement.filename;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        background: 'rgba(9, 13, 22, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: 'min(100%, 540px)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
          overflowY: 'auto'
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
                Track full or partial payments & review payment history
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

        {/* Statement Overview & Financial Breakdown Card */}
        <div
          style={{
            padding: '1.1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ minWidth: 0, flex: 1, marginRight: '1rem' }}>
              <div
                style={{
                  fontSize: '0.92rem',
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
                Bank: <strong style={{ color: '#e2e8f0' }}>{currentStatement.bank_name || currentStatement.bank_title}</strong>
                {currentStatement.due_date && <span> • Due: {currentStatement.due_date}</span>}
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              {isZeroDue ? (
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <CheckCircle2 size={11} /> {isStatementPaid ? 'Paid (Zero Due)' : 'No Payment Needed'}
                </span>
              ) : remainingDue <= 0 ? (
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <CheckCircle2 size={11} /> Fully Paid
                </span>
              ) : amountPaid > 0 ? (
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Receipt size={11} /> Partial Pay ({paidPercent}%)
                </span>
              ) : (
                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(148, 163, 184, 0.12)',
                    color: '#94a3b8',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Clock size={11} /> Unpaid
                </span>
              )}
            </div>
          </div>

          {/* 3 Metrics: Total Due, Paid So Far, Remaining */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.65rem',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              textAlign: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Due
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                {formatCurrency(totalAmountDue, currency)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Paid So Far
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: '0.15rem' }}>
                {formatCurrency(amountPaid, currency)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Remaining Due
              </div>
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: (isZeroDue || remainingDue <= 0) ? '#34d399' : '#f59e0b',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '0.15rem'
                }}
              >
                {formatCurrency(remainingDue, currency)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
              <span>Payment Progress</span>
              <span style={{ fontWeight: 700, color: (isZeroDue || remainingDue <= 0) ? '#34d399' : '#38bdf8' }}>
                {isZeroDue ? '100% (No Due)' : `${paidPercent}% Paid`}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${paidPercent}%`,
                  height: '100%',
                  background: remainingDue <= 0 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #6366f1, #38bdf8)',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Error message */}
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
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Payment Action Selector */}
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
            Payment Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => {
                setMode('full');
                setPaymentAmount(remainingDue > 0 ? remainingDue.toString() : totalAmountDue.toString());
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: mode === 'full' ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid var(--border-glass)',
                background: mode === 'full' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                color: mode === 'full' ? '#34d399' : 'var(--text-dim)',
                boxShadow: mode === 'full' ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <CheckCircle2 size={15} />
              {isZeroDue ? 'Zero Due Pay' : 'Full Pay'}
            </button>

            <button
              type="button"
              disabled={isZeroDue}
              onClick={() => {
                if (isZeroDue) return;
                setMode('partial');
                if (!paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > remainingDue) {
                  setPaymentAmount(remainingDue > 0 ? (remainingDue / 2).toFixed(2) : '1000');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                cursor: isZeroDue ? 'not-allowed' : 'pointer',
                opacity: isZeroDue ? 0.4 : 1,
                fontSize: '0.82rem',
                fontWeight: 700,
                border: mode === 'partial' ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid var(--border-glass)',
                background: mode === 'partial' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                color: mode === 'partial' ? '#38bdf8' : 'var(--text-dim)',
                boxShadow: mode === 'partial' ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Receipt size={15} />
              Partial Pay
            </button>

            <button
              type="button"
              onClick={() => setMode('unpaid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.65rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: mode === 'unpaid' ? '1px solid rgba(148, 163, 184, 0.6)' : '1px solid var(--border-glass)',
                background: mode === 'unpaid' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                color: mode === 'unpaid' ? '#f8fafc' : 'var(--text-dim)',
                transition: 'all 0.2s ease'
              }}
            >
              <RotateCcw size={14} />
              Mark Unpaid
            </button>
          </div>
        </div>

        {/* Mode-specific Form */}
        {mode === 'unpaid' ? (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>Reset statement to Unpaid</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              This will clear recorded payments and mark the statement status as unpaid.
            </p>
            <button
              type="button"
              onClick={handleMarkAsUnpaid}
              disabled={loading}
              style={{
                marginTop: '0.75rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#fbbf24',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {loading ? 'Resetting…' : 'Confirm Reset to Unpaid'}
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: '1.1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-glass)',
              marginBottom: '1.25rem'
            }}
          >
            {/* Amount Input */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isZeroDue ? 'Payment Amount (Zero Due)' : mode === 'full' ? 'Payment Amount (Full Due)' : 'Partial Payment Amount'}
                </label>
                {!isZeroDue && mode === 'partial' && (
                  <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                    Max: {formatCurrency(remainingDue, currency)}
                  </span>
                )}
              </div>

              {isZeroDue ? (
                <div
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#34d399',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>Statement balance is {formatCurrency(0, currency)}. No payment is required. You can mark it as paid below.</span>
                </div>
              ) : (
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      color: 'var(--text-dim)',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {currency === 'INR' ? '₹' : '$'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max={totalAmountDue}
                    disabled={mode === 'full'}
                    value={mode === 'full' ? remainingDue : paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                      borderRadius: 'var(--radius-sm)',
                      background: mode === 'full' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-glass)',
                      color: '#f8fafc',
                      fontSize: '1rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Quick Fill Chips for Partial Pay */}
            {!isZeroDue && mode === 'partial' && remainingDue > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {currentStatement.minimum_amount && currentStatement.minimum_amount > 0 && currentStatement.minimum_amount < remainingDue && (
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(currentStatement.minimum_amount!.toString())}
                      style={{
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-glass)',
                        color: '#f8fafc',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      Min Due ({formatCurrency(currentStatement.minimum_amount, currency)})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPaymentAmount((remainingDue * 0.5).toFixed(2))}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-glass)',
                      color: '#f8fafc',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                  >
                    50% ({formatCurrency(remainingDue * 0.5, currency)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(remainingDue.toString())}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Remaining ({formatCurrency(remainingDue, currency)})
                  </button>
                </div>
              )}

            {/* Payment Date & Note row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-dim)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Calendar size={12} style={{ color: '#38bdf8' }} /> Date
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaymentDate(new Date().toISOString().split('T')[0])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Today
                  </button>
                </div>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: '#f8fafc',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.35rem'
                  }}
                >
                  Note / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI / NetBanking"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: '#f8fafc',
                    fontSize: '0.84rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Record Payment Button */}
            <button
              type="button"
              onClick={handleRecordPayment}
              disabled={loading || (!isZeroDue && mode === 'full' && remainingDue <= 0) || (isZeroDue && isStatementPaid && paymentHistory.length > 0)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: (isZeroDue || mode === 'full')
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: (isZeroDue || mode === 'full') ? '0 4px 14px rgba(16, 185, 129, 0.35)' : '0 4px 14px rgba(59, 130, 246, 0.35)',
                cursor: loading || (!isZeroDue && mode === 'full' && remainingDue <= 0) || (isZeroDue && isStatementPaid && paymentHistory.length > 0) ? 'not-allowed' : 'pointer',
                opacity: (!isZeroDue && mode === 'full' && remainingDue <= 0) || (isZeroDue && isStatementPaid && paymentHistory.length > 0) ? 0.7 : 1
              }}
            >
              <CheckCircle2 size={16} />
              {loading
                ? 'Recording…'
                : isZeroDue
                ? (isStatementPaid && paymentHistory.length > 0 ? '✓ Marked as Paid (Zero Due)' : 'Mark as Paid (Zero Due)')
                : mode === 'full'
                ? remainingDue <= 0
                  ? 'Already Fully Paid'
                  : `Record Full Payment (${formatCurrency(remainingDue, currency)})`
                : `Record Partial Payment (${formatCurrency(Number(paymentAmount) || 0, currency)})`}
            </button>
          </div>
        )}

        {/* Payment History List */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
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
              <Receipt size={13} style={{ color: '#38bdf8' }} />
              Payment History ({paymentHistory.length})
            </label>
          </div>

          {paymentHistory.length === 0 ? (
            <div
              style={{
                padding: '1.25rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-glass)',
                textAlign: 'center',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}
            >
              No individual payment records yet. Choose Full Pay or Partial Pay above to record payments.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '180px', overflowY: 'auto' }}>
              {paymentHistory.map((item, idx) => (
                <div
                  key={item.id || `pay-${idx}`}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#34d399',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <CheckCircle2 size={15} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                        +{formatCurrency(item.amount, currency)}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{item.payment_date}</span>
                        {item.note && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#cbd5e1' }}>{item.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePayment(item.id)}
                    disabled={deletingPaymentId === item.id}
                    title="Remove this payment entry"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer / Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
