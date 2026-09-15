import React, { useState } from 'react';
import { X, Mail, FileText, CheckCircle2, AlertCircle, Clock, Paperclip, Building2, Code, Copy, Check, SlidersHorizontal } from 'lucide-react';
import { EmailSyncLog, DownloadedStatementItem } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { Badge } from './ui';

interface StatementSyncDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncLog: EmailSyncLog | null;
}

export const StatementSyncDetailsModal: React.FC<StatementSyncDetailsModalProps> = ({
  isOpen,
  onClose,
  syncLog
}) => {
  if (!isOpen || !syncLog) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'json'>('overview');
  const [copied, setCopied] = useState(false);

  // Extract all downloaded statements
  const downloadedStatements: DownloadedStatementItem[] =
    syncLog.downloaded_statements && syncLog.downloaded_statements.length > 0
      ? syncLog.downloaded_statements
      : (syncLog.details || []).flatMap((d) => {
          if (d.downloaded_statements && d.downloaded_statements.length > 0) {
            return d.downloaded_statements;
          }
          return (d.attachments || []).map((att) => ({
            filename: att,
            email_subject: d.subject,
            from: d.from,
            date: d.date
          }));
        });

  // Resolve sync parameters sent for this execution
  const syncParams = syncLog.sync_params || {
    limit: syncLog.emails_scanned || 100,
    keywords: 'credit card statement',
    date_period: 'Last 6 Months',
    full_scan: false,
    has_pdf_password: false,
    manual_sync: true
  };

  // Prepare full fetched JSON payload recorded during this sync
  const fetchedJsonData = {
    sync_id: syncLog.id,
    email: syncLog.email,
    status: syncLog.status,
    started_at: syncLog.started_at,
    completed_at: syncLog.completed_at,
    duration_seconds: syncLog.duration_seconds,
    emails_scanned: syncLog.emails_scanned,
    attachments_found: syncLog.attachments_found,
    statements_created: syncLog.statements_created,
    expenses_created: syncLog.expenses_created,
    error_message: syncLog.error_message || null,
    sync_parameters_sent: syncParams,
    downloaded_statements: downloadedStatements,
    candidate_messages: syncLog.details || []
  };

  const jsonString = JSON.stringify(fetchedJsonData, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="success" size="sm" icon={<CheckCircle2 size={11} />}>
            Success
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="info" size="sm" icon={<Clock size={11} />}>
            In Progress
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger" size="sm" icon={<AlertCircle size={11} />}>
            Failed
          </Badge>
        );
      default:
        return <Badge variant="warning" size="sm">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch',
        zIndex: 1100
      }}
      onClick={onClose}
    >
      <div
        className="animate-slide-in-right"
        style={{
          width: '100%',
          maxWidth: '680px',
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          background: 'linear-gradient(180deg, #0b1329 0%, #0f172a 100%)',
          borderLeft: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '-16px 0 48px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-glass)',
            paddingBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.25))',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Mail size={22} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#f8fafc',
                    margin: 0
                  }}
                >
                  Statement Sync Details
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    color: 'var(--text-dim)'
                  }}
                >
                  Sync #{syncLog.id}
                </span>
              </div>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem',
                  margin: 0
                }}
              >
                Account:{' '}
                <strong style={{ color: '#38bdf8' }}>{syncLog.email || 'Email Account'}</strong>
                {syncLog.completed_at && (
                  <span>
                    {' '}
                    • Synced {formatDateTime(syncLog.completed_at)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.45rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.85rem'
          }}
        >
          <div
            style={{
              gridColumn: 'span 2',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Status
            </div>
            <div style={{ marginTop: '0.2rem' }}>{getStatusBadge(syncLog.status)}</div>
          </div>

          <div
            style={{
              gridColumn: 'span 2',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: '0.65rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Downloaded
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {syncLog.statements_created} Statements
            </div>
          </div>

          <div
            style={{
              gridColumn: 'span 2',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(52, 211, 153, 0.08)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: '0.65rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Expenses
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {syncLog.expenses_created} Extracted
            </div>
          </div>

          <div
            style={{
              gridColumn: 'span 3',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Scanned / Attachments
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {syncLog.emails_scanned} msgs • {syncLog.attachments_found} atts
            </div>
          </div>

          <div
            style={{
              gridColumn: 'span 3',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Duration
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {syncLog.duration_seconds != null ? `${syncLog.duration_seconds}s` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Sync Parameters Sent Banner */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <SlidersHorizontal size={13} /> Sync Parameters Sent
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Filters & parameters dispatched for this email scan
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Scan Limit:</span>
              <strong style={{ color: '#f8fafc' }}>{syncParams.limit || syncLog.emails_scanned || 100} emails</strong>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Keywords:</span>
              <strong style={{ color: '#38bdf8' }}>{syncParams.keywords || 'credit card statement'}</strong>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Date Period:</span>
              <strong style={{ color: '#c084fc' }}>{syncParams.date_period || (syncParams.days ? `Last ${syncParams.days} Days` : 'Last 6 Months')}</strong>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>PDF Decrypt:</span>
              <strong style={{ color: syncParams.has_pdf_password ? '#34d399' : 'var(--text-muted)' }}>
                {syncParams.has_pdf_password ? 'Password Configured' : 'None'}
              </strong>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Mode:</span>
              <strong style={{ color: '#818cf8' }}>{syncParams.manual_sync ? 'Manual Run' : 'Scheduled Sweep'}</strong>
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {syncLog.error_message && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            <AlertCircle size={16} />
            <div>
              <strong>Sync Warning / Error:</strong> {syncLog.error_message}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-glass)',
            paddingBottom: '0.65rem',
            marginBottom: '1rem',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                background: activeTab === 'overview' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: activeTab === 'overview' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                color: activeTab === 'overview' ? '#38bdf8' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <FileText size={14} />
              <span>Statements & Activity</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('json')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '6px',
                background: activeTab === 'json' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: activeTab === 'json' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                color: activeTab === 'json' ? '#38bdf8' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Code size={14} />
              <span>Fetched JSON Payload</span>
            </button>
          </div>

          {activeTab === 'json' && (
            <button
              type="button"
              onClick={handleCopyJson}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                background: copied ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                border: copied ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border-glass)',
                color: copied ? '#34d399' : 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          )}
        </div>

        {activeTab === 'json' ? (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              paddingRight: '0.25rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.75rem',
                color: 'var(--text-dim)'
              }}
            >
              <span>Raw JSON response & candidate payload recorded during this sync</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {(new TextEncoder().encode(jsonString).length / 1024).toFixed(1)} KB
              </span>
            </div>

            <pre
              style={{
                flex: 1,
                margin: 0,
                padding: '1.25rem',
                borderRadius: '8px',
                background: '#070d1e',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.55,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)'
              }}
            >
              <code>{jsonString}</code>
            </pre>
          </div>
        ) : (
          /* Scrollable Statements Section */
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              paddingRight: '0.25rem'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.65rem'
                }}
              >
                <h4
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#f8fafc',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <FileText size={16} style={{ color: '#38bdf8' }} />
                  Downloaded Bank Statements ({downloadedStatements.length})
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Statements automatically retrieved from email inbox
                </span>
              </div>

              {downloadedStatements.length === 0 ? (
                <div
                  style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-muted)'
                  }}
                >
                  <FileText size={32} style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>No statement files were downloaded in this sync run.</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Scanned emails did not contain new statement attachments matching configured filters.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {downloadedStatements.map((stmt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-glass)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#38bdf8'
                            }}
                          >
                            <FileText size={15} />
                          </span>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                              {stmt.filename}
                            </div>
                            {stmt.bank_name && (
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  color: '#38bdf8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  marginTop: '0.1rem'
                                }}
                              >
                                <Building2 size={12} /> {stmt.bank_name}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {stmt.file_type && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                background: 'rgba(255, 255, 255, 0.08)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                color: 'var(--text-muted)'
                              }}
                            >
                              {stmt.file_type}
                            </span>
                          )}
                          {stmt.expenses_count != null && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'rgba(52, 211, 153, 0.15)',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                color: '#34d399'
                              }}
                            >
                              {stmt.expenses_count} expenses extracted
                            </span>
                          )}
                          {stmt.total_amount != null && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                color: '#f8fafc',
                                fontFamily: 'var(--font-mono)'
                              }}
                            >
                              Total: ${Number(stmt.total_amount).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Email Origin Info */}
                      {(stmt.email_subject || stmt.from || stmt.date) && (
                        <div
                          style={{
                            padding: '0.45rem 0.65rem',
                            borderRadius: '4px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                          }}
                        >
                          {stmt.email_subject && (
                            <div>
                              Subject: <strong style={{ color: 'var(--text-main)' }}>{stmt.email_subject}</strong>
                            </div>
                          )}
                          {stmt.from && (
                            <div>
                              From: <strong style={{ color: 'var(--text-main)' }}>{stmt.from}</strong>
                            </div>
                          )}
                          {stmt.date && (
                            <div>
                              Date: <strong style={{ color: 'var(--text-main)' }}>{formatDateTime(stmt.date)}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email Activity Details if available */}
            {syncLog.details && syncLog.details.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <h4
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Paperclip size={14} />
                  Candidate Messages Processed ({syncLog.details.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {syncLog.details.map((detail, dIdx) => (
                    <div
                      key={dIdx}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-xs)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                          {detail.subject || 'No Subject'}
                        </span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                          {detail.date ? formatDateTime(detail.date) : ''}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        From: {detail.from || 'Unknown sender'}
                      </div>
                      {detail.attachments && detail.attachments.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>Attachments:</span>
                          {detail.attachments.map((att, aIdx) => (
                            <span
                              key={aIdx}
                              style={{
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                color: '#38bdf8',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '3px',
                                fontSize: '0.68rem',
                                fontWeight: 600
                              }}
                            >
                              📄 {att}
                            </span>
                          ))}
                        </div>
                      )}
                      {detail.error && (
                        <div style={{ color: '#f87171', fontSize: '0.7rem', marginTop: '0.15rem' }}>
                          Error: {detail.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick button to view JSON at bottom */}
            <div style={{ marginTop: '0.75rem', textAlign: 'center', paddingBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '6px',
                  padding: '0.45rem 0.85rem',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Code size={14} />
                <span>View Full Fetched JSON Payload</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-glass)',
              color: '#f8fafc',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
