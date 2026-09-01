import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, ShieldCheck, LogOut, Activity } from 'lucide-react';

import { AuthenticatedUser } from '../types';
import * as api from '../services/api';

interface ServerDownScreenProps {
  onReconnected: (user: AuthenticatedUser) => void;
  onLogout: () => void;
}

export const ServerDownScreen: React.FC<ServerDownScreenProps> = ({ onReconnected, onLogout }) => {
  const [retrying, setRetrying] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(5);
  const [statusMessage, setStatusMessage] = useState<string>('Polling backend health...');

  const tokenSaved = !!api.getAuthToken();

  const attemptReconnection = async () => {
    setRetrying(true);
    setStatusMessage('Checking Rails backend health...');
    try {
      // 1. Ping Health endpoint
      const health = await api.fetchHealth();
      if (health && health.status === 'healthy') {
        setStatusMessage('Server online! Verifying local session token...');

        // 2. Validate saved session token
        if (tokenSaved) {
          const res = await api.fetchCurrentUser();
          if (res && res.user) {
            onReconnected(res.user);
            return;
          }
        }
      }
    } catch (error: any) {
      if (error instanceof api.UnauthorizedError) {
        // Explicit 401 from online server ➔ clear token & redirect to login
        onLogout();
        return;
      }
      setStatusMessage('Server is still unreachable. Retrying in 5s...');
    } finally {
      setRetrying(false);
      setRetrySeconds(5);
    }
  };

  // Live 5s retry countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRetrySeconds((prev) => {
        if (prev <= 1) {
          attemptReconnection();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.98) 70%)',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.25rem',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Server Disconnected Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f87171',
            marginBottom: '1.25rem',
            boxShadow: '0 0 24px rgba(239, 68, 68, 0.25)'
          }}
        >
          <WifiOff size={32} />
        </div>

        {/* Pulse badge */}
        <div
          className="pulse-badge pulse-ruby"
          style={{ padding: '0.35rem 0.85rem', marginBottom: '1rem', fontSize: '0.78rem' }}
        >
          <span className="pulse-dot pulse-ruby" />
          <span style={{ color: '#f87171', fontWeight: 700 }}>Rails API Server Offline</span>
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
          Backend Disconnected
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.55', marginBottom: '1.5rem' }}>
          The backend Rails server is currently unreachable. Don't worry — your session token is safely stored in local
          storage and will automatically resume once the server is back online.
        </p>

        {/* Token preservation status box */}
        <div
          style={{
            width: '100%',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            fontSize: '0.8rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}>
            <ShieldCheck size={16} />
            <span style={{ fontWeight: 600 }}>Session Token Saved</span>
          </div>

          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8'
            }}
          >
            exma.auth_token
          </span>
        </div>

        {/* Live status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.78rem',
            color: 'var(--text-dim)',
            marginBottom: '1.75rem'
          }}
        >
          <Activity size={14} className="animate-spin" style={{ color: '#f87171' }} />
          <span>
            {statusMessage} (Auto-retry in {retrySeconds}s)
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
          <button
            onClick={attemptReconnection}
            disabled={retrying}
            style={{
              flex: 1,
              padding: '0.72rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(225, 29, 72, 0.2) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.25)'
            }}
          >
            <RefreshCw size={15} className={retrying ? 'animate-spin' : ''} />
            Retry Connection Now
          </button>

          <button
            onClick={onLogout}
            style={{
              padding: '0.72rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
            title="Clear session and return to login screen"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
