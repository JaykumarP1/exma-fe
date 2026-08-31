import React, { useState, useRef } from 'react';
import { Trash2, Tag, Clock, CheckCircle, AlertCircle, PlayCircle, FileText, FileSpreadsheet, Download, Upload, Paperclip, Building2, CreditCard, Plus, Lock } from 'lucide-react';
import { Project, ProjectDocument, Card } from '../types';
import { AddCardModal } from './AddCardModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { DeleteStatementModal } from './DeleteStatementModal';

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  currency?: string;
  onStatusToggle: (project: Project) => void;
  onDelete: (id: number) => void;
  onUploadDocument: (projectId: number, file: File) => void;
  onDeleteDocument: (projectId: number, documentId: number, deleteExpenses?: boolean) => void;
  onAddCard: (projectId: number, cardData: { card_number: string; card_holder_name: string; card_type: string; expiry_date: string; status?: 'active' | 'locked' }) => void;
  onDeleteCard: (projectId: number, cardId: number) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  loading,
  onStatusToggle,

  onDelete,
  onUploadDocument,
  onDeleteDocument,

  onAddCard,
  onDeleteCard
}) => {
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [activeCardModalBank, setActiveCardModalBank] = useState<Project | null>(null);
  const [bankToDelete, setBankToDelete] = useState<Project | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ projectId: number; doc: ProjectDocument; bankTitle: string } | null>(null);

  const handleConfirmDeleteDoc = async (deleteExpenses: boolean) => {
    if (!docToDelete) return;
    await onDeleteDocument(docToDelete.projectId, docToDelete.doc.id, deleteExpenses);
    setDocToDelete(null);
  };


  if (loading && projects.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Fetching bank records...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
        <Building2 size={40} style={{ color: 'var(--text-dim)', marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>
          No bank entries found matching your criteria.
        </p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          Use the button above to add a new bank entry.
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
            <CheckCircle size={12} /> Active
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

  const getDocIcon = (contentType: string, filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (contentType.includes('pdf') || ext === 'pdf') {
      return <FileText size={15} style={{ color: '#ef4444' }} />;
    }
    return <FileSpreadsheet size={15} style={{ color: '#10b981' }} />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (projectId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    onUploadDocument(projectId, file);
    e.target.value = '';
  };

  const getCardTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'visa':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'mastercard':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'amex':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'virtual':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
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
                  {project.category || 'Commercial'}
                </span>
                {getStatusBadge(project.status)}
              </div>

              {/* Title & Description */}
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: '#f9fafb' }}>
                {project.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
                {project.description}
              </p>

              {/* Attached Payment Cards Section */}
              <div style={{ marginBottom: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CreditCard size={13} style={{ color: '#818cf8' }} /> Attached Cards ({project.cards?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveCardModalBank(project)}
                    style={{
                      fontSize: '0.7rem',
                      color: '#818cf8',
                      background: 'rgba(129, 140, 248, 0.1)',
                      border: '1px solid rgba(129, 140, 248, 0.3)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Plus size={11} /> Add Card
                  </button>
                </div>

                {project.cards && project.cards.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {project.cards.map((card: Card) => {
                      const badgeStyle = getCardTypeBadgeColor(card.card_type);
                      return (
                        <div key={card.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.75rem',
                          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, overflow: 'hidden' }}>
                            <span style={{
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-xs)',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: badgeStyle.bg,
                              color: badgeStyle.text,
                              border: `1px solid ${badgeStyle.border}`
                            }}>
                              {card.card_type}
                            </span>

                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ color: '#f8fafc', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                                {card.masked_number || card.card_number}
                              </div>
                              <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem', display: 'flex', gap: '0.5rem' }}>
                                <span>{card.card_holder_name}</span>
                                <span>• Exp: {card.expiry_date}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {card.status === 'locked' && (
                              <span title="Card Locked" style={{ color: '#fbbf24' }}><Lock size={12} /></span>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteCard(project.id, card.id)}
                              style={{ color: 'var(--text-dim)', padding: '0.15rem', cursor: 'pointer' }}
                              title="Delete Card"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    No payment cards attached to this bank.
                  </p>
                )}
              </div>

              {/* Attached Documents Section */}
              <div style={{ marginBottom: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Paperclip size={13} /> Statements & Files ({project.documents?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[project.id]?.click()}
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--accent-primary)',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Upload size={11} /> Upload Statement
                  </button>
                  <input
                    type="file"
                    ref={(el) => (fileInputRefs.current[project.id] = el)}
                    onChange={(e) => handleFileSelect(project.id, e)}
                    accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    style={{ display: 'none' }}
                  />
                </div>

                {project.documents && project.documents.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {project.documents.map((doc: ProjectDocument) => (
                      <div key={doc.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.35rem 0.6rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden', flex: 1 }}>
                          {getDocIcon(doc.content_type, doc.filename)}
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Download ${doc.filename}`}
                            style={{
                              color: '#e2e8f0',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '170px'
                            }}
                          >
                            {doc.filename}
                          </a>
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>
                            ({formatFileSize(doc.byte_size)})
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-primary)', padding: '0.15rem' }}
                            title="View / Download"
                          >
                            <Download size={13} />
                          </a>
                          <button
                            type="button"
                            onClick={() => setDocToDelete({ projectId: project.id, doc, bankTitle: project.title })}
                            style={{ color: 'var(--text-dim)', padding: '0.15rem', cursor: 'pointer' }}
                            title="Delete Statement Document"
                          >
                            <Trash2 size={13} />
                          </button>

                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    No statement files attached.
                  </p>
                )}
              </div>
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
                  onClick={() => setBankToDelete(project)}
                  style={{
                    padding: '0.35rem',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-dim)',
                    transition: 'color 0.2s ease'
                  }}
                  title="Delete Bank Entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for adding cards */}
      {activeCardModalBank && (
        <AddCardModal
          isOpen={!!activeCardModalBank}
          bankName={activeCardModalBank.title}
          onClose={() => setActiveCardModalBank(null)}
          onSubmit={(cardData) => {
            onAddCard(activeCardModalBank.id, cardData);
            setActiveCardModalBank(null);
          }}
        />
      )}

      {/* Confirmation Modal for deleting banks */}
      {bankToDelete && (
        <ConfirmDeleteModal
          isOpen={!!bankToDelete}
          bankTitle={bankToDelete.title}
          onClose={() => setBankToDelete(null)}
          onConfirm={() => {
            if (bankToDelete) {
              onDelete(bankToDelete.id);
              setBankToDelete(null);
            }
          }}
        />
      )}

      {/* Confirmation Modal for deleting statement documents */}
      {docToDelete && (
        <DeleteStatementModal
          isOpen={!!docToDelete}
          filename={docToDelete.doc.filename}
          bankTitle={docToDelete.bankTitle}
          onClose={() => setDocToDelete(null)}
          onConfirm={handleConfirmDeleteDoc}
        />
      )}
    </>
  );
};


