import React, { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Building2, Trash2, CheckCircle2, Clock, DollarSign, Filter, RefreshCw, Layers } from 'lucide-react';
import { Statement, StatementsResponse, Project } from '../types';
import { formatCurrency } from '../utils/currency';
import { DeleteStatementModal } from './DeleteStatementModal';
import * as api from '../services/api';

interface StatementPageProps {
  projects: Project[];
  currency?: string;
}

export const StatementPage: React.FC<StatementPageProps> = ({ projects, currency = 'USD' }) => {

  const [statements, setStatements] = useState<Statement[]>([]);
  const [stats, setStats] = useState<StatementsResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [deletingStatement, setDeletingStatement] = useState<Statement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
        <span style={{
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
        }}>
          <FileText size={13} /> PDF
        </span>
      );
    }

    return (
      <span style={{
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
      }}>
        <FileSpreadsheet size={13} /> Excel
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Statements</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.total_statements || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>PDF Statements</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.pdf_statements || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Excel Statements</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{stats?.excel_statements || 0}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Statements Value</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
              {formatCurrency(statements.reduce((acc, s) => acc + (parseFloat(String(s.total_amount)) || 0), 0), currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Table Header & Controls */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>Uploaded Bank Statements</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: '#1e293b',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            >
              <option value="all">All Linked Banks</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

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
            title="Refresh Statements Table"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
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
            <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Upload PDF statements in the Expenses tab or from any Bank card.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>File Name</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Bank Account</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>File Type</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Line Items</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Statement Total</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Uploaded At</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((stmt) => (
                  <tr key={stmt.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s ease' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} style={{ color: 'var(--accent-primary)' }} />
                        <span>{stmt.filename}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', color: '#e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building2 size={14} style={{ color: 'var(--text-dim)' }} />
                        <span>{stmt.bank_title}</span>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      {getFormatBadge(stmt.file_type, stmt.filename)}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', color: '#f8fafc', fontWeight: 600 }}>
                      {stmt.expenses_count} expenses
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(stmt.total_amount, stmt.currency || currency)}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        <CheckCircle2 size={12} /> Processed
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} /> {stmt.uploaded_at_formatted}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setDeletingStatement(stmt)}
                        style={{ color: 'var(--text-dim)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Delete Statement Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
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
          formattedAmount={deletingStatement.formatted_amount}
          onClose={() => setDeletingStatement(null)}
          onConfirm={handleConfirmDeleteStatement}
          loading={deleteLoading}
        />
      )}

    </div>
  );
};
