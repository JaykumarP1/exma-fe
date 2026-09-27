import React from 'react';
import {
  Mail,
  X,
  Calendar,
  Building2,
  CreditCard,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Eye,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Inbox,
  User
} from 'lucide-react';
import { Statement } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDateTime, formatDate } from '../utils/dateUtils';

interface EmailStatementDetailModalProps {
  isOpen: boolean;
  statement: Statement | null;
  currency?: string;
  onClose: () => void;
  onViewPdf?: (statement: Statement) => void;
  onExtract?: (statement: Statement) => void;
  onUnlock?: (statement: Statement) => void;
}

export const EmailStatementDetailModal: React.FC<EmailStatementDetailModalProps> = ({
  isOpen,
  statement,
  currency = 'USD',
  onClose,
  onViewPdf,
  onExtract,
  onUnlock
}) => {
  if (!isOpen || !statement) return null;

  const email = statement.email_details;
  const isEmailSource = statement.source === 'email' || Boolean(statement.source_email) || Boolean(email);
  const isLocked = statement.status === 'locked' || (!statement.is_unlocked && statement.filename?.toLowerCase().endsWith('.pdf') && statement.expenses_count === 0 && email?.status === 'locked');

  const cardLabel = statement.card_name 
    ? `${statement.card_name} ${statement.card_masked_number ? `(${statement.card_masked_number})` : ''}`
    : (statement.card_last_four || statement.detected_card_last_four)
      ? `Card ending in ${statement.card_last_four || statement.detected_card_last_four}`
      : 'Card not detected';

  const bankLabel = statement.bank_name || statement.bank_title || email?.bank_name || 'Bank not detected';
  const statementPeriod = statement.statement_month_year || 'Period not detected';
  const totalAmountDue = statement.total_due || statement.total_amount || email?.total_amount || 0;
  const expensesCount = statement.expenses_count ?? email?.expenses_count ?? 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        display: 'grid',
        placeItems: 'center',
        padding: '1rem',
        background: 'rgba(9, 13, 22, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: 'min(100%, 640px)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: isEmailSource ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                border: `1px solid ${isEmailSource ? 'rgba(56, 189, 248, 0.35)' : 'rgba(168, 85, 247, 0.35)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isEmailSource ? '#38bdf8' : '#c084fc',
                flexShrink: 0
              }}
            >
              <Mail size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Email Statement Extraction
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    background: isEmailSource ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: isEmailSource ? '#38bdf8' : 'var(--text-muted)',
                    border: `1px solid ${isEmailSource ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`
                  }}
                >
                  {isEmailSource ? 'Email Extracted' : 'Uploaded'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', margin: 0 }}>
                Details of email transmission and what the statement was parsed as
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              color: 'var(--text-dim)',
              padding: '0.35rem',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Email Transmission & Origin */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Inbox size={14} style={{ color: '#38bdf8' }} /> Email Transmission Details
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.9rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}
          >
            {/* Subject */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Email Subject</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', wordBreak: 'break-word' }}>
                {email?.subject || (isEmailSource ? 'Automated Statement Notification' : 'Manual File Upload')}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              {/* From / Sender */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <User size={12} /> Extracted From
                </span>
                <span style={{ fontSize: '0.82rem', color: '#e2e8f0', wordBreak: 'break-word' }}>
                  {email?.from || (isEmailSource ? 'Bank Statement Dispatcher' : 'Direct User Upload')}
                </span>
              </div>

              {/* Received Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Clock size={12} /> Received / Synced At
                </span>
                <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                  {email?.date ? formatDateTime(email.date) : formatDateTime(statement.uploaded_at || statement.created_at)}
                </span>
              </div>

              {/* Synced Account / Inbox */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Mail size={12} /> Synced Inbox
                </span>
                <span style={{ fontSize: '0.82rem', color: '#38bdf8', wordBreak: 'break-word' }}>
                  {statement.source_email || email?.account_email || statement.email_name || 'System'}
                </span>
              </div>

              {/* Original File */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FileText size={12} /> Attachment Filename
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                  {statement.filename}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Extracted Statement Content ("What it was extracted as") */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Sparkles size={14} style={{ color: '#a78bfa' }} /> Extracted Statement Content
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem'
            }}
          >
            {/* Extracted Bank */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
                <Building2 size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bank Detected</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  {bankLabel}
                </span>
              </div>
            </div>

            {/* Extracted Card */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.1)', color: '#c084fc' }}>
                <CreditCard size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Card Identified</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  {cardLabel}
                </span>
              </div>
            </div>

            {/* Billing Period */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
                <Calendar size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Billing Period</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  {statementPeriod}
                </span>
              </div>
            </div>

            {/* Due Date */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>
                <Clock size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Payment Due Date</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: statement.due_date ? '#f43f5e' : 'var(--text-dim)' }}>
                  {statement.due_date ? formatDate(statement.due_date) : (email?.due_date ? formatDate(email.due_date) : 'Not extracted')}
                </span>
              </div>
            </div>

            {/* Total Amount Due */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                <DollarSign size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Amount Due</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>
                  {formatCurrency(totalAmountDue, currency)}
                </span>
              </div>
            </div>

            {/* Extracted Expenses Count */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(129, 140, 248, 0.1)', color: '#818cf8' }}>
                <FileText size={16} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Extracted Line Items</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                  {expensesCount} {expensesCount === 1 ? 'transaction' : 'transactions'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Summary Totals & Security Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {/* Credit & Debit Totals */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Credit & Debit Breakdown</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#34d399' }}>
                <ArrowDownLeft size={13} />
                <span>CR: {formatCurrency(statement.total_credit || 0, currency)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f43f5e' }}>
                <ArrowUpRight size={13} />
                <span>DR: {formatCurrency(statement.total_debit || 0, currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Payment Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {statement.payment_status === 'paid' ? (
                <>
                  <CheckCircle2 size={14} style={{ color: '#34d399' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399' }}>Paid</span>
                  {statement.payment_date && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      on {formatDate(statement.payment_date)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle size={14} style={{ color: '#fbbf24' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fbbf24' }}>Unpaid</span>
                </>
              )}
            </div>
          </div>

          {/* File Encryption / Security */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Document Security</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {isLocked ? (
                <>
                  <Lock size={14} style={{ color: '#f43f5e' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f43f5e' }}>Password Protected</span>
                </>
              ) : (
                <>
                  <Unlock size={14} style={{ color: '#34d399' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399' }}>Decrypted & Accessible</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Sync Extractor Note / Status Message */}
        {email?.note && (
          <div
            style={{
              background: isLocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.08)',
              border: `1px solid ${isLocked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.2)'}`,
              borderRadius: '10px',
              padding: '0.75rem 0.9rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem'
            }}
          >
            <AlertCircle size={16} style={{ color: isLocked ? '#f87171' : '#38bdf8', flexShrink: 0, marginTop: '0.1rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isLocked ? '#fca5a5' : '#7dd3fc' }}>
                Extraction Sync Note
              </span>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                {email.note}
              </span>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            marginTop: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isLocked && onUnlock && (
              <button
                className="btn-primary"
                onClick={() => {
                  onClose();
                  onUnlock(statement);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.9rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                }}
              >
                <Unlock size={14} /> Unlock Statement
              </button>
            )}

            {onViewPdf && (
              <button
                className="btn-secondary"
                onClick={() => {
                  onClose();
                  onViewPdf(statement);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.9rem'
                }}
              >
                <Eye size={14} /> Preview Statement
              </button>
            )}

            {onExtract && !isLocked && (
              <button
                className="btn-secondary"
                onClick={() => {
                  onClose();
                  onExtract(statement);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.9rem',
                  color: '#a78bfa'
                }}
              >
                <Sparkles size={14} /> Re-extract
              </button>
            )}
          </div>

          <button
            className="btn-secondary"
            onClick={onClose}
            style={{
              fontSize: '0.8rem',
              padding: '0.45rem 1rem'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
