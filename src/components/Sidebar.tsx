import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, Gem, LogOut, Activity, PanelLeftClose, PanelLeftOpen, CheckSquare, FileText, Zap, Settings as SettingsIcon } from 'lucide-react';

import { AuthenticatedUser, HealthStatus, TokenUsageResponse, Workspace } from '../types';
import { ReleaseNotesModal } from './ReleaseNotesModal';
import { WorkspaceSelector } from './WorkspaceSelector';
import * as api from '../services/api';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: AuthenticatedUser;
  health: HealthStatus | null;
  loading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  onSelectWorkspace: (ws: Workspace) => void;
  onCreateWorkspace: (name: string) => Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  user,
  health,
  loading,
  onRefresh,
  onLogout,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onCreateWorkspace
}) => {

  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const activeTab: 'dashboard' | 'expenses' | 'statements' | 'settings' | 'usage' | 'release-notes' = location.pathname.startsWith('/expenses')
    ? 'expenses'
    : location.pathname.startsWith('/statements')
    ? 'statements'
    : location.pathname.startsWith('/settings')
    ? 'settings'
    : location.pathname.startsWith('/usage')
    ? 'usage'
    : location.pathname.startsWith('/release-notes')
    ? 'release-notes'
    : 'dashboard';


  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [tokenSummary, setTokenSummary] = useState<TokenUsageResponse['summary'] | null>(null);

  useEffect(() => {
    if (isAdmin) {
      api.fetchTokenUsage().then((res) => setTokenSummary(res.summary)).catch(() => {});
    }
  }, [location.pathname, isAdmin]);





  return (
    <>
      {!isCollapsed && (
        <div className="mobile-overlay" onClick={onToggleCollapse} title="Close mobile navigation menu" />
      )}
      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

            {/* Brand Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '0.85rem',
              marginBottom: '2rem',
              padding: isCollapsed ? '0' : '0 0.25rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                minWidth: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(225,29,72,0.25), rgba(99,102,241,0.25))',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(225,29,72,0.25)'
              }}>
                <Gem size={22} style={{ color: '#fb7185' }} />
              </div>

              {!isCollapsed && (
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span className="ruby-gradient">Exma</span>
                    <span style={{ color: '#6b7280', fontSize: '0.9rem', fontWeight: 400 }}>•</span>
                    <span className="react-gradient">Hub</span>
                  </h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Rails API & React</p>
                </div>
              )}
            </div>

            {/* Navigation Menu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {!isCollapsed ? (
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.75rem 0.4rem 0.75rem' }}>
                  Main Menu
                </div>
              ) : (
                <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0.2rem 0.5rem 0.6rem 0.5rem' }} />
              )}

              {/* Dashboard Nav Item */}
              <div className="nav-item-wrapper">
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    width: '100%',
                    padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                    color: activeTab === 'dashboard' ? '#ffffff' : 'var(--text-muted)',
                    background: activeTab === 'dashboard' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)' : 'transparent',
                    border: activeTab === 'dashboard' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    boxShadow: activeTab === 'dashboard' ? '0 4px 14px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  <LayoutDashboard size={18} style={{ color: activeTab === 'dashboard' ? '#818cf8' : 'var(--text-dim)' }} />
                  {!isCollapsed && <span>Dashboard</span>}
                </button>
                {isCollapsed && <div className="nav-tooltip">Dashboard</div>}
              </div>

              {/* Expenses Nav Item */}
              <div className="nav-item-wrapper">
                <button
                  onClick={() => navigate('/expenses')}
                  style={{
                    width: '100%',
                    padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                    color: activeTab === 'expenses' ? '#ffffff' : 'var(--text-muted)',
                    background: activeTab === 'expenses' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)' : 'transparent',
                    border: activeTab === 'expenses' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                    boxShadow: activeTab === 'expenses' ? '0 4px 14px rgba(16, 185, 129, 0.2)' : 'none'
                  }}
                >
                  <Receipt size={18} style={{ color: activeTab === 'expenses' ? '#34d399' : 'var(--text-dim)' }} />
                  {!isCollapsed && <span>Expenses</span>}
                </button>
                {isCollapsed && <div className="nav-tooltip">Expenses Overview</div>}
              </div>

              {/* Statements Nav Item */}
              <div className="nav-item-wrapper">
                <button
                  onClick={() => navigate('/statements')}
                  style={{
                    width: '100%',
                    padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                    color: activeTab === 'statements' ? '#ffffff' : 'var(--text-muted)',
                    background: activeTab === 'statements' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%)' : 'transparent',
                    border: activeTab === 'statements' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    boxShadow: activeTab === 'statements' ? '0 4px 14px rgba(56, 189, 248, 0.2)' : 'none'
                  }}
                >
                  <FileText size={18} style={{ color: activeTab === 'statements' ? '#38bdf8' : 'var(--text-dim)' }} />
                  {!isCollapsed && <span>Statements</span>}
                </button>
                {isCollapsed && <div className="nav-tooltip">Bank Statements</div>}
              </div>

              {/* Settings Nav Item */}
              <div className="nav-item-wrapper">
                <button
                  onClick={() => navigate('/settings')}
                  style={{
                    width: '100%',
                    padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                    color: activeTab === 'settings' ? '#ffffff' : 'var(--text-muted)',
                    background: activeTab === 'settings' ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%)' : 'transparent',
                    border: activeTab === 'settings' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    boxShadow: activeTab === 'settings' ? '0 4px 14px rgba(56, 189, 248, 0.2)' : 'none'
                  }}
                >
                  <SettingsIcon size={18} style={{ color: activeTab === 'settings' ? '#38bdf8' : 'var(--text-dim)' }} />
                  {!isCollapsed && <span>Settings</span>}
                </button>
                {isCollapsed && <div className="nav-tooltip">Settings</div>}
              </div>
            </div>


            {/* CTAs Pinned Right Above Sidekiq Divider Line */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.85rem' }}>
              {/* Token Usage Nav Item */}
              {isAdmin && (
                <div className="nav-item-wrapper">
                  <button
                    onClick={() => navigate('/usage')}
                    style={{
                      width: '100%',
                      padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      gap: '0.75rem',
                      transition: 'all 0.2s ease',
                      color: '#ffffff',
                      background: activeTab === 'usage'
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.4) 0%, rgba(14, 165, 233, 0.3) 100%)'
                        : 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.15) 100%)',
                      border: activeTab === 'usage' ? '1px solid rgba(56, 189, 248, 0.7)' : '1px solid rgba(56, 189, 248, 0.35)',
                      boxShadow: '0 4px 14px rgba(56, 189, 248, 0.2)',
                      cursor: 'pointer'
                    }}
                  >
                    <Zap size={18} style={{ color: '#38bdf8' }} />
                    {!isCollapsed && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        <span>Token Usage</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>
                          {tokenSummary?.formatted_balance || '1.0M'}
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              )}

              {/* Release Notes Nav Item */}
              <div className="nav-item-wrapper">
                <button
                  onClick={() => navigate('/release-notes')}
                  style={{
                    width: '100%',
                    padding: isCollapsed ? '0.75rem 0' : '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                    color: '#ffffff',
                    background: activeTab === 'release-notes'
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(79, 70, 229, 0.35) 100%)'
                      : 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.2) 100%)',
                    border: activeTab === 'release-notes' ? '1px solid rgba(129, 140, 248, 0.8)' : '1px solid rgba(129, 140, 248, 0.4)',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.2)',
                    cursor: 'pointer'
                  }}
                >
                  <CheckSquare size={18} style={{ color: '#818cf8' }} />
                  {!isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                      <span>Release Notes</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.3)', color: '#818cf8' }}>v1.4</span>
                    </div>
                  )}
                </button>
                {isCollapsed && <div className="nav-tooltip">Release Notes</div>}
              </div>
            </div>
          </div>


        {/* Sidebar Footer Divider & Controls */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>

          {/* System Vitals Status */}
          <div style={{
            padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between'
          }}>
            <div
              className="pulse-badge"
              onClick={() => window.open('http://localhost:4000/sidekiq', '_blank')}
              style={{
                padding: isCollapsed ? '0.35rem' : '0.25rem 0.65rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease',
                userSelect: 'none'
              }}
              title="Open Sidekiq Web UI Dashboard (http://localhost:4000/sidekiq)"
            >
              <span className="pulse-dot pulse-emerald" />
              {!isCollapsed && (
                <span style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  Sidekiq UI <span style={{ color: '#38bdf8', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>({health ? `${health.redis_latency_ms || health.latency_ms}ms` : 'Online'}) ↗</span>
                </span>
              )}
            </div>


            {!isCollapsed && (
              <button onClick={onRefresh} disabled={loading} style={{ color: 'var(--text-muted)' }} title="Sync Vitals">
                <Activity size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>

          {/* Workspace Selector inside Navigation Sidebar Profile Section */}
          <div style={{ marginBottom: '0.75rem' }}>
            <WorkspaceSelector
              workspaces={workspaces}
              currentWorkspace={currentWorkspace}
              onSelectWorkspace={onSelectWorkspace}
              onCreateWorkspace={onCreateWorkspace}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* User Info & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between', padding: '0.2rem 0.25rem' }}>

            {!isCollapsed && (
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>{user.email.split('@')[0]}</span>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.08rem 0.35rem',
                    borderRadius: '4px',
                    background: isAdmin ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                    color: isAdmin ? '#818cf8' : 'var(--text-muted)'
                  }}>
                    {user.role ? user.role.toUpperCase() : 'MEMBER'}
                  </span>
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            )}
            <div className="nav-item-wrapper" style={{ position: 'relative', width: 'auto', flexShrink: 0 }}>
              <button
                onClick={onLogout}
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  borderRadius: 'var(--radius-sm)',
                  color: '#f87171',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
              {isCollapsed && <div className="nav-tooltip">Sign Out</div>}
            </div>



          </div>

          {/* Bottom Expand / Collapse Toggle Button */}
          <div className="nav-item-wrapper">
            <button
              onClick={onToggleCollapse}
              style={{
                width: '100%',
                padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '0.2rem'
              }}
            >
              {!isCollapsed && <span>Collapse Sidebar</span>}
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            {isCollapsed && <div className="nav-tooltip">Expand Sidebar</div>}
          </div>
        </div>
      </div>
    </aside>


      {/* Release Notes Modal */}
      <ReleaseNotesModal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
      />
    </>
  );
};


