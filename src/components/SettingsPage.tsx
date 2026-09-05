import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Globe,
  Shield,
  Save,
  CheckCircle2,
  User as UserIcon,
  RefreshCw,
  Cpu,
  ArrowRight,
  Mail,
  Plus,
  Clock,
  AlertTriangle
} from 'lucide-react';

import { CurrencyOption, AuthenticatedUser, Workspace, EmailAccount, Project } from '../types';
import { getSettings, updateSettings, fetchEmailAccounts, syncEmailAccount } from '../services/api';
import { EmailSyncModal } from './EmailSyncModal';
import { Select } from './ui/Select';

interface SettingsPageProps {
  user: AuthenticatedUser | null;
  currentWorkspace?: Workspace | null;
  projects?: Project[];
  onUpdateWorkspace?: (data: { currency?: string; pdf_extraction?: 'standard' | 'ai' }) => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  currentWorkspace,
  projects = [],
  onUpdateWorkspace,
  onShowToast
}) => {
  const navigate = useNavigate();
  const [pdfExtraction, setPdfExtraction] = useState<'standard' | 'ai'>(currentWorkspace?.pdf_extraction || 'standard');
  const [selectedCurrency, setSelectedCurrency] = useState<string>(user?.currency || 'USD');
  const [loading, setLoading] = useState<boolean>(true);

  const [supportedCurrencies, setSupportedCurrencies] = useState<CurrencyOption[]>([
    { code: 'USD', symbol: '$', name: 'United States Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ]);

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Email Accounts State
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loadingEmails, setLoadingEmails] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [syncingAccountId, setSyncingAccountId] = useState<number | null>(null);
  const [emailSyncLimits, setEmailSyncLimits] = useState<Record<number, string>>({});

  const emailScanLimitOptions = [
    { value: '30', label: 'Scan 30 emails' },
    { value: '50', label: 'Scan 50 emails' },
    { value: '100', label: 'Scan 100 emails' },
    { value: '250', label: 'Scan 250 emails' },
    { value: '500', label: 'Scan 500 emails' }
  ];

  useEffect(() => {
    fetchSettings();
    loadEmailAccounts();
  }, []);

  useEffect(() => {
    if (currentWorkspace?.pdf_extraction) {
      setPdfExtraction(currentWorkspace.pdf_extraction);
    }
  }, [currentWorkspace]);

  const handleSelectPdfExtraction = async (mode: 'standard' | 'ai') => {
    setPdfExtraction(mode);
    if (onUpdateWorkspace && currentWorkspace) {
      try {
        await onUpdateWorkspace({ pdf_extraction: mode });
        onShowToast(
          `PDF extraction method set to ${mode === 'ai' ? 'AI Multimodal Vision' : 'Standard Regex'}`,
          'success'
        );
      } catch (err) {
        console.error('Failed to update workspace pdf_extraction:', err);
        onShowToast('Failed to update PDF extraction method.', 'error');
      }
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      if (res.settings?.default_currency) {
        setSelectedCurrency(res.settings.default_currency);
      }
      if (res.supported_currencies?.length) {
        setSupportedCurrencies(res.supported_currencies);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailAccounts = async () => {
    try {
      setLoadingEmails(true);
      const res = await fetchEmailAccounts();
      setEmailAccounts(res.email_accounts || []);
    } catch (err) {
      console.error('Failed to load email accounts:', err);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleQuickSync = async (account: EmailAccount) => {
    try {
      setSyncingAccountId(account.id);
      const limitVal = parseInt(emailSyncLimits[account.id] || '30', 10);
      const res = await syncEmailAccount(account.id, { limit: limitVal });
      onShowToast(res.message || `Sync completed for ${account.email} (${limitVal} emails limit)`, 'success');
      await loadEmailAccounts();
    } catch (err: any) {
      console.error('Failed to sync email account:', err);
      onShowToast(err.message || `Failed to sync ${account.email}`, 'error');
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      await updateSettings({ default_currency: selectedCurrency });
      if (onUpdateWorkspace && currentWorkspace) {
        await onUpdateWorkspace({ currency: selectedCurrency, pdf_extraction: pdfExtraction });
      }
      setSaveSuccess(true);
      onShowToast(`Settings updated successfully!`, 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      onShowToast('Failed to update settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeCurrencyObj = supportedCurrencies.find((c) => c.code === selectedCurrency) || supportedCurrencies[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Settings size={24} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
              Platform & System Settings
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0.2rem 0 0 0' }}>
              Manage regional currency defaults, multi-currency formatting, and user preferences.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: saveSuccess
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
            cursor: saving ? 'wait' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {saving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : saveSuccess ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* Main Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Multi-Currency Section */}
        <div
          style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              borderBottom: '1px solid var(--border-glass)',
              paddingBottom: '0.85rem'
            }}
          >
            <Globe size={20} style={{ color: '#38bdf8' }} />
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Default Base Currency
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Select your primary currency for expense calculations and financial summaries.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw
                size={24}
                className="animate-spin"
                style={{ margin: '0 auto 0.5rem auto', display: 'block' }}
              />
              <span>Loading currency preferences...</span>
            </div>
          ) : (
            <>
              {/* Currency Selector Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '0.75rem'
                }}
              >
                {supportedCurrencies.map((curr) => {
                  const isSelected = selectedCurrency === curr.code;
                  return (
                    <div
                      key={curr.code}
                      onClick={() => setSelectedCurrency(curr.code)}
                      style={{
                        padding: '0.85rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.1) 100%)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid var(--border-glass)',
                        boxShadow: isSelected ? '0 4px 16px rgba(56, 189, 248, 0.2)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: isSelected ? '#38bdf8' : '#f8fafc',
                            fontFamily: 'var(--font-mono)'
                          }}
                        >
                          {curr.symbol}
                        </span>
                        {isSelected && <CheckCircle2 size={16} style={{ color: '#38bdf8' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>{curr.code}</div>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {curr.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Currency Preview Sample Box */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  marginTop: '0.5rem'
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#38bdf8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                  }}
                >
                  Live Currency Display Format
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  <span>Sample Expense Amount:</span>
                  <span
                    style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}
                  >
                    {activeCurrencyObj.symbol} 1,250.00
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* PDF Extraction Engine Section */}
        <div
          style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              borderBottom: '1px solid var(--border-glass)',
              paddingBottom: '0.85rem'
            }}
          >
            <Settings size={20} style={{ color: '#a855f7' }} />
            <div
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  PDF Extraction Method
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                  Choose between standard local text regex parsing or Gemini Multimodal AI Vision extraction.
                </p>
              </div>

              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  background: pdfExtraction === 'ai' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  color: pdfExtraction === 'ai' ? '#c084fc' : '#38bdf8',
                  border:
                    pdfExtraction === 'ai' ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(56, 189, 248, 0.4)'
                }}
              >
                ACTIVE: {pdfExtraction === 'ai' ? '✨ AI VISION' : '⚡ STANDARD REGEX'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            {/* Standard Mode Choice */}
            <div
              onClick={() => handleSelectPdfExtraction('standard')}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: pdfExtraction === 'standard' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border:
                  pdfExtraction === 'standard' ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid var(--border-glass)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: pdfExtraction === 'standard' ? '#38bdf8' : '#f8fafc'
                  }}
                >
                  ⚡ Standard (Regex)
                </span>
                {pdfExtraction === 'standard' && <CheckCircle2 size={16} style={{ color: '#38bdf8' }} />}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Fast local text reader using regex patterns. 0 API token cost. Works for text PDFs with standard
                layouts.
              </p>
            </div>

            {/* AI Mode Choice */}
            <div
              onClick={() => handleSelectPdfExtraction('ai')}

              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: pdfExtraction === 'ai' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: pdfExtraction === 'ai' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid var(--border-glass)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    color: pdfExtraction === 'ai' ? '#c084fc' : '#f8fafc'
                  }}
                >
                  ✨ AI (Gemini Flash Vision)
                </span>
                {pdfExtraction === 'ai' && <CheckCircle2 size={16} style={{ color: '#c084fc' }} />}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Multimodal AI visual document extraction. 98%+ accuracy for complex tables, scanned PDFs, & multi-line
                rows.
              </p>
            </div>
          </div>

          {/* Token & Cost Estimates Card by Document Size */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem'
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#c084fc',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.65rem'
              }}
            >
              📊 Token & Cost Estimates by Document Size (Gemini 2.5 Flash)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.5rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '4px'
                }}
              >
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>📄 1 Page PDF (~15–20 txns)</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  ~1,000 Tokens <strong style={{ color: '#34d399' }}>(~$0.00018)</strong>
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.5rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '4px'
                }}
              >
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>📄 3 Page PDF (~50 txns)</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  ~2,200 Tokens <strong style={{ color: '#34d399' }}>(~$0.00050)</strong>
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.5rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '4px'
                }}
              >
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>📄 10 Page PDF (~200 txns)</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  ~8,500 Tokens <strong style={{ color: '#34d399' }}>(~$0.00200)</strong>
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', margin: '0.6rem 0 0 0', lineHeight: 1.4 }}>
              💡 Gemini 2.5 Flash tokenizes PDF pages at ~258 input tokens/page. You can process ~6,000 PDF statement
              pages for ~$1.00 total.
            </p>
          </div>

          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => navigate('/usage')}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.1) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#c084fc',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Cpu size={16} />
              <span>View Processed PDFs & Token Consumption Log</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        {/* Email Statement Ingestion & Sync Card */}
        <div
          style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-glass)',
              paddingBottom: '0.85rem',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(56, 189, 248, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8'
                }}
              >
                <Mail size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Email Statement Ingestion & Sync
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                  Pull and parse bank & credit card statements automatically from Gmail, Outlook, or custom IMAP.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.15) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={15} />
              <span>{emailAccounts.length > 0 ? 'Manage Mailboxes' : 'Connect Mailbox'}</span>
            </button>
          </div>

          {/* Accounts List or Empty State */}
          {loadingEmails ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem auto', display: 'block', color: '#38bdf8' }} />
              Loading email accounts...
            </div>
          ) : emailAccounts.length === 0 ? (
            <div
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8'
                }}
              >
                <Mail size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
                  No Bank Email Inboxes Connected
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, maxWidth: '440px', lineHeight: 1.45 }}>
                  Automate statement extraction directly from your inbox. Exma securely scans for monthly bank and credit card PDF attachments, unlocks protected files, and parses transactions automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                  marginTop: '0.25rem'
                }}
              >
                <Plus size={15} />
                <span>Connect Your Bank Email</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {emailAccounts.map((acc) => {
                const isSyncing = syncingAccountId === acc.id || acc.status === 'syncing';
                const projName = acc.project_title || projects.find((p) => p.id === acc.project_id)?.title;
                const providerLabel =
                  acc.provider === 'gmail_imap' ? 'Gmail' : acc.provider === 'outlook_imap' ? 'Outlook' : 'Custom IMAP';

                return (
                  <div
                    key={acc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-glass)',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 200 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(56, 189, 248, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#38bdf8'
                        }}
                      >
                        <Mail size={17} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>{acc.email}</span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.45rem',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-muted)',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                          >
                            {providerLabel}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.85rem',
                            fontSize: '0.74rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.2rem'
                          }}
                        >
                          {projName && (
                            <span>
                              Project: <strong style={{ color: '#38bdf8' }}>{projName}</strong>
                            </span>
                          )}
                          <span>
                            Parsed: <strong style={{ color: '#34d399' }}>{acc.stats?.total_statements || 0}</strong> statements
                          </span>
                          {acc.last_synced_at && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} />
                              {new Date(acc.last_synced_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background:
                            acc.status === 'error'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : isSyncing
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          color:
                            acc.status === 'error'
                              ? '#f87171'
                              : isSyncing
                              ? '#38bdf8'
                              : '#34d399',
                          border: `1px solid ${
                            acc.status === 'error'
                              ? 'rgba(239, 68, 68, 0.3)'
                              : isSyncing
                              ? 'rgba(56, 189, 248, 0.3)'
                              : 'rgba(16, 185, 129, 0.3)'
                          }`
                        }}
                      >
                        {acc.status === 'error' ? (
                          <>
                            <AlertTriangle size={12} /> Error
                          </>
                        ) : isSyncing ? (
                          <>
                            <RefreshCw size={12} className="spin" /> Syncing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={12} /> Connected
                          </>
                        )}
                      </span>

                      <div style={{ width: '135px' }}>
                        <Select
                          size="sm"
                          value={emailSyncLimits[acc.id] || '30'}
                          onChange={(val) => setEmailSyncLimits((prev) => ({ ...prev, [acc.id]: val }))}
                          options={emailScanLimitOptions}
                          disabled={isSyncing}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={isSyncing}
                        onClick={() => handleQuickSync(acc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.45rem 0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-glass)',
                          color: isSyncing ? 'var(--text-dim)' : '#f8fafc',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: isSyncing ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
                        <span>Sync Now</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEmailModalOpen(true)}
                        style={{
                          padding: '0.45rem 0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'transparent',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Security Note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              lineHeight: 1.45
            }}
          >
            <Shield size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
            <span>
              🔒 <strong>Bank-Grade Encryption:</strong> Email credentials and PDF passwords are encrypted at rest using AES-256-GCM. We only search for statement attachments and never delete or modify emails.
            </span>
          </div>
        </div>

        {/* User Account & Security Information */}
        <div
          style={{
            background: 'var(--bg-glass-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              borderBottom: '1px solid var(--border-glass)',
              paddingBottom: '0.85rem'
            }}
          >
            <Shield size={20} style={{ color: '#818cf8' }} />
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Account Profile & Security
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Your current session, access privileges, and system role.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* User Email Item */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UserIcon size={18} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Account Email</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                    {user?.email || 'admin@exma.com'}
                  </div>
                </div>
              </div>
            </div>

            {/* User Role Item */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Shield size={18} style={{ color: '#818cf8' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>System Privilege</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                    {(user?.role || 'admin').toUpperCase()} ROLE
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}
              >
                ACTIVE
              </span>
            </div>

            {/* Security Note */}
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5
              }}
            >
              💡 Multi-currency settings are stored per user account and instantly update financial summaries across
              your active workspaces.
            </div>
          </div>
        </div>
      </div>

      <EmailSyncModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          loadEmailAccounts();
        }}
        projects={projects}
        onSyncComplete={loadEmailAccounts}
      />
    </div>
  );
};
