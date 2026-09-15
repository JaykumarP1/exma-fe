import React from 'react';
import { Activity, Building2, Receipt, FileText, Zap, Menu, Settings as SettingsIcon, CreditCard, LayoutDashboard } from 'lucide-react';
import { AuthenticatedUser, HealthStatus } from '../types';

interface HeaderProps {
  health?: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
  user?: AuthenticatedUser;
  activeTab: 'dashboard' | 'banks' | 'expenses' | 'statements' | 'cards' | 'settings' | 'usage' | 'release-notes' | 'staging' | 'usage-plan';
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  loading,
  onRefresh,
  activeTab,
  onToggleSidebar
}) => {
  return (
    <header
      className="glass-panel"
      style={{ padding: '1.2rem 1.75rem', marginBottom: '1.5rem', position: 'relative', zIndex: 100 }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {onToggleSidebar && (
              <button className="mobile-menu-btn" onClick={onToggleSidebar} title="Toggle navigation menu">
                <Menu size={20} />
              </button>
            )}
            {activeTab === 'dashboard' ? (
              <LayoutDashboard size={22} style={{ color: '#818cf8' }} />
            ) : activeTab === 'banks' ? (
              <Building2 size={22} style={{ color: '#818cf8' }} />
            ) : activeTab === 'expenses' ? (
              <Receipt size={22} style={{ color: '#34d399' }} />
            ) : activeTab === 'statements' ? (
              <FileText size={22} style={{ color: '#38bdf8' }} />
            ) : activeTab === 'cards' ? (
              <CreditCard size={22} style={{ color: '#f472b6' }} />
            ) : activeTab === 'settings' ? (
              <SettingsIcon size={22} style={{ color: '#38bdf8' }} />
            ) : (
              <Zap size={22} style={{ color: '#38bdf8' }} />
            )}

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {activeTab === 'dashboard'
                ? 'Overview Dashboard'
                : activeTab === 'banks'
                  ? 'Connected Banks & Accounts'
                  : activeTab === 'expenses'
                    ? 'Expense Extraction & Overview'
                    : activeTab === 'staging'
                      ? 'Expense Staging & Document Review'
                      : activeTab === 'statements'
                        ? 'Bank Statements & PDF Records'
                        : activeTab === 'cards'
                          ? 'Payment & Credit Cards'
                          : activeTab === 'settings'
                            ? 'Platform & System Settings'
                            : activeTab === 'release-notes'
                              ? 'Release Notes & Changelog'
                              : 'Token & Creds Usage Logs'}
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.15rem' }}>
            {activeTab === 'dashboard'
              ? 'High-level workspace metrics, system vitals, and quick access navigation'
              : activeTab === 'banks'
                ? 'Manage connected bank institutions, accounts, linked cards, and statement documents'
                : activeTab === 'expenses'
                  ? 'Automatically extract and analyze expense records from uploaded PDF statements and spreadsheets'
                  : activeTab === 'staging'
                    ? 'Review and verify extracted transaction items alongside source PDF document preview'
                    : activeTab === 'statements'
                      ? 'Table view of uploaded PDF bank statements, linked bank accounts, expense counts, and statement totals'
                      : activeTab === 'cards'
                        ? 'Manage credit cards, link statements, and track card expense spending'
                        : activeTab === 'settings'
                          ? 'Manage regional currency defaults, multi-currency formatting, and user preferences'
                          : activeTab === 'release-notes'
                            ? 'Product updates, changelog, and new features'
                            : 'Table view of historical token usage fetch logs, remaining token balance, and next Gemini quota reset countdown'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={onRefresh} disabled={loading} className="header-action" title="Refresh data and vitals">
            <Activity size={16} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>
    </header>
  );
};
