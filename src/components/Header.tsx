import React from 'react';
import { Activity, Gem, LogOut } from 'lucide-react';
import { AuthenticatedUser, HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  user: AuthenticatedUser;
}

export const Header: React.FC<HeaderProps> = ({ health, loading, onRefresh, onLogout, user }) => {
  return (
    <header className="glass-panel" style={{ padding: '1.25rem 2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(225,29,72,0.2), rgba(99,102,241,0.2))', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(225,29,72,0.25)' }}>
            <Gem size={24} style={{ color: '#fb7185' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="ruby-gradient">Exma</span>
              <span style={{ color: '#6b7280', fontSize: '1.2rem', fontWeight: 400 }}>•</span>
              <span className="react-gradient">Workspace</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Rails API + React and Vite frontend</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {health ? (
            <div className="pulse-badge">
              <span className="pulse-dot pulse-emerald" />
              <span style={{ color: 'var(--emerald)' }}>Rails API online</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>({health.latency_ms}ms)</span>
            </div>
          ) : (
            <div className="pulse-badge"><span className="pulse-dot pulse-ruby" /><span style={{ color: 'var(--ruby-red)' }}>Connecting to API…</span></div>
          )}
          <button onClick={onRefresh} disabled={loading} className="header-action" title="Refresh system vitals"><Activity size={16} className={loading ? 'animate-spin' : ''} /><span>Sync</span></button>
          <span className="user-email" title={user.email}>{user.email}</span>
          <button onClick={onLogout} className="header-action" title="Sign out"><LogOut size={16} /><span>Sign out</span></button>
        </div>
      </div>
    </header>
  );
};
