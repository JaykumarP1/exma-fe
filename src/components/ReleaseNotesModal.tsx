import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, CheckCircle2, Tag, Calendar, Layers } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ReleaseVersion {
  version: string;
  title: string;
  date: string;
  status: 'active' | 'completed' | 'upcoming';
  items: ChecklistItem[];
}

const DEFAULT_VERSIONS: ReleaseVersion[] = [
  {
    version: 'v1.4',
    title: 'Attached Cards & PDF Data Extraction',
    date: 'August 2026',
    status: 'active',
    items: [
      { id: 'v14-1', text: 'Attached Bank Payment Cards with number masking & status indicators', completed: true },
      { id: 'v14-2', text: 'Automated PDF & Excel Expense Extractor service', completed: true },
      { id: 'v14-3', text: 'Bank Deletion Confirmation Modal dialog', completed: true },
      {
        id: 'v14-4',
        text: 'Expandable & Shrinkable Sidebar Navigation with bottom toggle & tooltips',
        completed: true
      },
      { id: 'v14-5', text: 'Multi-version Release Notes system with custom checklist points', completed: true }
    ]
  },
  {
    version: 'v1.3',
    title: 'Client Routing & Expenses Dashboard',
    date: 'July 2026',
    status: 'completed',
    items: [
      { id: 'v13-1', text: 'React Router v6 setup with /dashboard & /expenses routes', completed: true },
      { id: 'v13-2', text: 'Dedicated Expense Page with CSV/Excel parsing', completed: true },
      { id: 'v13-3', text: 'Terminology update from Projects to Banks across UI', completed: true }
    ]
  },
  {
    version: 'v1.2',
    title: 'Bank Statements & API Health Vitals',
    date: 'June 2026',
    status: 'completed',
    items: [
      { id: 'v12-1', text: 'ActiveStorage statement file attachments', completed: true },
      { id: 'v12-2', text: 'Real-time API health monitor pulse badge', completed: true }
    ]
  }
];

const STORAGE_KEY = 'exma_multi_release_notes_v2';

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReleaseNotesModal: React.FC<ReleaseNotesModalProps> = ({ isOpen, onClose }) => {
  const [versions, setVersions] = useState<ReleaseVersion[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_VERSIONS;
  });

  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [newItemText, setNewItemText] = useState('');
  const [isAddingVersion, setIsAddingVersion] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('');
  const [newVersionTitle, setNewVersionTitle] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
    } catch (e) {
      console.error('Failed to save release versions', e);
    }
  }, [versions]);

  if (!isOpen) return null;

  const currentVersion = versions[activeVersionIndex] || versions[0];
  const items = currentVersion ? currentVersion.items : [];
  const completedCount = items.filter((item) => item.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const handleToggleItem = (itemId: string) => {
    setVersions((prev) =>
      prev.map((v, idx) => {
        if (idx !== activeVersionIndex) return v;
        return {
          ...v,
          items: v.items.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item))
        };
      })
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !currentVersion) return;

    const newItem: ChecklistItem = {
      id: `${currentVersion.version}-${Date.now()}`,
      text: newItemText.trim(),
      completed: false
    };

    setVersions((prev) =>
      prev.map((v, idx) => (idx === activeVersionIndex ? { ...v, items: [...v.items, newItem] } : v))
    );
    setNewItemText('');
  };

  const handleDeleteItem = (itemId: string) => {
    setVersions((prev) =>
      prev.map((v, idx) =>
        idx === activeVersionIndex ? { ...v, items: v.items.filter((item) => item.id !== itemId) } : v
      )
    );
  };

  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newVersionTag.trim();
    const title = newVersionTitle.trim();

    if (!tag) {
      alert('Please enter a version tag (e.g. v1.5)');
      return;
    }
    if (!title) {
      alert('Please enter a release title (e.g. Analytics & Multi-Currency)');
      return;
    }

    const formattedTag = tag.startsWith('v') ? tag : `v${tag}`;

    // Prevent duplicate version tags
    if (versions.some((v) => v.version.toLowerCase() === formattedTag.toLowerCase())) {
      alert(`Version '${formattedTag}' already exists. Please enter a different version tag.`);
      return;
    }

    const newVer: ReleaseVersion = {
      version: formattedTag,
      title: title,
      date: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
      status: 'upcoming',
      items: []
    };

    setVersions((prev) => [newVer, ...prev]);
    setActiveVersionIndex(0);
    setNewVersionTag('');
    setNewVersionTitle('');
    setIsAddingVersion(false);
  };

  const handleDeleteVersion = (versionIdx: number) => {
    if (versions.length <= 1) return;
    setVersions((prev) => prev.filter((_, idx) => idx !== versionIdx));
    setActiveVersionIndex(0);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          background: '#0f172a',
          border: '1px solid rgba(129, 140, 248, 0.35)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
        }}
      >
        {/* Header */}
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(129, 140, 248, 0.25))',
                border: '1px solid rgba(129, 140, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}
            >
              <Sparkles size={22} />
            </div>

            <div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Release Notes & Roadmap
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Multi-version release history with independent feature checklists
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Version Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-glass)'
          }}
        >
          {versions.map((v, idx) => {
            const isActive = idx === activeVersionIndex;
            return (
              <button
                key={v.version}
                onClick={() => setActiveVersionIndex(idx)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(79, 70, 229, 0.2) 100%)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid rgba(129, 140, 248, 0.5)' : '1px solid var(--border-glass)',
                  boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none'
                }}
              >
                <Tag size={13} style={{ color: isActive ? '#818cf8' : 'var(--text-dim)' }} />
                <span>{v.version}</span>
                {v.status === 'active' && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.25)',
                      color: '#34d399'
                    }}
                  >
                    Active
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsAddingVersion(true)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#818cf8',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px dashed rgba(99, 102, 241, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={14} /> New Release
          </button>
        </div>

        {/* Create New Version Inline Form */}
        {isAddingVersion && (
          <form
            onSubmit={handleCreateVersion}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Layers size={15} style={{ color: '#818cf8' }} /> Create New Release Version
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Version tag (e.g. v1.5)"
                value={newVersionTag}
                onChange={(e) => setNewVersionTag(e.target.value)}
                autoFocus
                required
                style={{
                  width: '130px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />

              <input
                type="text"
                placeholder="Release title (e.g. Multi-Currency Support)"
                value={newVersionTitle}
                onChange={(e) => setNewVersionTitle(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Create Version
              </button>
              <button
                type="button"
                onClick={() => setIsAddingVersion(false)}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Selected Version Header Info */}
        {currentVersion && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.75rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                    {currentVersion.version}: {currentVersion.title}
                  </h4>
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} /> {currentVersion.date}
                  </span>
                  <span>• {items.length} checklist points</span>
                </div>
              </div>

              {versions.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteVersion(activeVersionIndex)}
                  style={{
                    color: 'var(--text-dim)',
                    padding: '0.3rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  title="Delete this version release"
                >
                  <Trash2 size={14} /> Delete Version
                </button>
              )}
            </div>

            {/* Version Progress Bar */}
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#e2e8f0',
                  marginBottom: '0.4rem'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={14} style={{ color: '#34d399' }} /> Progress ({completedCount} of {items.length}{' '}
                  completed)
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div
                style={{
                  height: '6px',
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Add New Point Form for current version */}
            <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder={`Add checklist item to ${currentVersion.version}...`}
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} /> Add Point
              </button>
            </form>

            {/* Checklist Items List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                paddingRight: '0.25rem',
                maxHeight: '260px'
              }}
            >
              {items.length === 0 ? (
                <p
                  style={{
                    textAlign: 'center',
                    color: 'var(--text-dim)',
                    fontSize: '0.85rem',
                    padding: '1.5rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  No checklist items in {currentVersion.version} yet. Add your first feature point above!
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: item.completed ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                      border: item.completed ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-glass)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <label
                      style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleItem(item.id)}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: '#10b981',
                          cursor: 'pointer'
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.85rem',
                          color: item.completed ? 'var(--text-muted)' : '#f8fafc',
                          textDecoration: item.completed ? 'line-through' : 'none',
                          lineHeight: '1.4'
                        }}
                      >
                        {item.text}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      style={{ color: 'var(--text-dim)', padding: '0.2rem', marginLeft: '0.5rem', cursor: 'pointer' }}
                      title="Remove point"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Versions & points persist automatically in local storage
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
