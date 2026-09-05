import React, { useEffect, useState } from 'react';
import { Eye, DollarSign, FileSpreadsheet, Filter, PieChart, Search, Trash2, TrendingUp, Upload, Sparkles, Building2, Calendar, FileText, CreditCard } from 'lucide-react';
import { ViewPdfModal } from './ViewPdfModal';


import { Expense, ExpenseSummary, Project } from '../types';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/dateUtils';

import * as api from '../services/api';
import { PdfPasswordModal } from './PdfPasswordModal';
import { UnlockPdfModal } from './UnlockPdfModal';
import { StagingDataState } from './ExpenseStagingPage';
import { Select } from './ui/Select';



interface ExpensePageProps {
  projects: Project[];
  currency?: string;
  onStagingReady?: (data: StagingDataState) => void;
}

export const ExpensePage: React.FC<ExpensePageProps> = ({ projects, currency = 'USD', onStagingReady }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [pdfModalData, setPdfModalData] = useState<{ pdfUrl: string; filename: string } | null>(null);

  const [lockedFile, setLockedFile] = useState<{ file: File; projectId?: number } | null>(null);
  const [uploadProjectTarget, setUploadProjectTarget] = useState<string>('');
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);




  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.fetchExpenses(selectedCategory, searchQuery, selectedProjectId);
      setExpenses(res.expenses);
      setSummary(res.summary);
    } catch (error) {
      console.error('Failed to load expenses', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory, searchQuery, selectedProjectId]);

  const handleUnlockAndUpload = (password: string) => {

    if (!lockedFile) return;
    const isPdf = lockedFile.file.name.toLowerCase().endsWith('.pdf');
    const objectUrl = URL.createObjectURL(lockedFile.file);
    const matchedProj = projects.find((p) => p.id === lockedFile.projectId);

    const initialStagingData: StagingDataState = {
      draftId: `draft-temp-${Date.now()}`,
      filename: lockedFile.file.name,
      pdfUrl: objectUrl,
      isPdf: isPdf,
      file: lockedFile.file,
      password: password,
      isExtracting: true,
      projectId: lockedFile.projectId,
      projectTitle: matchedProj?.title,
      items: []
    };

    setLockedFile(null);
    if (onStagingReady) {
      onStagingReady(initialStagingData);
    }
  };


  const handleDeleteExpense = async (id: number) => {
    try {
      await api.deleteExpense(id);
      setExpenses((prev) => prev.filter((item) => item.id !== id));
      await loadExpenses();
    } catch (error) {
      console.error('Failed to delete expense', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'software':
        return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
      case 'travel':
        return { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' };
      case 'equipment':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'meals':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'marketing':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: '#cbd5e1', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Upper Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399'
            }}
          >
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Total Extracted Expenses
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
              {formatCurrency(summary ? summary.total_amount : 0, currency)}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8'
            }}
          >
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Line-Items Count</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
              {summary ? summary.total_count : 0} items
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8'
            }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Average Expense</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
              {formatCurrency(summary ? summary.avg_amount : 0, currency)}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(236, 72, 153, 0.15)',
              color: '#f472b6'
            }}
          >
            <PieChart size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Top Category</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.2rem' }}>
              {summary ? summary.top_category : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Excel Upload Card */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Extract Expenses from PDF & Spreadsheets
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Upload any PDF bank statement or spreadsheet (`.pdf`, `.xlsx`, `.xls`, `.csv`). Transactions will be
              parsed into structured expense records automatically.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '220px' }}>
              <Select
                value={uploadProjectTarget}
                onChange={(val) => setUploadProjectTarget(val)}
                placeholder="Assign to Bank (Optional)"
                options={[
                  { value: '', label: 'Assign to Bank (Optional)' },
                  ...projects.map((p) => ({
                    value: p.id.toString(),
                    label: p.title
                  }))
                ]}
                buttonStyle={{
                  padding: '0.6rem 0.85rem',
                  fontSize: '0.85rem',
                  background: '#1e293b'
                }}
              />
            </div>

            <button
              onClick={() => setIsUnlockModalOpen(true)}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.12)'
              }}
            >
              <Upload size={16} />
              Upload PDF / Excel
            </button>



          </div>
        </div>
      </div>


      {/* Category Breakdown Progress Bar */}

      {summary && Object.keys(summary.category_breakdown).length > 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.85rem' }}>
            Category Expense Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.entries(summary.category_breakdown).map(([cat, amt]) => {
              const pct = summary.total_amount > 0 ? (amt / summary.total_amount) * 100 : 0;
              const color = getCategoryColor(cat);
              return (
                <div key={cat}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      marginBottom: '0.3rem'
                    }}
                  >
                    <span style={{ color: color.text, fontWeight: 600 }}>{cat}</span>
                    <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(amt, currency)} ({pct.toFixed(1)}%)
                    </span>
                  </div>

                  <div
                    style={{
                      height: '6px',
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: color.text,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls & Table */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: '280px' }}>
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
                placeholder="Search extracted expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            <div style={{ minWidth: '160px' }}>
              <Select
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                icon={<Filter size={15} />}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'Software', label: 'Software' },
                  { value: 'Travel', label: 'Travel' },
                  { value: 'Equipment', label: 'Equipment' },
                  { value: 'Meals', label: 'Meals' },
                  { value: 'Marketing', label: 'Marketing' },
                  { value: 'General', label: 'General' }
                ]}
                size="sm"
              />
            </div>

            <div style={{ minWidth: '160px' }}>
              <Select
                value={selectedProjectId}
                onChange={(val) => setSelectedProjectId(val)}
                icon={<Building2 size={15} />}
                options={[
                  { value: 'all', label: 'All Banks' },
                  ...projects.map((p) => ({
                    value: p.id.toString(),
                    label: p.title
                  }))
                ]}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Extracting & loading expense line items...
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <FileSpreadsheet size={40} style={{ color: 'var(--text-dim)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>
              No expenses extracted yet.
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Upload an Excel spreadsheet above or attach an Excel file to any bank entry to extract expense records
              automatically.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Description / Title</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Bank</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Vendor / Payee</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Action</th>


                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => {
                  const catStyle = getCategoryColor(expense.category);
                  return (
                    <tr
                      key={expense.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <td
                        style={{
                          padding: '0.85rem 0.75rem',
                          color: 'var(--text-dim)',
                          fontFamily: 'var(--font-mono)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Calendar
                          size={13}
                          style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }}
                        />
                        {formatDate(expense.expense_date)}

                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: '#f8fafc' }}>{expense.title}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.73rem',
                            fontWeight: 600,
                            background: catStyle.bg,
                            color: catStyle.text,
                            border: `1px solid ${catStyle.border}`
                          }}
                        >
                          {expense.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span>{expense.project_title || 'Unassigned'}</span>
                          {expense.card_masked_number && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#818cf8' }}>
                              <CreditCard size={11} /> {expense.card_name || expense.card_masked_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>
                        {expense.vendor || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                        {expense.statement_pdf_url || expense.statement_id ? (
                          <button
                            onClick={() =>
                              setPdfModalData({
                                pdfUrl: expense.statement_pdf_url || `/api/v1/statements/${expense.statement_id}/file`,
                                filename: expense.statement_filename || expense.source_filename || 'statement.pdf'
                              })
                            }
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(56, 189, 248, 0.1)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              color: '#38bdf8',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="Click to view Statement PDF"
                          >
                            <FileText size={13} /> {expense.statement_filename || expense.source_filename || 'View Statement'}
                          </button>
                        ) : expense.source_filename ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={12} /> {expense.source_filename}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td
                        style={{
                          padding: '0.85rem 0.75rem',
                          textAlign: 'right',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.9rem'
                        }}
                      >
                        {(() => {
                          const isCredit =
                            expense.transaction_type === 'CR' ||
                            expense.transaction_sign === '+' ||
                            (expense.amount > 0 && expense.transaction_type !== 'DR');
                          const rawAmt = Math.abs(expense.amount);
                          return (
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: isCredit ? '#34d399' : '#f87171'
                                }}
                              >
                                {formatCurrency(rawAmt, currency)}
                              </span>
                              <span
                                style={{
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '12px',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: isCredit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                  color: isCredit ? '#34d399' : '#f87171',
                                  border: isCredit ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(244, 63, 94, 0.35)',
                                  userSelect: 'none'
                                }}
                              >
                                {isCredit ? 'CR' : 'DR'}
                              </span>
                            </div>

                          );
                        })()}
                      </td>



                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {(expense.statement_pdf_url || expense.statement_id) && (
                            <button
                              onClick={() =>
                                setPdfModalData({
                                  pdfUrl: expense.statement_pdf_url || `/api/v1/statements/${expense.statement_id}/file`,
                                  filename: expense.statement_filename || expense.source_filename || 'statement.pdf'
                                })
                              }
                              style={{ color: '#38bdf8', cursor: 'pointer', padding: '0.25rem' }}
                              title="View Statement PDF"
                            >
                              <Eye size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            style={{ color: 'var(--text-dim)', cursor: 'pointer', padding: '0.25rem' }}
                            title="Delete Expense Item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View PDF Modal */}
      {pdfModalData && (
        <ViewPdfModal
          isOpen={!!pdfModalData}
          onClose={() => setPdfModalData(null)}
          pdfUrl={pdfModalData.pdfUrl}
          filename={pdfModalData.filename}
        />
      )}

      {/* Password Modal for Encrypted PDFs */}

      {lockedFile && (
        <PdfPasswordModal
          isOpen={!!lockedFile}
          filename={lockedFile.file.name}
          onClose={() => setLockedFile(null)}
          onSubmit={handleUnlockAndUpload}
        />
      )}

      <UnlockPdfModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        projects={projects}
        onStagingReady={onStagingReady}
      />
    </div>


  );
};




