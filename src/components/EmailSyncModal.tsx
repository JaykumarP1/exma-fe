import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Mail,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  HelpCircle,
  X,
  Search,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { EmailAccount, EmailSyncLog, Project } from '../types';
import * as api from '../services/api';
import { Select } from './ui/Select';

interface EmailSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSyncComplete?: () => void;
}

export const EmailSyncModal: React.FC<EmailSyncModalProps> = ({
  isOpen,
  onClose,
  projects,
  onSyncComplete
}) => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [recentLogs, setRecentLogs] = useState<EmailSyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'add'>('list');

  // New account form state
  const [provider, setProvider] = useState<'gmail_imap' | 'outlook_imap' | 'custom_imap'>('gmail_imap');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [imapHost, setImapHost] = useState('imap.gmail.com');
  const [imapPort, setImapPort] = useState(993);
  const [useSsl, setUseSsl] = useState(true);
  const [projectId, setProjectId] = useState<string>('');
  const [defaultPdfPassword, setDefaultPdfPassword] = useState('');
  const [searchKeywords, setSearchKeywords] = useState('statement, e-statement, credit card, account statement');
  const [autoSync, setAutoSync] = useState(true);

  // Status & action states
  const [submitting, setSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [expandedSyncId, setExpandedSyncId] = useState<number | null>(null);
  const [accountLimits, setAccountLimits] = useState<Record<number, string>>({});
  const [accountPeriods, setAccountPeriods] = useState<Record<number, string>>({});
  const [accountKeywords, setAccountKeywords] = useState<Record<number, string>>({});
  const [accountPdfPasswords, setAccountPdfPasswords] = useState<Record<number, string>>({});
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const scanLimitOptions = [
    { value: '30', label: '30 emails' },
    { value: '50', label: '50 emails' },
    { value: '100', label: '100 emails' },
    { value: '250', label: '250 emails' },
    { value: '500', label: '500 emails' },
    { value: '1000', label: '1,000 emails' }
  ];

  const datePeriodOptions = [
    { value: '30', label: 'Last 30 Days' },
    { value: '60', label: 'Last 60 Days' },
    { value: '90', label: 'Last 90 Days' },
    { value: '180', label: 'Last 6 Months' },
    { value: '365', label: 'Last 1 Year' },
    { value: '0', label: 'All Time' }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.fetchEmailAccounts();
      setAccounts(res.email_accounts || []);
      setRecentLogs(res.recent_logs || []);
      if ((res.email_accounts || []).length === 0) {
        setViewMode('add');
      } else {
        setViewMode('list');
      }
    } catch (err: any) {
      console.error('Failed to load email accounts:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load email accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleProviderSelect = (selected: 'gmail_imap' | 'outlook_imap' | 'custom_imap') => {
    setProvider(selected);
    if (selected === 'gmail_imap') {
      setImapHost('imap.gmail.com');
      setImapPort(993);
      setUseSsl(true);
    } else if (selected === 'outlook_imap') {
      setImapHost('outlook.office365.com');
      setImapPort(993);
      setUseSsl(true);
    } else {
      setImapHost('');
      setImapPort(993);
      setUseSsl(true);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        email: email.trim(),
        password: password.trim(),
        username: username.trim() || undefined,
        provider,
        imap_host: imapHost.trim(),
        imap_port: Number(imapPort),
        use_ssl: useSsl,
        project_id: projectId ? parseInt(projectId, 10) : undefined,
        default_pdf_password: defaultPdfPassword.trim() || undefined,
        search_keywords: searchKeywords.trim(),
        auto_sync: autoSync,
        test_first: true
      };

      const res = await api.createEmailAccount(payload);
      setStatusMessage({ type: 'success', text: res.message || 'Email account connected successfully!' });

      // Reset form
      setEmail('');
      setPassword('');
      setUsername('');
      setDefaultPdfPassword('');

      await loadData();
      setViewMode('list');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to connect email account. Please check credentials.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncAccount = async (account: EmailAccount) => {
    setSyncingId(account.id);
    setStatusMessage(null);

    const limitVal = parseInt(accountLimits[account.id] || '30', 10);
    const periodStr = accountPeriods[account.id] || '60';
    const daysVal = parseInt(periodStr, 10);
    const keywordsVal = accountKeywords[account.id] !== undefined
      ? accountKeywords[account.id]
      : (account.search_keywords || 'statement, e-statement, credit card');
    const pdfPasswordVal = accountPdfPasswords[account.id] !== undefined
      ? accountPdfPasswords[account.id]
      : (account.default_pdf_password || '');

    try {
      const res = await api.syncEmailAccount(account.id, {
        limit: limitVal,
        days: daysVal,
        keywords: keywordsVal,
        pdf_password: pdfPasswordVal
      });
      setStatusMessage({
        type: 'success',
        text: res.message || `Email sync completed (${limitVal} emails limit)!`
      });
      await loadData();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Email sync failed.' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleTestConnection = async (account: EmailAccount) => {
    setTestingId(account.id);
    setStatusMessage(null);

    try {
      const res = await api.testEmailAccountConnection(account.id);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message || 'Connection verified successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Connection failed.' });
      }
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Connection test failed.' });
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteAccount = async (account: EmailAccount) => {
    if (!window.confirm(`Disconnect email account ${account.email}?`)) return;

    try {
      await api.deleteEmailAccount(account.id);
      setStatusMessage({ type: 'success', text: 'Email account disconnected.' });
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to disconnect account.' });
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 8, 16, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'stretch'
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
          background: 'linear-gradient(180deg, #0b1329 0%, #0f172a 100%)',
          borderLeft: '1px solid var(--border-glass)',
          boxShadow: '-16px 0 48px rgba(0, 0, 0, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Mail size={20} style={{ color: '#34d399' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Email Statement Ingestion
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Pull bank and credit card statement emails automatically via SSL IMAP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* View Toggle Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-glass)',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0 1.5rem'
          }}
        >
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.75rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: viewMode === 'list' ? '#34d399' : 'var(--text-muted)',
              borderBottom: viewMode === 'list' ? '2px solid #10b981' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            Connected Accounts ({accounts.length})
          </button>

          <button
            onClick={() => setViewMode('add')}
            style={{
              padding: '0.75rem 1rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: viewMode === 'add' ? '#34d399' : 'var(--text-muted)',
              borderBottom: viewMode === 'add' ? '2px solid #10b981' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <Plus size={14} /> Connect New Email
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {statusMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: statusMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                color: statusMessage.type === 'success' ? '#34d399' : '#f87171'
              }}
            >
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span style={{ flex: 1 }}>{statusMessage.text}</span>
            </div>
          )}

          {viewMode === 'list' ? (
            <div>
              {loading && accounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading connected mailboxes...
                </div>
              ) : accounts.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    border: '1px dashed var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.01)'
                  }}
                >
                  <Mail size={36} style={{ color: 'var(--text-dim)', marginBottom: '0.75rem' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.35rem' }}>
                    No Email Accounts Connected
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem', maxWidth: '380px', margin: '0 auto 1.2rem' }}>
                    Connect your Gmail or Outlook to automatically fetch statement emails, extract attachments, and record expenses.
                  </p>
                  <button
                    onClick={() => setViewMode('add')}
                    style={{
                      padding: '0.55rem 1.1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Plus size={15} /> Connect Email Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-glass)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                              {acc.email}
                            </span>
                            <span
                              style={{
                                padding: '0.12rem 0.45rem',
                                borderRadius: '10px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background:
                                  acc.status === 'active'
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : acc.status === 'syncing'
                                    ? 'rgba(56, 189, 248, 0.15)'
                                    : 'rgba(244, 63, 94, 0.15)',
                                color:
                                  acc.status === 'active'
                                    ? '#34d399'
                                    : acc.status === 'syncing'
                                    ? '#38bdf8'
                                    : '#f87171',
                                border:
                                  acc.status === 'active'
                                    ? '1px solid rgba(16, 185, 129, 0.35)'
                                    : acc.status === 'syncing'
                                    ? '1px solid rgba(56, 189, 248, 0.35)'
                                    : '1px solid rgba(244, 63, 94, 0.35)'
                              }}
                            >
                              {acc.status}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>Host: <strong style={{ color: 'var(--text-main)' }}>{acc.imap_host}:{acc.imap_port}</strong></span>
                            {acc.project_title && (
                              <span>Bank: <strong style={{ color: '#38bdf8' }}>{acc.project_title}</strong></span>
                            )}
                            {acc.default_pdf_password && (
                              <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Lock size={11} /> Auto-Decrypt Enabled
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <div style={{ width: '120px' }}>
                            <Select
                              size="sm"
                              value={accountLimits[acc.id] || '30'}
                              onChange={(val) => setAccountLimits((prev) => ({ ...prev, [acc.id]: val }))}
                              options={scanLimitOptions}
                              disabled={syncingId === acc.id}
                            />
                          </div>

                          <button
                            onClick={() => handleSyncAccount(acc)}
                            disabled={syncingId === acc.id}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              color: '#34d399',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              cursor: syncingId === acc.id ? 'default' : 'pointer'
                            }}
                          >
                            <RefreshCw size={13} className={syncingId === acc.id ? 'animate-spin' : ''} />
                            {syncingId === acc.id ? 'Syncing...' : 'Sync Now'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedSyncId(expandedSyncId === acc.id ? null : acc.id)}
                            style={{
                              padding: '0.45rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              background: expandedSyncId === acc.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              border: expandedSyncId === acc.id ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-glass)',
                              color: expandedSyncId === acc.id ? '#38bdf8' : 'var(--text-muted)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              cursor: 'pointer'
                            }}
                            title="Configure search keywords, date period, and scan options"
                          >
                            <SlidersHorizontal size={13} />
                            <span>Options</span>
                            {expandedSyncId === acc.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>

                          <button
                            onClick={() => handleTestConnection(acc)}
                            disabled={testingId === acc.id}
                            style={{
                              padding: '0.45rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-glass)',
                              color: 'var(--text-main)',
                              fontSize: '0.78rem',
                              cursor: testingId === acc.id ? 'default' : 'pointer'
                            }}
                          >
                            {testingId === acc.id ? 'Testing...' : 'Test'}
                          </button>

                          <button
                            onClick={() => handleDeleteAccount(acc)}
                            style={{
                              padding: '0.45rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Custom Sync Parameters Drawer */}
                      {expandedSyncId === acc.id && (
                        <div
                          style={{
                            padding: '0.9rem 1rem',
                            marginTop: '0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <SlidersHorizontal size={13} /> Custom Sync Parameters
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Configure email filters before pulling statements
                            </span>
                          </div>

                          {/* Search Key / Keywords */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                              Search Key / Keywords (matches subject or sender):
                            </label>
                            <div style={{ position: 'relative' }}>
                              <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                              <input
                                type="text"
                                value={accountKeywords[acc.id] !== undefined ? accountKeywords[acc.id] : (acc.search_keywords || 'statement, e-statement, credit card')}
                                onChange={(e) => setAccountKeywords((prev) => ({ ...prev, [acc.id]: e.target.value }))}
                                placeholder="e.g. statement, credit card, hdfc, icici, bill"
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 0.65rem 0.45rem 2rem',
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  border: '1px solid var(--border-glass)',
                                  borderRadius: 'var(--radius-xs)',
                                  color: '#f8fafc',
                                  fontSize: '0.78rem'
                                }}
                              />
                            </div>
                          </div>

                          {/* Dropdowns Row: Date Period & Email Scan Limit */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                Date Period:
                              </label>
                              <Select
                                size="sm"
                                value={accountPeriods[acc.id] || '60'}
                                onChange={(val) => setAccountPeriods((prev) => ({ ...prev, [acc.id]: val }))}
                                options={datePeriodOptions}
                                disabled={syncingId === acc.id}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                Email Scan Limit:
                              </label>
                              <Select
                                size="sm"
                                value={accountLimits[acc.id] || '30'}
                                onChange={(val) => setAccountLimits((prev) => ({ ...prev, [acc.id]: val }))}
                                options={scanLimitOptions}
                                disabled={syncingId === acc.id}
                              />
                            </div>
                          </div>

                          {/* Statement PDF Password */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                              Statement PDF Password (optional auto-decrypt):
                            </label>
                            <div style={{ position: 'relative' }}>
                              <Lock size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                              <input
                                type={showPassword[acc.id] ? 'text' : 'password'}
                                value={accountPdfPasswords[acc.id] !== undefined ? accountPdfPasswords[acc.id] : (acc.default_pdf_password || '')}
                                onChange={(e) => setAccountPdfPasswords((prev) => ({ ...prev, [acc.id]: e.target.value }))}
                                placeholder="Enter password to auto-unlock encrypted statements"
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 2.2rem 0.45rem 2rem',
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  border: '1px solid var(--border-glass)',
                                  borderRadius: 'var(--radius-xs)',
                                  color: '#f8fafc',
                                  fontSize: '0.78rem'
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((prev) => ({ ...prev, [acc.id]: !prev[acc.id] }))}
                                style={{
                                  position: 'absolute',
                                  right: '0.5rem',
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
                                {showPassword[acc.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </div>
                          </div>

                          {/* Actions inside panel */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.2rem' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedSyncId(null)}
                              style={{
                                padding: '0.4rem 0.75rem',
                                borderRadius: 'var(--radius-xs)',
                                background: 'transparent',
                                border: '1px solid var(--border-glass)',
                                color: 'var(--text-muted)',
                                fontSize: '0.76rem',
                                cursor: 'pointer'
                              }}
                            >
                              Close
                            </button>

                            <button
                              type="button"
                              disabled={syncingId === acc.id}
                              onClick={() => handleSyncAccount(acc)}
                              style={{
                                padding: '0.45rem 0.95rem',
                                borderRadius: 'var(--radius-xs)',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: syncingId === acc.id ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                              }}
                            >
                              <RefreshCw size={13} className={syncingId === acc.id ? 'animate-spin' : ''} />
                              {syncingId === acc.id ? 'Syncing...' : 'Run Sync with Selected Options'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Stat summary pills */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '0.45rem 0.75rem',
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.72rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        <div>Statements Pulled: <strong style={{ color: '#f8fafc' }}>{acc.stats?.total_statements || 0}</strong></div>
                        <div>Expenses Extracted: <strong style={{ color: '#34d399' }}>{acc.stats?.total_expenses || 0}</strong></div>
                        <div style={{ marginLeft: 'auto' }}>
                          Last Synced: <strong style={{ color: 'var(--text-main)' }}>{acc.last_synced_at ? new Date(acc.last_synced_at).toLocaleString() : 'Never'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Sync History */}
              {recentLogs.length > 0 && (
                <div style={{ marginTop: '1.75rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                    Recent Pull Activity
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {recentLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-xs)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              background: log.status === 'success' ? '#34d399' : '#f87171'
                            }}
                          />
                          <span style={{ color: '#f8fafc', fontWeight: 600 }}>{log.email}</span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            • {log.statements_created} statements, {log.expenses_created} expenses
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                          {log.completed_at ? new Date(log.completed_at).toLocaleTimeString() : 'In progress'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Provider Selection */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
                  Select Email Provider
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { id: 'gmail_imap', title: 'Gmail / Google', desc: 'imap.gmail.com' },
                    { id: 'outlook_imap', title: 'Outlook / Office 365', desc: 'outlook.office365.com' },
                    { id: 'custom_imap', title: 'Custom IMAP', desc: 'Custom Host & Port' }
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleProviderSelect(p.id as any)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: provider === p.id ? '1px solid #10b981' : '1px solid var(--border-glass)',
                        background: provider === p.id ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: provider === p.id ? '#34d399' : '#f8fafc' }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {p.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {provider === 'gmail_imap' && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-xs)',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontSize: '0.75rem',
                    color: '#bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <HelpCircle size={15} style={{ flexShrink: 0, color: '#38bdf8' }} />
                  <span>
                    Gmail requires a <strong>Google App Password</strong> (16 characters) if 2-Step Verification is active.{' '}
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#38bdf8', textDecoration: 'underline' }}
                    >
                      Generate one here
                    </a>
                  </span>
                </div>
              )}

              {/* Email & Password Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="your-email@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-glass)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                    {provider === 'gmail_imap' ? 'Google App Password *' : 'IMAP Password *'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder={provider === 'gmail_imap' ? '16-char app password' : 'Enter mailbox password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-glass)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Custom Host & Port */}
              {provider === 'custom_imap' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                      IMAP Host *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="mail.yourdomain.com"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-glass)',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                      Port
                    </label>
                    <input
                      type="number"
                      required
                      value={imapPort}
                      onChange={(e) => setImapPort(parseInt(e.target.value, 10))}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-glass)',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Bank Assignment & Statement Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                    Assign to Bank (Optional)
                  </label>
                  <Select
                    value={projectId}
                    onChange={(val) => setProjectId(val)}
                    placeholder="Auto-Detect from Email / Statement"
                    options={[
                      { value: '', label: 'Auto-Detect from Email / Statement' },
                      ...projects.map((p) => ({
                        value: p.id.toString(),
                        label: p.title
                      }))
                    ]}
                    buttonStyle={{
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.82rem',
                      background: '#1e293b'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                    Default Statement Password (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PAN + DOB to unlock PDF"
                    value={defaultPdfPassword}
                    onChange={(e) => setDefaultPdfPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-glass)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Search Keywords Filter */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', display: 'block' }}>
                  Search Keywords / Filters
                </label>
                <input
                  type="text"
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-glass)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem', display: 'block' }}>
                  Comma-separated keywords matched against email subjects or senders.
                </span>
              </div>

              {/* Auto Sync Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  cursor: 'pointer'
                }}
                onClick={() => setAutoSync(!autoSync)}
              >
                <input
                  type="checkbox"
                  id="auto-sync-checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#10b981' }}
                  onClick={(e) => e.stopPropagation()}
                />
                <div>
                  <label
                    htmlFor="auto-sync-checkbox"
                    style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', cursor: 'pointer', display: 'block' }}
                  >
                    Enable Automated Periodic Sync
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Background workers automatically scan and extract new statement emails every 6 hours.
                  </span>
                </div>
              </div>


              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    color: '#34d399',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: submitting ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem'
                  }}
                >
                  <ShieldCheck size={16} />
                  {submitting ? 'Testing & Connecting...' : 'Connect & Verify Account'}
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
