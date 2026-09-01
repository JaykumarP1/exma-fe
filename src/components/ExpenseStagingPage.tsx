import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Trash2, Plus, FileText, Sparkles, Building2, Layers } from 'lucide-react';
import { StagedExpenseItem, confirmStagedExpenses } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { PdfDocumentViewer } from './PdfDocumentViewer';

export interface StagingDataState {
  draftId: string;
  filename: string;
  pdfUrl?: string;
  isPdf: boolean;
  projectId?: number;
  projectTitle?: string;
  items: StagedExpenseItem[];
}

interface ExpenseStagingPageProps {
  stagingData: StagingDataState;
  currency?: string;
  onCancel: () => void;
  onConfirmSuccess: (count: number, filename: string) => void;
}

export const ExpenseStagingPage: React.FC<ExpenseStagingPageProps> = ({
  stagingData,
  currency = 'USD',
  onCancel,
  onConfirmSuccess
}) => {
  const [items, setItems] = useState<StagedExpenseItem[]>(
    stagingData.items.map((item, index) => ({ ...item, id: `item-${index}` }))
  );

  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleItemChange = (index: number, field: keyof StagedExpenseItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        title: 'New Expense Row',
        category: 'General',
        amount: 0.0,
        expense_date: new Date().toISOString().split('T')[0],
        vendor: '—'
      }
    ]);
  };

  const totalSum = items.reduce((acc, curr) => acc + (parseFloat(String(curr.amount)) || 0), 0);

  const handleConfirm = async () => {
    setConfirming(true);
    setErrorMsg(null);
    try {
      const res = await confirmStagedExpenses({
        draft_id: stagingData.draftId,
        filename: stagingData.filename,
        project_id: stagingData.projectId,
        expenses: items.map(({ id, ...rest }) => rest)
      });
      onConfirmSuccess(res.expenses.length, stagingData.filename);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to confirm expenses.');
      setConfirming(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '1rem' }}>
      {/* Top Navigation Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} /> Back to Expenses
          </button>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-glass)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  Staging Review: {stagingData.filename}
                </h3>
                <span
                  style={{
                    padding: '0.15rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {items.length} items staged
                </span>
                {stagingData.projectTitle && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Building2 size={12} /> {stagingData.projectTitle}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onCancel}
            disabled={confirming}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Discard
          </button>

          <button
            onClick={handleConfirm}
            disabled={confirming || items.length === 0}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background:
                confirming || items.length === 0
                  ? 'rgba(99, 102, 241, 0.4)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: confirming || items.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
            }}
          >
            <CheckCircle2 size={16} className={confirming ? 'animate-spin' : ''} />
            <span>{confirming ? 'Saving Expenses...' : `Confirm & Save ${items.length} Expenses`}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.15)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.85rem'
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Full-Page Split Screen Body (50/50 Layout) */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0 }}>
        {/* Left Half: Editable Staging Table (50%) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: '1px solid var(--border-glass)'
          }}
        >
          {/* Table Header Bar */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
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
              <Layers size={16} style={{ color: '#38bdf8' }} />
              <span>Extracted Line Items ({items.length})</span>
            </div>
            <button
              onClick={handleAddRow}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#818cf8',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Plus size={14} /> Add Row
            </button>
          </div>

          {/* Editable Table Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {items.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileText size={36} style={{ opacity: 0.4, margin: '0 auto 0.5rem auto' }} />
                <div>No expenses extracted from this document.</div>
                <button
                  onClick={handleAddRow}
                  style={{
                    marginTop: '0.75rem',
                    color: '#38bdf8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  + Manually add an expense row
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr
                    style={{
                      color: 'var(--text-dim)',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border-glass)'
                    }}
                  >
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', width: '38%' }}>Title / Description</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', width: '22%' }}>Category</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'left', width: '20%' }}>Date</th>
                    <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right', width: '15%' }}>Amount ({currency})</th>
                    <th style={{ padding: '0.6rem 0.3rem', textAlign: 'center', width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {/* Title input */}
                      <td style={{ padding: '0.5rem 0.4rem' }}>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.4rem 0.6rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-glass)',
                            color: '#f8fafc',
                            fontSize: '0.82rem',
                            outline: 'none'
                          }}
                        />
                      </td>
                      {/* Category select */}
                      <td style={{ padding: '0.5rem 0.4rem' }}>
                        <select
                          value={item.category}
                          onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.4rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: '#1e293b',
                            border: '1px solid var(--border-glass)',
                            color: '#f8fafc',
                            fontSize: '0.78rem',
                            outline: 'none'
                          }}
                        >
                          <option value="Software">Software</option>
                          <option value="Travel">Travel</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Meals">Meals</option>
                          <option value="Marketing">Marketing</option>
                          <option value="General">General</option>
                        </select>
                      </td>
                      {/* Date input */}
                      <td style={{ padding: '0.5rem 0.4rem' }}>
                        <input
                          type="date"
                          value={item.expense_date}
                          onChange={(e) => handleItemChange(idx, 'expense_date', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.4rem 0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-glass)',
                            color: '#f8fafc',
                            fontSize: '0.78rem',
                            outline: 'none'
                          }}
                        />
                      </td>
                      {/* Amount input */}
                      <td style={{ padding: '0.5rem 0.4rem' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '0.4rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-glass)',
                            color: '#34d399',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.82rem',
                            textAlign: 'right',
                            outline: 'none'
                          }}
                        />
                      </td>
                      {/* Delete item */}
                      <td style={{ padding: '0.5rem 0.3rem', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          style={{
                            color: 'var(--text-dim)',
                            cursor: 'pointer',
                            padding: '0.2rem',
                            background: 'none',
                            border: 'none'
                          }}
                          title="Remove Line Item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Left Column Summary Bar */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: 'rgba(30, 41, 59, 0.9)',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Staged Total Amount:</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalSum, currency)}
            </div>
          </div>
        </div>

        {/* Right Half: Native Frontend PDF Document Viewer (50%) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <PdfDocumentViewer pdfUrl={stagingData.pdfUrl} filename={stagingData.filename} isPdf={stagingData.isPdf} />
        </div>
      </div>
    </div>
  );
};
