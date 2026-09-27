import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Project } from '../types';
import { ProjectList } from './ProjectList';
import { CreateModal } from './CreateModal';
import { PdfPasswordModal } from './PdfPasswordModal';
import { Select } from './ui/Select';
import { PRESET_BANK_TAGS, parseBankTags } from '../utils/tagColors';

interface BankPageProps {
  projects: Project[];
  loading: boolean;
  currency?: string;
  onStatusToggle: (project: Project) => void;
  onDelete: (id: number) => void;
  onUploadDocument: (projectId: number, file: File, password?: string) => Promise<void> | void;
  onDeleteDocument: (projectId: number, documentId: number, deleteExpenses?: boolean) => void;
  onAddCard: (
    projectId: number,
    cardData: {
      card_number: string;
      card_holder_name: string;
      card_type: string;
      expiry_date: string;
      status?: 'active' | 'locked';
    }
  ) => void;
  onDeleteCard: (projectId: number, cardId: number) => void;
  onCreateBank: (data: Partial<Project>, files?: File[]) => Promise<void> | void;
  onUpdatePassword?: (projectId: number, password: string | null) => Promise<void> | void;
  onUpdateTags?: (bankId: number, tags: string[]) => Promise<void> | void;
}

export const BankPage: React.FC<BankPageProps> = ({
  projects,
  loading,
  currency = 'USD',
  onStatusToggle,
  onDelete,
  onUploadDocument,
  onDeleteDocument,
  onAddCard,
  onDeleteCard,
  onCreateBank,
  onUpdatePassword,
  onUpdateTags
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lockedDocument, setLockedDocument] = useState<{ projectId: number; file: File } | null>(null);

  // Client-side filtering for immediate responsiveness
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const pTags = parseBankTags(p.tags, p.category);
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        pTags.some((t) => t.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'all' ||
        pTags.some((t) => t.toLowerCase() === selectedCategory.toLowerCase()) ||
        (p.category && p.category.toLowerCase().split(',').map((s) => s.trim()).includes(selectedCategory.toLowerCase()));

      return matchesSearch && matchesCategory;
    });
  }, [projects, searchQuery, selectedCategory]);

  const handleUploadWithPasswordHandling = async (projectId: number, file: File, password?: string) => {
    try {
      await onUploadDocument(projectId, file, password);
      setLockedDocument(null);
    } catch (error: any) {
      if (error?.message && (error.message.includes('PDF_LOCKED') || error.message.includes('password-protected'))) {
        setLockedDocument({ projectId, file });
      } else {
        throw error;
      }
    }
  };

  // Extract unique categories and tags from projects or default set
  const categoryOptions = useMemo(() => {
    const set = new Set(PRESET_BANK_TAGS);
    projects.forEach((p) => {
      const pTags = parseBankTags(p.tags, p.category);
      pTags.forEach((t) => set.add(t));
    });
    return [
      { value: 'all', label: 'All Tags / Categories' },
      ...Array.from(set).map((cat) => ({ value: cat, label: cat }))
    ];
  }, [projects]);

  const activeCount = useMemo(() => projects.filter((p) => p.status === 'active').length, [projects]);
  const totalCardsCount = useMemo(() => projects.reduce((acc, p) => acc + (p.cards?.length || 0), 0), [projects]);
  const totalDocsCount = useMemo(() => projects.reduce((acc, p) => acc + (p.documents?.length || 0), 0), [projects]);

  return (
    <div>
      {/* Top Bank Stats Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem'
        }}
      >
        <div className="glass-panel" style={{ padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              flexShrink: 0
            }}
          >
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Total Banks
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {projects.length}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              flexShrink: 0
            }}
          >
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Active Accounts
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {activeCount}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f472b6',
              flexShrink: 0
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Connected Cards
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {totalCardsCount}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.1rem 1.35rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              flexShrink: 0
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Attached Docs
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {totalDocsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Action Controls */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: '1' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Search banks by name, tag, or notes..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ width: '190px' }}>
            <Select
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              icon={<Filter size={15} />}
              options={categoryOptions}
              size="sm"
            />
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          <Plus size={16} /> Add Bank
        </button>
      </div>

      {/* Banks List Component */}
      <ProjectList
        projects={filteredProjects}
        loading={loading}
        currency={currency}
        onStatusToggle={onStatusToggle}
        onDelete={onDelete}
        onUploadDocument={(projectId, file) => handleUploadWithPasswordHandling(projectId, file)}
        onDeleteDocument={onDeleteDocument}
        onAddCard={onAddCard}
        onDeleteCard={onDeleteCard}
        onUpdatePassword={onUpdatePassword}
        onUpdateTags={onUpdateTags}
      />

      {/* Add Bank Modal */}
      <CreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (data, files) => {
          await onCreateBank(data, files);
          setIsCreateModalOpen(false);
        }}
      />

      {/* Password Modal for Encrypted PDFs */}
      {lockedDocument && (() => {
        const lockedBank = projects.find((p) => p.id === lockedDocument.projectId);
        return (
          <PdfPasswordModal
            isOpen={!!lockedDocument}
            filename={lockedDocument.file.name}
            bankTitle={lockedBank?.title}
            defaultPassword={lockedBank?.statement_password}
            onClose={() => setLockedDocument(null)}
            onSubmit={(password) => {
              if (lockedDocument) {
                handleUploadWithPasswordHandling(lockedDocument.projectId, lockedDocument.file, password);
              }
            }}
          />
        );
      })()}
    </div>
  );
};
