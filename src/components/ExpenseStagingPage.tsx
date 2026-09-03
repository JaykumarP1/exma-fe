import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Trash2, Plus, FileText, Sparkles, Building2, Layers } from 'lucide-react';
import { StagedExpenseItem, confirmStagedExpenses } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { PdfDocumentViewer } from './PdfDocumentViewer';
import { Badge } from './ui';



export interface StagingDataState {
  draftId: string;
  filename: string;
  pdfUrl?: string;
  isPdf: boolean;
  projectId?: number;
  projectTitle?: string;
  readOnly?: boolean;
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
    if (stagingData.readOnly) return;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (stagingData.readOnly) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    if (stagingData.readOnly) return;
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
    if (stagingData.readOnly) return;
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
            <ArrowLeft size={16} /> {stagingData.readOnly ? 'Back to Statements' : 'Back to Expenses'}
          </button>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-glass)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: stagingData.readOnly
                  ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
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
                  {stagingData.readOnly ? 'Statement Preview:' : 'Staging Review:'} {stagingData.filename}
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
                  {stagingData.readOnly ? 'Read Only View' : `${items.length} items staged`}
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
        {!stagingData.readOnly && (
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
        )}
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
            {!stagingData.readOnly && (
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
            )}
          </div>

          {/* Editable Table Container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {items.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileText size={36} style={{ opacity: 0.4, margin: '0 auto 0.5rem auto' }} />
                <div>No expenses extracted from this document.</div>
                {!stagingData.readOnly && (
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
                )}
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
                    {!stagingData.readOnly && <th style={{ padding: '0.6rem 0.3rem', textAlign: 'center', width: '5%' }}></th>}
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
                          disabled={stagingData.readOnly}
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
                          disabled={stagingData.readOnly}
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
                          disabled={stagingData.readOnly}
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
                      {/* Amount input with DR/CR badge & sign */}
                      <td style={{ padding: '0.5rem 0.4rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <Badge
                            variant={item.transaction_type === 'CR' || item.amount_formatted?.startsWith('+') ? 'info' : 'danger'}
                            size="sm"
                          >
                            {item.transaction_type || (item.amount_formatted?.startsWith('+') ? 'CR' : 'DR')}
                          </Badge>


                          <input
                            type="text"
                            value={
                              item.amount_formatted
                                ? item.amount_formatted
                                : (item.transaction_type === 'CR' || item.transaction_sign === '+'
                                    ? `+${Math.abs(item.amount).toFixed(2)}`
                                    : `-${Math.abs(item.amount).toFixed(2)}`)
                            }
                            disabled={stagingData.readOnly}
                            onChange={(e) => {
                              const valStr = e.target.value.replace(/[^0-9.-]/g, '');
                              const valNum = parseFloat(valStr) || 0;
                              handleItemChange(idx, 'amount', valNum);
                              handleItemChange(idx, 'amount_formatted', e.target.value);
                            }}
                            style={{
                              width: '95px',
                              padding: '0.4rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-glass)',
                              color: item.transaction_type === 'CR' || item.amount_formatted?.startsWith('+') ? '#38bdf8' : '#34d399',
                              fontWeight: 700,
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.82rem',
                              textAlign: 'right',
                              outline: 'none'
                            }}
                          />
                        </div>
                      </td>

                      {/* Delete item */}
                      {!stagingData.readOnly && (
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
                      )}

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
