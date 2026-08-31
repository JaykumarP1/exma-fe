import React, { useEffect, useRef, useState } from 'react';
import { DollarSign, FileSpreadsheet, Filter, PieChart, Search, Trash2, TrendingUp, Upload, Sparkles, Building2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Expense, ExpenseSummary, Project } from '../types';
import { formatCurrency } from '../utils/currency';
import * as api from '../services/api';
import { PdfPasswordModal } from './PdfPasswordModal';
import { StagingDataState } from './ExpenseStagingPage';


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
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadProjectTarget, setUploadProjectTarget] = useState<string>('');
  const [lockedFile, setLockedFile] = useState<{ file: File; projectId?: number } | null>(null);


  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    setUploadMessage(null);

    try {
      const projId = uploadProjectTarget ? parseInt(uploadProjectTarget, 10) : undefined;
      const res = await api.parseExpenseFile(file, projId);
      const matchedProj = projects.find((p) => p.id === projId);
      const data: StagingDataState = {
        draftId: res.draft_id,
        filename: res.filename,
        pdfUrl: res.pdf_url,
        isPdf: res.is_pdf,
        projectId: projId,
        projectTitle: matchedProj?.title,
        items: res.expenses
      };
      if (onStagingReady) {
        onStagingReady(data);
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('PDF_LOCKED') || err.message.includes('password-protected'))) {
        const projId = uploadProjectTarget ? parseInt(uploadProjectTarget, 10) : undefined;
        setLockedFile({ file, projectId: projId });
      } else {
        setUploadMessage(`Upload failed: ${err.message || 'Error processing file.'}`);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUnlockAndUpload = async (password: string) => {
    if (!lockedFile) return;
    setUploading(true);
    setUploadMessage(null);
    try {
      const res = await api.parseExpenseFile(lockedFile.file, lockedFile.projectId, password);
      const matchedProj = projects.find((p) => p.id === lockedFile.projectId);
      setLockedFile(null);
      const data: StagingDataState = {
        draftId: res.draft_id,
        filename: res.filename,
        pdfUrl: res.pdf_url,
        isPdf: res.is_pdf,
        projectId: lockedFile.projectId,
        projectTitle: matchedProj?.title,
        items: res.expenses
      };
      if (onStagingReady) {
        onStagingReady(data);
      }
    } catch (err: any) {
      alert(`Unlock failed: ${err.message || 'Incorrect PDF password.'}`);
    } finally {
      setUploading(false);
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
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Extracted Expenses</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
              {formatCurrency(summary ? summary.total_amount : 0, currency)}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
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
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
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
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
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
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>Extract Expenses from PDF & Spreadsheets</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Upload any PDF bank statement or spreadsheet (`.pdf`, `.xlsx`, `.xls`, `.csv`). Transactions will be parsed into structured expense records automatically.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              value={uploadProjectTarget}
              onChange={(e) => setUploadProjectTarget(e.target.value)}
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: '#1e293b',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="">Assign to Bank (Optional)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.7 : 1
              }}
            >
              <Upload size={16} />
              {uploading ? 'Extracting Rows...' : 'Upload PDF / Excel File'}
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.xls,.xlsx,.csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              style={{ display: 'none' }}
            />

          </div>
        </div>

        {uploadMessage && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: uploadMessage.startsWith('Success') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${uploadMessage.startsWith('Success') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: uploadMessage.startsWith('Success') ? '#34d399' : '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{uploadMessage}</span>
          </div>
        )}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: color.text, fontWeight: 600 }}>{cat}</span>
                    <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                      ${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color.text, borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls & Table */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1', minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: '1' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: '#1e293b',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="all">All Categories</option>
                <option value="Software">Software</option>
                <option value="Travel">Travel</option>
                <option value="Equipment">Equipment</option>
                <option value="Meals">Meals</option>
                <option value="Marketing">Marketing</option>
                <option value="General">General</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: '#1e293b',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="all">All Banks</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
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
              Upload an Excel spreadsheet above or attach an Excel file to any bank entry to extract expense records automatically.
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
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Source File</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => {
                  const catStyle = getCategoryColor(expense.category);
                  return (
                    <tr key={expense.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s ease' }}>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                        <Calendar size={13} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: 'middle' }} />
                        {expense.expense_date || 'N/A'}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                        {expense.title}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.73rem',
                          fontWeight: 600,
                          background: catStyle.bg,
                          color: catStyle.text,
                          border: `1px solid ${catStyle.border}`
                        }}>
                          {expense.category}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>
                        {expense.project_title || 'Unassigned'}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>
                        {expense.vendor || '—'}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                        {expense.source_filename ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={12} /> {expense.source_filename}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                        {formatCurrency(expense.amount, expense.currency || currency)}
                      </td>

                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          style={{ color: 'var(--text-dim)', cursor: 'pointer', padding: '0.25rem' }}
                          title="Delete Expense Item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Modal for Encrypted PDFs */}
      {lockedFile && (
        <PdfPasswordModal
          isOpen={!!lockedFile}
          filename={lockedFile.file.name}
          onClose={() => setLockedFile(null)}
          onSubmit={handleUnlockAndUpload}
        />
      )}
    </div>
  );
};



