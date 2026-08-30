import React, { useState, useRef, useEffect } from 'react';
import { Layers, ChevronDown, Plus, Check, Building2 } from 'lucide-react';
import { Workspace } from '../types';

interface WorkspaceSelectorProps {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  onSelectWorkspace: (ws: Workspace) => void;
  onCreateWorkspace: (name: string) => Promise<void>;
  isCollapsed?: boolean;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  currentWorkspace,
  workspaces,
  onSelectWorkspace,
  onCreateWorkspace,
  isCollapsed = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      setCreatingLoading(true);
      await onCreateWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setIsCreating(false);
      setIsOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create workspace.');
    } finally {
      setCreatingLoading(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: 105, width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isCollapsed ? `Workspace: ${currentWorkspace?.name || 'Workspace'}` : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: '0.6rem',
          padding: isCollapsed ? '0.55rem 0' : '0.55rem 0.85rem',
          borderRadius: '8px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          color: '#f8fafc',
          fontSize: '0.85rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
          <div style={{
            width: '24px',
            height: '24px',
            minWidth: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Layers size={14} />
          </div>

          {!isCollapsed && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {currentWorkspace?.name || 'Workspace'}
            </span>
          )}
        </div>

        {!isCollapsed && (
          <ChevronDown size={16} style={{ color: '#818cf8', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        )}
      </button>


      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '260px',
            borderRadius: '12px',
            padding: '0.5rem',
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            zIndex: 999999
          }}
        >

          <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Workspaces ({workspaces.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
            {workspaces.map((ws) => {
              const isSelected = ws.id === currentWorkspace?.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    onSelectWorkspace(ws);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-main)',
                    fontSize: '0.83rem',
                    fontWeight: isSelected ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={15} style={{ color: isSelected ? '#818cf8' : 'var(--text-dim)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {ws.name}
                    </span>
                  </div>

                  {isSelected && <Check size={16} style={{ color: '#818cf8' }} />}
                </button>
              );
            })}
          </div>

          <div style={{ height: '1px', background: 'var(--border-glass)', margin: '0.4rem 0' }} />

          {isCreating ? (
            <form onSubmit={handleCreateSubmit} style={{ padding: '0.35rem' }}>
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Workspace name..."
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-glass)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  marginBottom: '0.4rem',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  style={{ flex: 1, padding: '0.35rem', borderRadius: '4px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLoading}
                  style={{ flex: 1, padding: '0.35rem', borderRadius: '4px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  {creatingLoading ? 'Saving...' : 'Create'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} /> Create Workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
};

