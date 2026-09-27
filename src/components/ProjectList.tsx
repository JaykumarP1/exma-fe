import React, { useState, useRef } from 'react';
import {
  Trash2,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
  Building2,
  CreditCard,
  Plus,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Edit2,
  Mail
} from 'lucide-react';
import { Project, ProjectDocument, Card, LinkedStatementPayload } from '../types';
import { AddCardModal } from './AddCardModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { DeleteStatementModal } from './DeleteStatementModal';
import { ManageBankPasswordModal } from './ManageBankPasswordModal';
import { ManageBankTagsModal } from './ManageBankTagsModal';
import { ManageCardPasswordModal } from './ManageCardPasswordModal';
import { getTagColor, parseBankTags } from '../utils/tagColors';
import * as api from '../services/api';

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  currency?: string;
  onStatusToggle: (project: Project) => void;
  onDelete: (id: number) => void;
  onUploadDocument: (projectId: number, file: File) => void;
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
  onUpdatePassword?: (projectId: number, password: string | null) => Promise<void> | void;
  onUpdateTags?: (bankId: number, tags: string[]) => Promise<void> | void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  loading,
  onStatusToggle,

  onDelete,
  onUploadDocument,
  onDeleteDocument,

  onAddCard,
  onDeleteCard,
  onUpdatePassword,
  onUpdateTags
}) => {
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const [activeCardModalBank, setActiveCardModalBank] = useState<Project | null>(null);
  const [activePasswordModalBank, setActivePasswordModalBank] = useState<Project | null>(null);
  const [activePasswordModalCard, setActivePasswordModalCard] = useState<Card | null>(null);
  const [activeTagModalBank, setActiveTagModalBank] = useState<Project | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<{ [key: number]: boolean }>({});
  const [bankToDelete, setBankToDelete] = useState<Project | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ projectId: number; doc: ProjectDocument; bankTitle: string } | null>(
    null
  );

  const toggleRevealPassword = (id: number) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSavePassword = async (bankId: number, password: string | null) => {
    if (onUpdatePassword) {
      await onUpdatePassword(bankId, password);
    } else {
      await api.updateBankPassword(bankId, password);
    }
  };

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
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Use the button above to add a new bank entry.</p>
      </div>
    );
  }

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span
            style={{
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
            }}
          >
            <CheckCircle size={12} /> Active
          </span>
        );
      case 'active':
        return (
          <span
            style={{
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
            }}
          >
            <PlayCircle size={12} /> Active
          </span>
        );
      default:
        return (
          <span
            style={{
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
            }}
          >
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
          <div
            key={project.id}
            className="glass-panel animate-fade-in"
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              {/* Header / Category & Status */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                  {parseBankTags(project.tags, project.category).map((tag) => {
                    const color = getTagColor(tag);
                    return (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          background: color.bg,
                          color: color.text,
                          border: `1px solid ${color.border}`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <Tag size={10} style={{ opacity: 0.8 }} />
                        {tag}
                      </span>
                    );
                  })}

                  {onUpdateTags && (
                    <button
                      type="button"
                      onClick={() => setActiveTagModalBank(project)}
                      title="Manage bank tags"
                      style={{
                        fontSize: '0.68rem',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px dashed rgba(255, 255, 255, 0.2)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Plus size={10} /> Tag
                    </button>
                  )}
                </div>
                {getStatusBadge(project.status)}
              </div>

              {/* Title & Linked Email */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.4rem',
                  flexWrap: 'wrap'
                }}
              >
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f9fafb' }}>
                  {project.title}
                </h3>
                {project.email && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#94a3b8',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                    title={`Linked Email: ${project.email}`}
                  >
                    <Mail size={11} style={{ color: '#38bdf8' }} />
                    {project.email}
                  </span>
                )}
              </div>
              {project.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
                  {project.description}
                </p>
              )}

              {/* Attached Payment Cards Section */}
              <div
                style={{
                  marginBottom: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.08)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
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
                        <div
                          key={card.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.75rem',
                            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
                            border: '1px solid var(--border-glass)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              flex: 1,
                              overflow: 'hidden'
                            }}
                          >
                            <span
                              style={{
                                padding: '0.15rem 0.45rem',
                                borderRadius: 'var(--radius-xs)',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                background: badgeStyle.bg,
                                color: badgeStyle.text,
                                border: `1px solid ${badgeStyle.border}`
                              }}
                            >
                              {card.card_type}
                            </span>

                            <div style={{ overflow: 'hidden' }}>
                              <div
                                style={{
                                  color: '#f8fafc',
                                  fontWeight: 600,
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.78rem'
                                }}
                              >
                                {card.masked_number || card.card_number}
                              </div>
                              <div
                                style={{
                                  color: 'var(--text-dim)',
                                  fontSize: '0.68rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '0.45rem'
                                }}
                              >
                                <span>{card.card_holder_name}</span>
                                <span>• Exp: {card.expiry_date}</span>
                                {(card.email || project.email) && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem',
                                      color: '#94a3b8'
                                    }}
                                    title={`Linked Email: ${card.email || project.email}`}
                                  >
                                    • <Mail size={10} style={{ color: '#38bdf8' }} /> {card.email || project.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setActivePasswordModalCard(card)}
                              style={{
                                color: card.has_statement_password ? '#10b981' : 'var(--text-dim)',
                                padding: '0.15rem',
                                cursor: 'pointer',
                                background: 'none',
                                border: 'none',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                              title={card.has_statement_password ? 'Statement Password Configured — Click to Manage' : 'Set Card Statement Password'}
                            >
                              <KeyRound size={12} />
                            </button>
                            {card.status === 'locked' && (
                              <span title="Card Locked" style={{ color: '#fbbf24' }}>
                                <Lock size={12} />
                              </span>
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

              {/* Bank Statement Password Section */}
              <div
                style={{
                  marginBottom: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.08)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <KeyRound size={13} style={{ color: '#10b981' }} /> Statement Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setActivePasswordModalBank(project)}
                    style={{
                      fontSize: '0.7rem',
                      color: project.has_statement_password ? '#38bdf8' : '#10b981',
                      background: project.has_statement_password ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      border: `1px solid ${project.has_statement_password ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {project.has_statement_password ? <Edit2 size={11} /> : <Plus size={11} />}
                    {project.has_statement_password ? 'Manage' : 'Set Password'}
                  </button>
                </div>

                {project.has_statement_password ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.75rem',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 78, 59, 0.15) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#10b981',
                          flexShrink: 0
                        }}
                      >
                        <ShieldCheck size={14} />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              color: '#f8fafc',
                              fontWeight: 600,
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.8rem',
                              letterSpacing: revealedPasswords[project.id] ? '0.02em' : '0.12em'
                            }}
                          >
                            {revealedPasswords[project.id] ? (project.statement_password || '••••••••') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRevealPassword(project.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-dim)',
                              cursor: 'pointer',
                              padding: '0.1rem',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title={revealedPasswords[project.id] ? 'Hide password' : 'Show password'}
                          >
                            {revealedPasswords[project.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>
                          Auto-unlocks statements
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActivePasswordModalBank(project)}
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-glass)',
                        padding: '0.2rem 0.45rem',
                        borderRadius: 'var(--radius-xs)',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>
                    No statement password set.
                  </p>
                )}
              </div>

              {/* Attached Documents Section */}
              <div
                style={{
                  marginBottom: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.08)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}
                >
                  {(() => {
                    const linkedStatements = project.statements || [];
                    const attachedDocuments = project.documents || [];
                    const totalFilesCount = linkedStatements.length + attachedDocuments.length;
                    return (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <FileText size={13} style={{ color: '#38bdf8' }} /> Statements & Files ({totalFilesCount})
                      </span>
                    );
                  })()}
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

                {(() => {
                  const linkedStatements = project.statements || [];
                  const attachedDocuments = project.documents || [];
                  const totalFilesCount = linkedStatements.length + attachedDocuments.length;

                  if (totalFilesCount === 0) {
                    return (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>
                        No statement files attached.
                      </p>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {/* Linked Database Statements */}
                      {linkedStatements.map((stmt: LinkedStatementPayload) => (
                        <div
                          key={`stmt-${stmt.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.45rem 0.65rem',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', flex: 1 }}>
                            {getDocIcon(stmt.file_type || 'application/pdf', stmt.filename)}
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <a
                                  href={stmt.file_url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Download / View ${stmt.filename}`}
                                  style={{
                                    color: '#e2e8f0',
                                    textDecoration: 'none',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '180px',
                                    fontWeight: 600
                                  }}
                                >
                                  {stmt.filename}
                                </a>
                                {stmt.status === 'locked' && (
                                  <span title="Password Protected" style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '0.15rem', fontSize: '0.68rem' }}>
                                    <Lock size={10} /> Locked
                                  </span>
                                )}
                              </div>
                              <div style={{ color: 'var(--text-dim)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
                                {(stmt.statement_date || stmt.uploaded_at_formatted) && (
                                  <span>{stmt.statement_date || stmt.uploaded_at_formatted}</span>
                                )}
                                {(stmt.total_due && stmt.total_due > 0) ? (
                                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>{stmt.formatted_amount || `₹${stmt.total_due.toFixed(2)}`}</span>
                                ) : (stmt.total_amount && stmt.total_amount > 0) ? (
                                  <span style={{ color: '#34d399', fontWeight: 600 }}>{stmt.formatted_amount || `₹${stmt.total_amount.toFixed(2)}`}</span>
                                ) : null}
                                {stmt.card_last_four && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#818cf8' }}>
                                    • <CreditCard size={10} /> •••• {stmt.card_last_four}
                                  </span>
                                )}
                                {(stmt.mail_from || stmt.source_email) && (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#94a3b8' }} title={`Source Email: ${stmt.mail_from || stmt.source_email}`}>
                                    • <Mail size={10} style={{ color: '#38bdf8' }} /> {stmt.mail_from || stmt.source_email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                            {stmt.file_url && (
                              <a
                                href={stmt.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: 'var(--accent-primary)',
                                  padding: '0.2rem 0.35rem',
                                  borderRadius: '4px',
                                  background: 'rgba(56, 189, 248, 0.1)',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                                title="View / Download Statement"
                              >
                                <Download size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Attached Uploaded Documents */}
                      {attachedDocuments.map((doc: ProjectDocument) => (
                        <div
                          key={`doc-${doc.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.35rem 0.6rem',
                            background: 'rgba(255, 255, 255, 0.04)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem'
                          }}
                        >
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
                  );
                })()}
              </div>
            </div>

            {/* Footer Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.85rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontFamily: 'var(--font-mono)'
                }}
              >
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
                  title="Archive Bank"
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

      {/* Modal for managing bank statement password */}
      {activePasswordModalBank && (
        <ManageBankPasswordModal
          isOpen={!!activePasswordModalBank}
          bank={activePasswordModalBank}
          onClose={() => setActivePasswordModalBank(null)}
          onSave={async (bankId, password) => {
            await handleSavePassword(bankId, password);
            setActivePasswordModalBank(null);
          }}
        />
      )}

      {/* Modal for managing bank tags */}
      {activeTagModalBank && (
        <ManageBankTagsModal
          isOpen={!!activeTagModalBank}
          bank={activeTagModalBank}
          onClose={() => setActiveTagModalBank(null)}
          onSave={async (bankId, tags) => {
            if (onUpdateTags) {
              await onUpdateTags(bankId, tags);
            }
            setActiveTagModalBank(null);
          }}
        />
      )}
      {/* Modal for managing card statement password */}
      {activePasswordModalCard && (
        <ManageCardPasswordModal
          isOpen={!!activePasswordModalCard}
          card={activePasswordModalCard}
          onClose={() => setActivePasswordModalCard(null)}
          onSave={async (cardId, password) => {
            await api.updateCardPassword(cardId, password);
            setActivePasswordModalCard(null);
          }}
        />
      )}
    </>
  );
};
