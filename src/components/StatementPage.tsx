import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Building2,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  RefreshCw,
  Layers,
  Unlock,
  Download,
  Sparkles,
  Eye,
  Upload,
  Mail,
  CreditCard
} from 'lucide-react';
import { Statement, StatementsResponse, Project } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/dateUtils';

import { DeleteStatementModal } from './DeleteStatementModal';
import { UnlockPdfModal } from './UnlockPdfModal';
import { ViewPdfModal } from './ViewPdfModal';
import { Select } from './ui/Select';
import { Tooltip } from './Tooltip';

import * as api from '../services/api';

import { StagingDataState } from './ExpenseStagingPage';

interface StatementPageProps {
  projects: Project[];
  currency?: string;
  onStagingReady?: (data: StagingDataState) => void;
}

export const StatementPage: React.FC<StatementPageProps> = ({ projects, currency = 'USD', onStagingReady }) => {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [stats, setStats] = useState<StatementsResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('all');
  const [deletingStatement, setDeletingStatement] = useState<Statement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);


  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [extractingId, setExtractingId] = useState<number | null>(null);
  const [viewingPdfStatement, setViewingPdfStatement] = useState<Statement | null>(null);

  const filteredStatements = statements.filter((stmt) => {
    if (selectedSourceFilter === 'upload') return stmt.source !== 'email' && !stmt.is_email_sync;
    if (selectedSourceFilter === 'email') return stmt.source === 'email' || stmt.is_email_sync;
    return true;
  });


  const loadStatements = async () => {
    try {
      setLoading(true);
      const res = await api.fetchStatements(selectedProjectId);
      setStatements(res.statements);
      setStats(res.stats);
    } catch (error) {
      console.error('Failed to load statements', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractStatement = async (stmt: Statement) => {
    try {
      setExtractingId(stmt.id);
      const res = await api.extractStatementExpenses(stmt.id);
      if (onStagingReady) {
        const stagingData: StagingDataState = {
          draftId: `stmt-${stmt.id}`,
          filename: stmt.filename,
          pdfUrl: stmt.file_url ? (stmt.file_url.startsWith('http') ? stmt.file_url : `http://localhost:4000${stmt.file_url.startsWith('/') ? '' : '/'}${stmt.file_url}`) : undefined,
          isPdf: stmt.file_type?.toLowerCase().includes('pdf') || stmt.filename?.toLowerCase().endsWith('.pdf'),
          projectId: stmt.project_id,
          bankName: stmt.bank_name || stmt.bank_title,
          dueDate: stmt.due_date,
          minimumAmount: stmt.minimum_amount,
          totalDue: stmt.total_due || stmt.total_amount,
          items: (res.expenses || []).map((e: any) => ({
            title: e.title,
            category: e.category,
            amount: e.amount,
            transaction_type: e.transaction_type,
            transaction_sign: e.transaction_sign,
            amount_formatted: e.amount_formatted,
            expense_date: e.expense_date,
            vendor: e.vendor
          }))
        };

        onStagingReady(stagingData);
      } else {
        setToastMessage(res.message || `Extracted ${res.extracted_count} expense(s)`);
        await loadStatements();
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (error: any) {
      console.error('Failed to extract statement expenses', error);
    } finally {
      setExtractingId(null);
    }
  };





  const handleViewPdf = async (stmt: Statement) => {
    if (onStagingReady) {
      try {
        const res = await api.fetchExpenses('all', '', stmt.project_id ? stmt.project_id.toString() : 'all');
        const statementExpenses = (res.expenses || []).filter(
          (e: any) => e.statement_id === stmt.id || e.source_filename === stmt.filename
        );

        const stagingData: StagingDataState = {
          draftId: `stmt-view-${stmt.id}`,
          filename: stmt.filename,
          pdfUrl: stmt.file_url ? (stmt.file_url.startsWith('http') ? stmt.file_url : `http://localhost:4000${stmt.file_url.startsWith('/') ? '' : '/'}${stmt.file_url}`) : `http://localhost:4000/api/v1/statements/${stmt.id}/pdf`,

          isPdf: stmt.file_type?.toLowerCase().includes('pdf') || stmt.filename?.toLowerCase().endsWith('.pdf'),
          projectId: stmt.project_id,
          projectTitle: stmt.bank_title,
          bankName: stmt.bank_name || stmt.bank_title,
          dueDate: stmt.due_date,
          minimumAmount: stmt.minimum_amount,
          totalDue: stmt.total_due || stmt.total_amount,
          readOnly: true,
          items: statementExpenses.map((e: any) => ({
            id: `exp-${e.id}`,
            title: e.title,
            category: e.category,
            amount: e.amount,
            transaction_type: e.transaction_type,
            transaction_sign: e.transaction_sign,
            amount_formatted: e.amount_formatted,
            expense_date: e.expense_date,
            vendor: e.vendor
          }))
        };

        onStagingReady(stagingData);
      } catch (err) {
        console.error('Failed to load statement expenses for preview', err);
      }
    } else {
      setViewingPdfStatement(stmt);
    }
  };

  useEffect(() => {
    loadStatements();
  }, [selectedProjectId]);


  const handleConfirmDeleteStatement = async (deleteExpenses: boolean) => {
    if (!deletingStatement) return;
    try {
      setDeleteLoading(true);
      await api.deleteStatement(deletingStatement.id, deleteExpenses);
      setStatements((prev) => prev.filter((item) => item.id !== deletingStatement.id));
      setDeletingStatement(null);
      await loadStatements();
    } catch (error) {
      console.error('Failed to delete statement', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getFormatBadge = (fileType: string, filename: string) => {
    const lowerType = fileType?.toLowerCase() || '';
    const lowerName = filename?.toLowerCase() || '';
    const isPdf = lowerType.includes('pdf') || lowerName.endsWith('.pdf');

    if (isPdf) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <FileText size={13} /> PDF
        </span>
      );
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: '0.2rem 0.55rem',
          borderRadius: 'var(--radius-xs)',
          fontSize: '0.72rem',
          fontWeight: 700,
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}
      >
        <FileSpreadsheet size={13} /> Excel
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {toastMessage && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div
              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}
            >
              Total Statements
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.total_statements || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171'
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div
              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}
            >
              PDF Statements
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.pdf_statements || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}
          >
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div
              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}
            >
              Excel Statements
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.excel_statements || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}
          >
            <DollarSign size={22} />
          </div>
          <div>
            <div
              style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}
            >
              Statements Value
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
              {formatCurrency(
                statements.reduce((acc, s) => acc + (parseFloat(String(s.total_amount)) || 0), 0),
                currency
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table Header & Controls */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>Uploaded Bank Statements</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ minWidth: '180px' }}>
            <Select
              value={selectedProjectId}
              onChange={(val) => setSelectedProjectId(val)}
              icon={<Filter size={14} />}
              options={[
                { value: 'all', label: 'All Linked Banks' },
                ...projects.map((p) => ({
                  value: p.id.toString(),
                  label: p.title
                }))
              ]}
              size="sm"
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <Select
              value={selectedSourceFilter}
              onChange={(val) => setSelectedSourceFilter(val)}
              icon={<Filter size={14} />}
              options={[
                { value: 'all', label: 'All Sources' },
                { value: 'upload', label: 'Direct Uploads' },
                { value: 'email', label: 'Email Synced' }
              ]}
              size="sm"
            />
          </div>

          <Tooltip content="Upload PDF or Excel Statement File">
            <button
              onClick={() => setIsUnlockModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Upload size={15} />
              <span>Upload PDF / Excel</span>
            </button>
          </Tooltip>




          <Tooltip content="Refresh Statements Table">
            <button
              onClick={loadStatements}
              disabled={loading}
              style={{
                padding: '0.55rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </Tooltip>
        </div>
      </div>


      {/* Statements Table View */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
            <span>Loading statement records...</span>
          </div>
        ) : statements.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>No Statements Found</div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
              Upload PDF statements in the Expenses tab or from any Bank card.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid var(--border-glass)',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    fontSize: '0.72rem',
                    letterSpacing: '0.05em'
                  }}
                >
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>File Name</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Bank Account</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>File Type</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Due Date</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Total Due</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Line Items</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Uploaded At</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStatements.map((stmt) => (
                  <tr
                    key={stmt.id}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s ease' }}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        {stmt.source === 'email' || stmt.is_email_sync ? (
                          <Tooltip content="Statement Synced via Email">
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid rgba(56, 189, 248, 0.35)',
                                color: '#38bdf8',
                                flexShrink: 0
                              }}
                            >
                              <Mail size={13} />
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip content="Statement Uploaded Manually">
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '26px',
                                height: '26px',
                                borderRadius: '6px',
                                background: 'rgba(168, 85, 247, 0.15)',
                                border: '1px solid rgba(168, 85, 247, 0.35)',
                                color: '#c084fc',
                                flexShrink: 0
                              }}
                            >
                              <Upload size={13} />
                            </span>
                          </Tooltip>
                        )}
                        <span>{stmt.filename}</span>
                        {stmt.is_unlocked ? (
                          <Tooltip content="Unlocked PDF Statement (Password Free)">
                            <Unlock size={14} style={{ color: '#38bdf8', cursor: 'pointer', flexShrink: 0 }} />
                          </Tooltip>
                        ) : (
                          (stmt.file_type?.toLowerCase().includes('pdf') || stmt.filename?.toLowerCase().endsWith('.pdf')) && (
                            <Tooltip content="Unlock PDF Statement">
                              <button
                                onClick={() => setIsUnlockModalOpen(true)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#34d399',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Unlock size={14} />
                              </button>
                            </Tooltip>
                          )
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', color: '#e2e8f0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building2 size={14} style={{ color: 'var(--text-dim)' }} />
                          <span>{stmt.bank_name || stmt.bank_title}</span>
                        </div>
                        {stmt.card_masked_number && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#818cf8' }}>
                            <CreditCard size={11} />
                            <span>{stmt.card_name || stmt.card_masked_number}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>{getFormatBadge(stmt.file_type, stmt.filename)}</td>


                    <td style={{ padding: '0.85rem 0.75rem', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 600 }}>
                      {stmt.due_date || '—'}
                    </td>

                    <td
                      style={{
                        padding: '0.85rem 0.75rem',
                        fontWeight: 700,
                        color: '#34d399',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      {formatCurrency(stmt.total_due || stmt.total_amount, currency)}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', color: '#f8fafc', fontWeight: 600 }}>
                      {stmt.expenses_count} expenses
                    </td>


                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          width: 'fit-content'
                        }}
                      >
                        <CheckCircle2 size={12} /> Processed
                      </span>
                    </td>


                    <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-dim)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} /> {formatDateTime(stmt.uploaded_at || stmt.created_at || stmt.uploaded_at_formatted)}
                      </span>
                    </td>


                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem' }}>
                        {/* 1. View / Preview Statement Items (Eye Icon) */}
                        <Tooltip content="View Statement Items & Preview">
                          <button
                            onClick={() => handleViewPdf(stmt)}
                            style={{
                              color: '#38bdf8',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              background: 'transparent',
                              border: 'none',
                              outline: 'none'
                            }}
                          >
                            <Eye size={15} />
                          </button>
                        </Tooltip>

                        {/* 2. Re-extract / Parse Statement (Sparkles Icon) */}
                        <Tooltip content={stmt.expenses_count === 0 ? 'Extract Expense Data from Statement' : 'Re-extract Expense Data from Statement'}>
                          <button
                            onClick={() => handleExtractStatement(stmt)}
                            disabled={extractingId === stmt.id}
                            style={{
                              color: stmt.expenses_count === 0 ? '#a78bfa' : 'var(--text-dim)',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              background: 'transparent',
                              border: 'none',
                              outline: 'none'
                            }}
                          >
                            {extractingId === stmt.id ? (
                              <RefreshCw size={15} className="animate-spin" />
                            ) : (
                              <Sparkles size={15} />
                            )}
                          </button>
                        </Tooltip>

                        {/* 3. Download Statement File (Download Icon) */}
                        <Tooltip content="Download Statement File">
                          <a
                            href={stmt.file_url ? `http://localhost:4000${stmt.file_url}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!stmt.file_url) {
                                e.preventDefault();
                                handleViewPdf(stmt);
                              }
                            }}
                            style={{ color: '#34d399', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                          >
                            <Download size={15} />
                          </a>
                        </Tooltip>

                        {/* 4. Delete Statement Record (Trash Icon) */}
                        <Tooltip content="Delete Statement Record">
                          <button
                            onClick={() => setDeletingStatement(stmt)}
                            style={{ color: 'var(--text-dim)', cursor: 'pointer', padding: '0.25rem', background: 'transparent', border: 'none' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </Tooltip>
                      </div>
                    </td>


                  </tr>
                ))}
                {filteredStatements.length === 0 && statements.length > 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No statements found matching the selected source filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Statement Modal */}
      {deletingStatement && (
        <DeleteStatementModal
          isOpen={!!deletingStatement}
          filename={deletingStatement.filename}
          bankTitle={deletingStatement.bank_title}
          expensesCount={deletingStatement.expenses_count}
          formattedAmount={formatCurrency(deletingStatement.total_amount, currency)}

          onClose={() => setDeletingStatement(null)}
          onConfirm={handleConfirmDeleteStatement}
          loading={deleteLoading}
        />
      )}

      {/* Unlock PDF Modal */}
      <UnlockPdfModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        projects={projects}
        onStagingReady={onStagingReady}
      />




      {/* View PDF Statement Modal */}
      {viewingPdfStatement && (
        <ViewPdfModal
          isOpen={!!viewingPdfStatement}
          onClose={() => setViewingPdfStatement(null)}
          pdfUrl={viewingPdfStatement.file_url}
          filename={viewingPdfStatement.filename}
          isPdf={viewingPdfStatement.file_type?.toLowerCase().includes('pdf') || viewingPdfStatement.filename?.toLowerCase().endsWith('.pdf')}
        />
      )}

    </div>
  );
};

