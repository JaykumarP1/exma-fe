import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, Trash2, Plus, FileText, Sparkles, Building2, Layers, Calendar, Clock, Lock, Unlock } from 'lucide-react';




import { StagedExpenseItem, confirmStagedExpenses, parseExpenseFile } from '../services/api';
import { formatCurrency } from '../utils/currency';
import { PdfDocumentViewer } from './PdfDocumentViewer';
import { Select, SelectOption } from './ui/Select';

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'Software', label: 'Software' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Equipment', label: 'Equipment' },
  { value: 'Meals', label: 'Meals' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'General', label: 'General' },
];

export interface StagingDataState {
  draftId?: string;
  filename: string;
  pdfUrl?: string;
  isPdf: boolean;
  file?: File;
  projectId?: number;
  projectTitle?: string;
  readOnly?: boolean;
  isExtracting?: boolean;
  bankName?: string;
  statementDate?: string;
  dueDate?: string;
  minimumAmount?: number;
  totalDue?: number;
  password?: string;
  unlockAndStore?: boolean;
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

  const [bankName, setBankName] = useState<string>(
    stagingData.bankName || stagingData.projectTitle || 'Kotak'
  );
  const [statementDate, setStatementDate] = useState<string>(stagingData.statementDate || '');
  const [dueDate, setDueDate] = useState<string>(stagingData.dueDate || '');
  const [minimumAmount, setMinimumAmount] = useState<number>(stagingData.minimumAmount || 0);
  const [totalDue, setTotalDue] = useState<number>(stagingData.totalDue || 0);

  const [isExtracting, setIsExtracting] = useState<boolean>(!!stagingData.isExtracting);
  const [currentDraftId, setCurrentDraftId] = useState<string>(stagingData.draftId || '');
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | undefined>(stagingData.pdfUrl);

  const [confirming, setConfirming] = useState(false);
  const [unlockAndStore, setUnlockAndStore] = useState<boolean>(stagingData.unlockAndStore ?? false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (stagingData.file && stagingData.isExtracting && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      setIsExtracting(true);
      setErrorMsg(null);

      parseExpenseFile(stagingData.file, stagingData.projectId, stagingData.password)
        .then((res) => {
          const parsedItems = (res.expenses || []).map((item, index) => ({ ...item, id: `item-${index}` }));
          setItems(parsedItems);
          if (res.bank_name) setBankName(res.bank_name);
          if (res.statement_date) setStatementDate(res.statement_date);
          if (res.due_date) setDueDate(res.due_date);
          if (res.minimum_amount != null) setMinimumAmount(res.minimum_amount);
          if (res.total_due != null) setTotalDue(res.total_due);
          if (res.draft_id) {
            setCurrentDraftId(res.draft_id);
            const newUrl = `${window.location.pathname}?draft_id=${encodeURIComponent(res.draft_id)}`;
            window.history.replaceState(null, '', newUrl);
          }
          if (res.pdf_url) setCurrentPdfUrl(res.pdf_url);
          setIsExtracting(false);
        })
        .catch((err: any) => {
          console.error('AI extraction error on staging page:', err);
          setErrorMsg(err.message || 'Failed to extract expense data with Gemini AI.');
          setIsExtracting(false);
        });
    }
  }, [stagingData.file, stagingData.isExtracting]);




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

  const isCreditItem = (item: StagedExpenseItem): boolean => {
    return (
      item.transaction_type === 'CR' ||
      item.transaction_sign === '+' ||
      item.amount_formatted?.trim().startsWith('+') === true
    );
  };

  const getItemSignedAmount = (item: StagedExpenseItem): number => {
    const rawVal = Math.abs(parseFloat(String(item.amount)) || 0);
    return isCreditItem(item) ? rawVal : -rawVal;
  };

  const totalDebits = items
    .filter((i) => !isCreditItem(i))
    .reduce((acc, curr) => acc + Math.abs(parseFloat(String(curr.amount)) || 0), 0);

  const totalCredits = items
    .filter((i) => isCreditItem(i))
    .reduce((acc, curr) => acc + Math.abs(parseFloat(String(curr.amount)) || 0), 0);

  // Net total taking + (credits) and - (debits) together
  const netSignedTotal = items.reduce((acc, curr) => acc + getItemSignedAmount(curr), 0);
  const totalSum = Math.abs(totalDebits - totalCredits);


  const handleConfirm = async () => {
    if (stagingData.readOnly) return;
    setConfirming(true);
    setErrorMsg(null);
    try {
      const res = await confirmStagedExpenses({
        draft_id: currentDraftId || stagingData.draftId || 'draft-1',
        filename: stagingData.filename,
        project_id: stagingData.projectId,
        bank_name: bankName,
        statement_date: statementDate,
        due_date: dueDate,
        minimum_amount: minimumAmount,
        total_due: totalDue > 0 ? totalDue : totalSum,
        unlock_and_store: unlockAndStore,
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
                {/* Statement ID / Draft ID Badge */}
                <span
                  style={{
                    padding: '0.15rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  Statement ID: #{currentDraftId || stagingData.draftId || 'N/A'}
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
            {stagingData.password && (
              <button
                type="button"
                onClick={() => setUnlockAndStore(!unlockAndStore)}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: unlockAndStore ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: unlockAndStore ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)',
                  color: unlockAndStore ? '#34d399' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title={unlockAndStore ? 'Decrypted PDF will be permanently stored (password-free preview)' : 'PDF will remain locked with your password after saving'}
              >
                {unlockAndStore ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{unlockAndStore ? 'Unlock & Store Decrypted' : 'Lock with Password'}</span>
              </button>
            )}

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

      {/* Extracted Statement Summary Card (Bank Name, Statement Date, Due Date, Min Due, Total Due) */}
      <div
        className="glass-panel"
        style={{
          padding: '0.85rem 1.25rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid var(--border-glass)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Bank Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}
            >
              <Building2 size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Bank Name
              </div>
              <input
                type="text"
                value={bankName}
                disabled={stagingData.readOnly}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank Name"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  outline: 'none',
                  width: '140px'
                }}
              />
            </div>
          </div>

          {/* Statement Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc'
              }}
            >
              <Calendar size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Statement Date
              </div>
              <input
                type="text"
                value={statementDate || '—'}
                disabled={stagingData.readOnly}
                onChange={(e) => setStatementDate(e.target.value)}
                placeholder="Statement Date"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#c084fc',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  outline: 'none',
                  width: '130px'
                }}
              />
            </div>
          </div>

          {/* Payment Due Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Clock size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Payment Due Date
              </div>
              <input
                type="text"
                value={dueDate || '—'}
                disabled={stagingData.readOnly}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="Due Date"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  outline: 'none',
                  width: '130px'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Minimum Amount Due */}
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>
              Minimum Amount Due
            </div>
            <input
              type="number"
              value={minimumAmount}
              disabled={stagingData.readOnly}
              onChange={(e) => setMinimumAmount(parseFloat(e.target.value) || 0)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fb7185',
                fontSize: '0.95rem',
                fontWeight: 800,
                outline: 'none',
                textAlign: 'right',
                width: '100px'
              }}
            />
          </div>

          {/* Total Amount Due */}
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>
              Total Amount Due
            </div>
            <input
              type="number"
              value={totalDue > 0 ? totalDue : totalSum}
              disabled={stagingData.readOnly}
              onChange={(e) => setTotalDue(parseFloat(e.target.value) || 0)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#34d399',
                fontSize: '1.1rem',
                fontWeight: 800,
                outline: 'none',
                textAlign: 'right',
                width: '110px'
              }}
            />
          </div>
        </div>

      </div>



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
            {isExtracting ? (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                    border: '2px solid #818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                    boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)'
                  }}
                >
                  <Sparkles size={28} className="animate-spin" style={{ color: '#c084fc' }} />
                </div>

                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>
                  Gemini AI Vision Analyzing Statement...
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '360px', marginBottom: '2rem', lineHeight: 1.5 }}>
                  Extracting line items, bank name, statement date, due date & credit/debit amounts...
                </p>

                {/* Animated Table Skeleton Rows */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: '42px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        opacity: 1 - i * 0.12
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : items.length === 0 ? (
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
                      {/* Category custom select */}
                      <td style={{ padding: '0.5rem 0.4rem', minWidth: '125px' }}>
                        <Select
                          value={item.category || 'General'}
                          disabled={stagingData.readOnly}
                          onChange={(val) => handleItemChange(idx, 'category', val)}
                          options={CATEGORY_OPTIONS}
                          size="sm"
                          buttonStyle={{
                            background: '#1e293b',
                            border: '1px solid var(--border-glass)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        />
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
                      {/* Amount input with DR/CR editable select dropdown & sign */}
                      <td style={{ padding: '0.5rem 0.4rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          {/* Editable DR/CR Dropdown using Select */}
                          <div style={{ width: '68px', flexShrink: 0 }}>
                            <Select
                              value={item.transaction_type || (item.amount_formatted?.startsWith('+') ? 'CR' : 'DR')}
                              disabled={stagingData.readOnly}
                              onChange={(val) => {
                                const newType = val as 'DR' | 'CR';
                                const newSign = newType === 'CR' ? '+' : '-';
                                const rawNum = Math.abs(parseFloat(String(item.amount)) || 0);
                                const newFormatted = rawNum > 0 ? rawNum.toFixed(2) : '';

                                handleItemChange(idx, 'transaction_type', newType);
                                handleItemChange(idx, 'transaction_sign', newSign);
                                handleItemChange(idx, 'amount_formatted', newFormatted);
                              }}
                              options={[
                                { value: 'DR', label: 'DR' },
                                { value: 'CR', label: 'CR' }
                              ]}
                              size="sm"
                              buttonStyle={{
                                padding: '0.2rem 0.35rem',
                                borderRadius: '12px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background:
                                  (item.transaction_type || (item.amount_formatted?.startsWith('+') ? 'CR' : 'DR')) === 'CR'
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : 'rgba(244, 63, 94, 0.2)',
                                border:
                                  (item.transaction_type || (item.amount_formatted?.startsWith('+') ? 'CR' : 'DR')) === 'CR'
                                    ? '1px solid rgba(16, 185, 129, 0.4)'
                                    : '1px solid rgba(244, 63, 94, 0.4)',
                                color:
                                  (item.transaction_type || (item.amount_formatted?.startsWith('+') ? 'CR' : 'DR')) === 'CR'
                                    ? '#34d399'
                                    : '#f87171'
                              }}
                              menuStyle={{
                                minWidth: '68px'
                              }}
                            />
                          </div>

                          <input
                            type="text"
                            value={
                              item.amount_formatted != null
                                ? String(item.amount_formatted).replace(/^[-+]/, '')
                                : Math.abs(item.amount).toFixed(2)
                            }
                            disabled={stagingData.readOnly}
                            onChange={(e) => {
                              const inputVal = e.target.value;
                              const valStr = inputVal.replace(/[^0-9.]/g, '');
                              const valNum = parseFloat(valStr) || 0;
                              handleItemChange(idx, 'amount', valNum);
                              handleItemChange(idx, 'amount_formatted', valStr);
                            }}

                            style={{
                              width: '95px',
                              padding: '0.4rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-glass)',
                              color:
                                (item.transaction_type || (item.amount_formatted?.startsWith('+') ? 'CR' : 'DR')) === 'CR'
                                  ? '#34d399'
                                  : '#f87171',
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
              padding: '0.75rem 1.25rem',
              background: 'rgba(30, 41, 59, 0.95)',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Debits: </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(totalDebits, currency)}
                </span>
              </div>
              {totalCredits > 0 && (
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Credits: </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(totalCredits, currency)}
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Net Staged Total:</div>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: netSignedTotal >= 0 ? '#34d399' : '#f87171',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {formatCurrency(Math.abs(netSignedTotal), currency)}
              </div>
            </div>
          </div>


        </div>

        {/* Right Half: Native Frontend PDF Document Viewer (50%) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <PdfDocumentViewer
            pdfUrl={currentPdfUrl || stagingData.pdfUrl}
            filename={stagingData.filename}
            isPdf={stagingData.isPdf}
            password={stagingData.password}
          />
        </div>

      </div>
    </div>
  );
};
