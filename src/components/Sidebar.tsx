import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Gem,
  LogOut,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  CheckSquare,
  FileText,
  CreditCard,
  Zap,
  Settings as SettingsIcon,
  ChevronsUpDown,
  User as UserIcon,
  Building2,
  Plus,
  Check
} from 'lucide-react';

import { AuthenticatedUser, HealthStatus, TokenUsageResponse, Workspace } from '../types';
import { ReleaseNotesModal } from './ReleaseNotesModal';
import { Select } from './ui/Select';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
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
  onCreateWorkspace: (name: string, currency?: string) => Promise<void>;
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

  const activeTab: 'dashboard' | 'expenses' | 'statements' | 'cards' | 'settings' | 'usage' | 'release-notes' =
    location.pathname.startsWith('/expenses')
      ? 'expenses'
      : location.pathname.startsWith('/statements')
        ? 'statements'
        : location.pathname.startsWith('/cards')
          ? 'cards'
          : location.pathname.startsWith('/settings')
            ? 'settings'
            : location.pathname.startsWith('/usage')
              ? 'usage'
              : location.pathname.startsWith('/release-notes')
                ? 'release-notes'
                : 'dashboard';

  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [tokenSummary, setTokenSummary] = useState<TokenUsageResponse['summary'] | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceCurrency, setNewWorkspaceCurrency] = useState('USD');
  const [creatingWorkspaceLoading, setCreatingWorkspaceLoading] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      setCreatingWorkspaceLoading(true);
      await onCreateWorkspace(newWorkspaceName.trim(), newWorkspaceCurrency);
      setNewWorkspaceName('');
      setIsCreatingWorkspace(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create workspace.');
    } finally {
      setCreatingWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
        setIsCreatingWorkspace(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
        setIsCreatingWorkspace(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      api
        .fetchTokenUsage()
        .then((res) => setTokenSummary(res.summary))
        .catch(() => {});
    }
  }, [isAdmin]);


  return (
    <>
      {!isCollapsed && (
        <div className="mobile-overlay" onClick={onToggleCollapse} title="Close mobile navigation menu" />
      )}
      <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Brand Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: '0.85rem',
                marginBottom: '2rem',
                padding: isCollapsed ? '0' : '0 0.25rem'
              }}
            >
              <div
                style={{
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
                }}
              >
                <Gem size={22} style={{ color: '#fb7185' }} />
              </div>

              {!isCollapsed && (
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  <h1
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
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
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0 0.75rem 0.4rem 0.75rem'
                  }}
                >
                  Main Menu
                </div>
              ) : (
                <div
                  style={{ height: '1px', background: 'var(--border-glass)', margin: '0.2rem 0.5rem 0.6rem 0.5rem' }}
                />
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
                    background:
                      activeTab === 'dashboard'
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)'
                        : 'transparent',
                    border: activeTab === 'dashboard' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    boxShadow: activeTab === 'dashboard' ? '0 4px 14px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  <LayoutDashboard
                    size={18}
                    style={{ color: activeTab === 'dashboard' ? '#818cf8' : 'var(--text-dim)' }}
                  />
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
                    background:
                      activeTab === 'expenses'
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
                        : 'transparent',
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
                    background:
                      activeTab === 'statements'
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%)'
                        : 'transparent',
                    border: activeTab === 'statements' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    boxShadow: activeTab === 'statements' ? '0 4px 14px rgba(56, 189, 248, 0.2)' : 'none'
                  }}
                >
                  <FileText size={18} style={{ color: activeTab === 'statements' ? '#38bdf8' : 'var(--text-dim)' }} />
                  {!isCollapsed && <span>Statements</span>}
                </button>
                {isCollapsed && <div className="nav-tooltip">Bank Statements</div>}
              </div>

              {/* Cards Nav Item */}
              <div className="nav-item-wrapper">
                <button
                  onClick={() => navigate('/cards')}
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
                    color: activeTab === 'cards' ? '#ffffff' : 'var(--text-muted)',
                    background:
                      activeTab === 'cards'
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)'
                        : 'transparent',
                    border: activeTab === 'cards' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    boxShadow: activeTab === 'cards' ? '0 4px 14px rgba(99, 102, 241, 0.2)' : 'none'
                  }}
                >
                  <CreditCard size={18} style={{ color: activeTab === 'cards' ? '#818cf8' : 'var(--text-dim)' }} />
                  {!isCollapsed && <span>Cards</span>}
                </button>
                {isCollapsed && <div className="nav-tooltip">Payment Cards</div>}
              </div>
            </div>

            {/* CTAs Pinned Right Above Sidekiq Divider Line */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                marginBottom: '0.85rem'
              }}
            >
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
                      background:
                        activeTab === 'usage'
                          ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.4) 0%, rgba(14, 165, 233, 0.3) 100%)'
                          : 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.15) 100%)',
                      border:
                        activeTab === 'usage'
                          ? '1px solid rgba(56, 189, 248, 0.7)'
                          : '1px solid rgba(56, 189, 248, 0.35)',
                      boxShadow: '0 4px 14px rgba(56, 189, 248, 0.2)',
                      cursor: 'pointer'
                    }}
                  >
                    <Zap size={18} style={{ color: '#38bdf8' }} />
                    {!isCollapsed && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        <span>Token Usage</span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8'
                          }}
                        >
                          {tokenSummary?.formatted_balance || '1.0M'}
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              )}

              {/* Release Notes Nav Item (Admin only) */}
              {isAdmin && (
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
                      background:
                        activeTab === 'release-notes'
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(79, 70, 229, 0.35) 100%)'
                          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.2) 100%)',
                      border:
                        activeTab === 'release-notes'
                          ? '1px solid rgba(129, 140, 248, 0.8)'
                          : '1px solid rgba(129, 140, 248, 0.4)',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.2)',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckSquare size={18} style={{ color: '#818cf8' }} />
                    {!isCollapsed && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                        <span>Release Notes</span>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.3)',
                            color: '#818cf8'
                          }}
                        >
                          v1.4
                        </span>
                      </div>
                    )}
                  </button>
                  {isCollapsed && <div className="nav-tooltip">Release Notes</div>}
                </div>
              )}

            </div>
          </div>

          {/* Sidebar Footer Divider & Controls */}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-glass)'
            }}
          >
            {/* System Vitals Status (Admin Only) */}
            {isAdmin && (
              <div
                style={{
                  padding: isCollapsed ? '0.6rem 0' : '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between'

                }}
              >
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
                    <span
                      style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      Sidekiq UI{' '}
                      <span style={{ color: '#38bdf8', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                        ({health ? `${health.redis_latency_ms || health.latency_ms}ms` : 'Online'}) ↗
                      </span>
                    </span>
                  )}
                </div>

                {!isCollapsed && (
                  <button
                    onClick={onRefresh}
                    disabled={loading}
                    style={{ color: 'var(--text-muted)' }}
                    title="Sync Vitals"
                  >
                    <Activity size={14} className={loading ? 'animate-spin' : ''} />
                  </button>
                )}
              </div>
            )}


            {/* User Profile Trigger & Unified Dropdown Menu */}
            <div ref={profileMenuRef} style={{ position: 'relative', width: '100%', marginBottom: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                title={isCollapsed ? `${user.name || user.email.split('@')[0]} (${currentWorkspace?.name || 'Workspace'})` : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  gap: '0.65rem',
                  padding: isCollapsed ? '0.4rem 0' : '0.45rem 0.55rem',
                  borderRadius: '8px',
                  background: isProfileMenuOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: isProfileMenuOpen ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
              >
                {!isCollapsed ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name || user.email}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#818cf8',
                            flexShrink: 0
                          }}
                        >
                          <UserIcon size={16} />
                        </div>
                      )}
                      <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#f8fafc',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <span>{user.name || user.email.split('@')[0]}</span>
                          <span
                            style={{
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              padding: '0.06rem 0.3rem',
                              borderRadius: '4px',
                              background: isAdmin ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                              color: isAdmin ? '#818cf8' : 'var(--text-muted)'
                            }}
                          >
                            {user.role ? user.role.toUpperCase() : 'MEMBER'}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-dim)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <span style={{ color: '#818cf8', fontWeight: 600 }}>{currentWorkspace?.name || 'Workspace'}</span>
                          <span>•</span>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronsUpDown
                      size={15}
                      style={{
                        color: 'var(--text-dim)',
                        flexShrink: 0,
                        transition: 'transform 0.2s ease',
                        transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none'
                      }}
                    />
                  </>
                ) : (
                  user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name || user.email}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid rgba(56, 189, 248, 0.4)'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#818cf8'
                      }}
                    >
                      <UserIcon size={16} />
                    </div>
                  )
                )}
              </button>

              {/* Profile & Workspace Dropdown Popover */}
              {isProfileMenuOpen && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    ...(isCollapsed
                      ? {
                          bottom: 0,
                          left: 'calc(100% + 12px)',
                          width: '270px'
                        }
                      : {
                          bottom: 'calc(100% + 8px)',
                          left: 0,
                          width: '260px'
                        }),
                    padding: '0.65rem',
                    background: 'rgba(15, 23, 42, 0.98)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: '12px',
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    zIndex: 500,
                    animation: 'fadeIn 0.15s ease-out'
                  }}
                >
                  {/* Popover Header with user summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.35rem 0.5rem 0.55rem 0.5rem' }}>
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name || user.email}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#818cf8',
                          flexShrink: 0
                        }}
                      >
                        <UserIcon size={18} />
                      </div>
                    )}
                    <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#f8fafc',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span>{user.name || user.email.split('@')[0]}</span>
                        <span
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            padding: '0.06rem 0.3rem',
                            borderRadius: '4px',
                            background: isAdmin ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                            color: isAdmin ? '#818cf8' : 'var(--text-muted)'
                          }}
                        >
                          {user.role ? user.role.toUpperCase() : 'MEMBER'}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-dim)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0.2rem 0 0.5rem 0' }} />

                  {/* Workspaces Section */}
                  <div style={{ padding: '0 0.25rem 0.4rem 0.25rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.35rem',
                        padding: '0 0.25rem'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'var(--text-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        Workspaces ({workspaces.length})
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                        maxHeight: '140px',
                        overflowY: 'auto'
                      }}
                    >
                      {workspaces.map((ws) => {
                        const isSelected = ws.id === currentWorkspace?.id;
                        return (
                          <button
                            key={ws.id}
                            type="button"
                            onClick={() => {
                              onSelectWorkspace(ws);
                              setIsProfileMenuOpen(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '0.45rem 0.6rem',
                              borderRadius: '6px',
                              background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                              border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                              color: isSelected ? '#ffffff' : 'var(--text-main)',
                              fontSize: '0.8rem',
                              fontWeight: isSelected ? 700 : 500,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                              <Building2 size={14} style={{ color: isSelected ? '#818cf8' : 'var(--text-dim)', flexShrink: 0 }} />
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '150px'
                                }}
                              >
                                {ws.name}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                              {ws.currency && (
                                <span
                                  style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    padding: '0.05rem 0.3rem',
                                    borderRadius: '3px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: 'var(--text-muted)'
                                  }}
                                >
                                  {ws.currency}
                                </span>
                              )}
                              {isSelected && <Check size={14} style={{ color: '#818cf8' }} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Inline Create Workspace Form / Trigger */}
                    {isCreatingWorkspace ? (
                      <form
                        onSubmit={handleCreateWorkspaceSubmit}
                        style={{
                          marginTop: '0.45rem',
                          padding: '0.45rem',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <input
                          type="text"
                          value={newWorkspaceName}
                          onChange={(e) => setNewWorkspaceName(e.target.value)}
                          placeholder="Workspace name..."
                          autoFocus
                          required
                          style={{
                            width: '100%',
                            padding: '0.4rem 0.55rem',
                            borderRadius: '5px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid var(--border-glass)',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            marginBottom: '0.35rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        <div style={{ marginBottom: '0.45rem' }}>
                          <Select
                            value={newWorkspaceCurrency}
                            onChange={(val) => setNewWorkspaceCurrency(val)}
                            options={SUPPORTED_CURRENCIES.map((c) => ({
                              value: c.code,
                              label: `${c.name} (${c.symbol})`
                            }))}
                            size="sm"
                            buttonStyle={{
                              padding: '0.35rem 0.55rem',
                              fontSize: '0.75rem',
                              background: '#1e293b'
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => setIsCreatingWorkspace(false)}
                            style={{
                              flex: 1,
                              padding: '0.3rem',
                              borderRadius: '4px',
                              background: 'transparent',
                              border: '1px solid var(--border-glass)',
                              color: 'var(--text-muted)',
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={creatingWorkspaceLoading}
                            style={{
                              flex: 1,
                              padding: '0.3rem',
                              borderRadius: '4px',
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              border: 'none',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                              cursor: 'pointer'
                            }}
                          >
                            {creatingWorkspaceLoading ? 'Saving...' : 'Create'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCreatingWorkspace(true)}
                        style={{
                          width: '100%',
                          marginTop: '0.3rem',
                          padding: '0.35rem 0.5rem',
                          borderRadius: '5px',
                          background: 'transparent',
                          border: 'none',
                          color: '#38bdf8',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Plus size={13} />
                        <span>Create Workspace</span>
                      </button>
                    )}
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0.3rem 0 0.4rem 0' }} />

                  {/* Popover Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigate('/settings');
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <SettingsIcon size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>Settings & Profile</span>
                    </button>

                    <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0.2rem 0' }} />

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={15} style={{ color: '#f87171' }} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
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
      <ReleaseNotesModal isOpen={isReleaseModalOpen} onClose={() => setIsReleaseModalOpen(false)} />
    </>
  );
};
