import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Plus,
  X,
  Search,
  Check,
  AlertCircle,
  FolderPlus,
  Landmark
} from 'lucide-react';
import { Project } from '../types';
import * as api from '../services/api';

interface LinkBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedBankName?: string;
  currentBankId?: number;
  projects: Project[];
  onSelectBank: (bank: Project) => Promise<void> | void;
  onBankCreated?: (newBank: Project) => void;
}

export const LinkBankModal: React.FC<LinkBankModalProps> = ({
  isOpen,
  onClose,
  detectedBankName = '',
  currentBankId,
  projects,
  onSelectBank,
  onBankCreated
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'existing'>(
    projects.length === 0 ? 'create' : 'existing'
  );
  const [newBankTitle, setNewBankTitle] = useState(detectedBankName);
  const [newBankCategory, setNewBankCategory] = useState('Banking');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewBankTitle(detectedBankName || '');
      setNewBankCategory('Banking');
      setSearchQuery('');
      setError(null);
      setLoading(false);
      setActiveTab(projects.length === 0 ? 'create' : 'existing');
    }
  }, [isOpen, detectedBankName, projects.length]);

  if (!isOpen) return null;

  const handleCreateAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankTitle.trim()) {
      setError('Please provide a valid bank name.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const created = await api.createProject({
        title: newBankTitle.trim(),
        category: newBankCategory,
        status: 'active'
      });

      if (onBankCreated) {
        onBankCreated(created);
      }

      await onSelectBank(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to create bank', err);
      setError(err?.message || 'Failed to create and link bank. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExisting = async (bank: Project) => {
    try {
      setLoading(true);
      setError(null);
      await onSelectBank(bank);
      onClose();
    } catch (err: any) {
      console.error('Failed to link bank', err);
      setError(err?.message || 'Failed to link bank.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return createPortal(
    <div
      className="modal-backdrop"
      style={{ zIndex: 1000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '520px', width: '92%' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}
            >
              <Landmark size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Link Bank Account
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Associate statement with a bank in your workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Detected Bank Banner */}
        {detectedBankName && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <Building2 size={16} style={{ color: '#a5b4fc', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', color: '#a5b4fc', textTransform: 'uppercase', fontWeight: 600 }}>
                  Detected from Statement
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {detectedBankName}
                </div>
              </div>
            </div>

            {/* Quick 1-click create button if detected name doesn't match an existing bank */}
            {!projects.some((p) => p.title.toLowerCase() === detectedBankName.toLowerCase()) && (
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setNewBankTitle(detectedBankName);
                  try {
                    setLoading(true);
                    setError(null);
                    const created = await api.createProject({
                      title: detectedBankName.trim(),
                      category: 'Banking',
                      status: 'active'
                    });
                    if (onBankCreated) onBankCreated(created);
                    await onSelectBank(created);
                    onClose();
                  } catch (err: any) {
                    setError(err?.message || 'Failed to create bank');
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#e0e7ff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  flexShrink: 0
                }}
              >
                <Plus size={13} /> Quick Create
              </button>
            )}
          </div>
        )}

        {/* Mode Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '3px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            border: '1px solid var(--border-glass)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: activeTab === 'existing' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: activeTab === 'existing' ? '#fff' : 'var(--text-muted)',
              border: activeTab === 'existing' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Existing Banks ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: activeTab === 'create' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
              color: activeTab === 'create' ? '#fff' : 'var(--text-muted)',
              border: activeTab === 'create' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.3rem'
            }}
          >
            <Plus size={13} /> Create New Bank
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              background: 'rgba(239, 68, 68, 0.15)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Existing Banks */}
        {activeTab === 'existing' && (
          <div>
            {projects.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '0.75rem'
                }}
              >
                <Search size={14} style={{ color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search existing banks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '0.82rem',
                    width: '100%'
                  }}
                />
              </div>
            )}

            <div
              style={{
                maxHeight: '230px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                paddingRight: '2px'
              }}
            >
              {projects.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed var(--border-glass)'
                  }}
                >
                  <Building2 size={28} style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No banks registered in this workspace yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.78rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#a5b4fc',
                      cursor: 'pointer'
                    }}
                  >
                    + Create First Bank
                  </button>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No banks match "{searchQuery}"
                </div>
              ) : (
                filteredProjects.map((p) => {
                  const isCurrent = currentBankId === p.id;
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: '0.65rem 0.85rem',
                        background: isCurrent ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                        border: isCurrent ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: isCurrent ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isCurrent ? '#34d399' : '#818cf8',
                            flexShrink: 0
                          }}
                        >
                          <Building2 size={14} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {p.category || 'Banking'}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span
                          style={{
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Check size={12} /> Linked
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleSelectExisting(p)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(99, 102, 241, 0.18)',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            color: '#a5b4fc',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Link
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Create New Bank */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateAndLink}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '0.35rem',
                    textTransform: 'uppercase'
                  }}
                >
                  Bank Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IDFC FIRST Bank, HDFC, Chase..."
                  value={newBankTitle}
                  onChange={(e) => setNewBankTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '0.35rem',
                    textTransform: 'uppercase'
                  }}
                >
                  Category
                </label>
                <select
                  value={newBankCategory}
                  onChange={(e) => setNewBankCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#1e293b',
                    border: '1px solid var(--border-glass)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="Banking">Banking</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Investment">Investment</option>
                  <option value="Savings">Savings</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newBankTitle.trim()}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <FolderPlus size={14} />
                  <span>{loading ? 'Creating...' : 'Create & Link Bank'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
