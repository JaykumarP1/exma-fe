import React from 'react';
import { Gem, Activity } from 'lucide-react';
import { HealthStatus } from '../types';

interface HeaderProps {
  health: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, loading, onRefresh }) => {
  return (
    <header className="glass-panel" style={{ padding: '1.25rem 2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Title / Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(225,29,72,0.2), rgba(99,102,241,0.2))',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(225,29,72,0.25)'
          }}>
            <Gem size={24} style={{ color: '#fb7185' }} />
          </div>

          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="ruby-gradient">Exma</span>
              <span style={{ color: '#6b7280', fontSize: '1.2rem', fontWeight: 400 }}>•</span>
              <span className="react-gradient">Workspace</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Rails API + React and Vite frontend
            </p>
          </div>
        </div>

        {/* Server Vitals & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          {health ? (
            <div className="pulse-badge">
              <span className="pulse-dot pulse-emerald"></span>
              <span style={{ color: 'var(--emerald)' }}>Rails Backend Online</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                ({health.ruby_version} • {health.latency_ms}ms)
              </span>
            </div>
          ) : (
            <div className="pulse-badge">
              <span className="pulse-dot pulse-ruby"></span>
              <span style={{ color: 'var(--ruby-red)' }}>Connecting to Ruby API...</span>
            </div>
          )}

          <button 
            onClick={onRefresh}
            disabled={loading}
            style={{
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
            title="Refresh System Vitals"
          >
            <Activity size={16} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--accent-primary)' }} />
            <span>Sync</span>
          </button>
        </div>

      </div>
    </header>
  );
};
