import React, { useState, useEffect } from 'react';
import { Settings, Globe, Shield, Save, CheckCircle2, User as UserIcon, RefreshCw } from 'lucide-react';

import { CurrencyOption, AuthenticatedUser } from '../types';
import { getSettings, updateSettings } from '../services/api';

interface SettingsPageProps {
  user: AuthenticatedUser | null;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onShowToast }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(user?.currency || 'USD');
  const [supportedCurrencies, setSupportedCurrencies] = useState<CurrencyOption[]>([
    { code: 'USD', symbol: '$', name: 'United States Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

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

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      await updateSettings({ default_currency: selectedCurrency });
      setSaveSuccess(true);
      onShowToast(`Default currency updated to ${selectedCurrency}!`, 'success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      onShowToast('Failed to update settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeCurrencyObj = supportedCurrencies.find(c => c.code === selectedCurrency) || supportedCurrencies[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div style={{
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
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
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
        <div style={{
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.85rem' }}>
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
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
              <span>Loading currency preferences...</span>
            </div>
          ) : (
            <>
              {/* Currency Selector Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
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
                        <span style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: isSelected ? '#38bdf8' : '#f8fafc',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {curr.symbol}
                        </span>
                        {isSelected && <CheckCircle2 size={16} style={{ color: '#38bdf8' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                          {curr.code}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {curr.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Currency Preview Sample Box */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                marginTop: '0.5rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Live Currency Display Format
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Sample Expense Amount:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    {activeCurrencyObj.symbol} 1,250.00
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Account & Security Information */}
        <div style={{
          background: 'var(--bg-glass-card)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.85rem' }}>
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
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <UserIcon size={18} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Account Email</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>{user?.email || 'admin@exma.com'}</div>
                </div>
              </div>
            </div>

            {/* User Role Item */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Shield size={18} style={{ color: '#818cf8' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>System Privilege</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                    {(user?.role || 'admin').toUpperCase()} ROLE
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                ACTIVE
              </span>
            </div>

            {/* Security Note */}
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5
            }}>
              💡 Multi-currency settings are stored per user account and instantly update financial summaries across your active workspaces.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
