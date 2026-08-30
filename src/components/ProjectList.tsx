import React from 'react';
import { Trash2, Tag, Clock, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { Project } from '../types';

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  onStatusToggle: (project: Project) => void;
  onDelete: (id: number) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  loading,
  onStatusToggle,
  onDelete
}) => {
  if (loading && projects.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Fetching records from Ruby API...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>
          No project entries found matching your criteria.
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          Use the button above to add a new project entry to SQLite database.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle size={12} /> Completed
          </span>
        );
      case 'active':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            <PlayCircle size={12} /> Active
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            background: 'rgba(245, 158, 11, 0.12)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <AlertCircle size={12} /> Pending
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
      {projects.map((project) => (
        <div key={project.id} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Header / Category & Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                <Tag size={12} style={{ color: 'var(--accent-primary)' }} />
                {project.category || 'General'}
              </span>
              {getStatusBadge(project.status)}
            </div>

            {/* Title & Description */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f9fafb' }}>
              {project.title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
              {project.description}
            </p>
          </div>

          {/* Footer Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)' }}>
              <Clock size={12} /> {project.latency}ms
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                onClick={() => onStatusToggle(project)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                Toggle Status
              </button>

              <button
                onClick={() => onDelete(project.id)}
                style={{
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-dim)',
                  transition: 'color 0.2s ease'
                }}
                title="Delete Entry"
              >
                <Trash2 size={16} hover-style={{ color: 'var(--ruby-red)' }} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
