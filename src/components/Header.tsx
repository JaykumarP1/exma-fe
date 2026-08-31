import React from 'react';
import { Activity, Building2, Receipt, FileText, Zap, Menu } from 'lucide-react';
import { AuthenticatedUser, HealthStatus } from '../types';

interface HeaderProps {
  health?: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
  user?: AuthenticatedUser;
  activeTab: 'dashboard' | 'expenses' | 'statements' | 'usage' | 'release-notes';
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  loading,
  onRefresh,
  activeTab,
  onToggleSidebar
}) => {

  return (
    <header className="glass-panel" style={{ padding: '1.2rem 1.75rem', marginBottom: '1.5rem', position: 'relative', zIndex: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {onToggleSidebar && (
              <button className="mobile-menu-btn" onClick={onToggleSidebar} title="Toggle navigation menu">
                <Menu size={20} />
              </button>
            )}
            {activeTab === 'dashboard' ? (

              <Building2 size={22} style={{ color: '#818cf8' }} />
            ) : activeTab === 'expenses' ? (
              <Receipt size={22} style={{ color: '#34d399' }} />
            ) : activeTab === 'statements' ? (
              <FileText size={22} style={{ color: '#38bdf8' }} />
            ) : (
              <Zap size={22} style={{ color: '#38bdf8' }} />
            )}
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {activeTab === 'dashboard'
                ? 'Bank Dashboard'
                : activeTab === 'expenses'
                ? 'Expense Extraction & Overview'
                : activeTab === 'statements'
                ? 'Bank Statements & PDF Records'
                : 'Token & Creds Usage Logs'}
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.15rem' }}>
            {activeTab === 'dashboard'
              ? 'Manage bank accounts, latency vitals, attached payment cards, and statements'
              : activeTab === 'expenses'
              ? 'Automatically extract and analyze expense records from uploaded PDF statements and spreadsheets'
              : activeTab === 'statements'
              ? 'Table view of uploaded PDF bank statements, linked bank accounts, expense counts, and statement totals'
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
