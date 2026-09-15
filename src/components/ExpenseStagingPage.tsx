import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Plus,
  Sparkles,
  Building2,
  Layers,
  Calendar,
  Clock,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CreditCard
} from 'lucide-react';

import {
  StagedExpenseItem,
  confirmStagedExpenses,
  parseExpenseFile,
  updateStatement,
  unlockExistingStatement,
  extractStatementExpenses
} from '../services/api';
import { Card, Project } from '../types';
import { formatCurrency } from '../utils/currency';
import { PdfDocumentViewer } from './PdfDocumentViewer';
import { Select, SelectOption } from './ui/Select';
import { LinkBankModal } from './LinkBankModal';
import { LinkCardModal } from './LinkCardModal';
import { getCategorySelectOptions, saveCategory } from '../services/categories';

export interface StagingDataState {
  draftId?: string;
  filename: string;
  pdfUrl?: string;
  isPdf: boolean;
  statementId?: number;
  isExistingStatement?: boolean;
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
  cardId?: number;
  cardName?: string;
  cardMaskedNumber?: string;
  cardLastFour?: string;
  cardType?: string;
  isCreditCard?: boolean;
  items: StagedExpenseItem[];
}

interface ExpenseStagingPageProps {
  stagingData: StagingDataState;
  currency?: string;
  projects?: Project[];
  onBankCreated?: (newBank: Project) => void;
  onCardCreated?: (newCard: Card) => void;
  onCancel: () => void;
  onConfirmSuccess: (count: number, filename: string) => void;
}

export const ExpenseStagingPage: React.FC<ExpenseStagingPageProps> = ({
  stagingData,
  currency = '$',
  projects = [],
  onBankCreated,
  onCardCreated,
  onCancel,
  onConfirmSuccess
}) => {
  const [items, setItems] = useState<StagedExpenseItem[]>(stagingData.items);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>(() =>
    getCategorySelectOptions(stagingData.items.map((i) => i.category || ''))
  );

  const handleCreateCategory = (idx: number, newCat: string) => {
    const updatedCategories = saveCategory(newCat);
    setCategoryOptions(getCategorySelectOptions(updatedCategories));
    const formatted = newCat.trim().charAt(0).toUpperCase() + newCat.trim().slice(1);
    handleItemChange(idx, 'category', formatted);
  };

  const [projectId, setProjectId] = useState<number | undefined>(stagingData.projectId);
  const [isLinkBankModalOpen, setIsLinkBankModalOpen] = useState(false);
  const [bankName, setBankName] = useState<string>(stagingData.bankName || '');
  const [statementDate, setStatementDate] = useState<string>(stagingData.statementDate || '');
  const [dueDate, setDueDate] = useState<string>(stagingData.dueDate || '');
  const [minimumAmount, setMinimumAmount] = useState<number>(stagingData.minimumAmount || 0);
  const [totalDue, setTotalDue] = useState<number>(stagingData.totalDue || 0);
  const [linkSuccessToast, setLinkSuccessToast] = useState<string | null>(null);

  const [cardId, setCardId] = useState<number | undefined>(stagingData.cardId);
  const [cardName, setCardName] = useState<string>(stagingData.cardName || '');
  const [cardMaskedNumber, setCardMaskedNumber] = useState<string>(stagingData.cardMaskedNumber || '');
  const [cardLastFour, setCardLastFour] = useState<string>(stagingData.cardLastFour || '');
  const [cardType, setCardType] = useState<string>(stagingData.cardType || '');
  const [isCreditCard, setIsCreditCard] = useState<boolean>(stagingData.isCreditCard ?? false);
  const [isLinkCardModalOpen, setIsLinkCardModalOpen] = useState(false);

  const [password, setPassword] = useState<string>(stagingData.password || '');
  const [isExtractingData, setIsExtractingData] = useState<boolean>(false);
  const [showExtractPasswordModal, setShowExtractPasswordModal] = useState<boolean>(false);
  const [extractPasswordInput, setExtractPasswordInput] = useState<string>(stagingData.password || '');
  const [showExtractPassword, setShowExtractPassword] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isPdfLocked, setIsPdfLocked] = useState<boolean>(false);

  const [isExtracting, setIsExtracting] = useState<boolean>(!!stagingData.isExtracting);
  const [currentDraftId, setCurrentDraftId] = useState<string>(stagingData.draftId || '');
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | undefined>(stagingData.pdfUrl);

  const [confirming, setConfirming] = useState(false);
  const [unlockAndStore, setUnlockAndStore] = useState<boolean>(stagingData.unlockAndStore ?? true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isExistingStatement = !!(
    stagingData.isExistingStatement ||
    stagingData.statementId ||
    (stagingData.draftId && stagingData.draftId.startsWith('stmt-view-')) ||
    (currentDraftId && currentDraftId.startsWith('stmt-view-'))
  );

  // Auto-detect last 4 from filename if missing
  useEffect(() => {
    if (!cardLastFour && stagingData.filename) {
      const endMatch = stagingData.filename.match(/[_\-](\d{4})\.pdf$/i);
      if (endMatch) {
        setCardLastFour(endMatch[1]);
        setIsCreditCard(true);
      } else {
        const m = stagingData.filename.match(/(\d{15,16})_/);
        if (m) {
          setCardLastFour(m[1].slice(-4));
          setIsCreditCard(true);
        } else {
          const generalMatch = stagingData.filename.match(/[_\-](\d{4})[_\-\.]/);
          if (generalMatch) {
            setCardLastFour(generalMatch[1]);
            setIsCreditCard(true);
          }
        }
      }
    }
  }, [stagingData.filename, cardLastFour]);

  const linkedBank = projects.find((p) => p.id === projectId);
  const isLinked = !!linkedBank;
  const shouldShowCard = isCreditCard || !!cardId || !!cardLastFour || !!minimumAmount || !!totalDue || !!dueDate;

  const handleSelectBank = async (bank: Project) => {
    setProjectId(bank.id);
    setBankName(bank.title);

    const activeDraftId = currentDraftId || stagingData.draftId || '';
    if (activeDraftId.startsWith('stmt-view-')) {
      const stmtId = parseInt(activeDraftId.replace('stmt-view-', ''), 10);
      if (!isNaN(stmtId)) {
        try {
          await updateStatement(stmtId, { bank_id: bank.id, bank_name: bank.title });
        } catch (e) {
          console.error('Failed to update statement bank in backend', e);
        }
      }
    }

    setLinkSuccessToast(`Bank linked to "${bank.title}"`);
    setTimeout(() => setLinkSuccessToast(null), 3500);
  };

  const handleSelectCard = async (selectedCard: Card) => {
    setCardId(selectedCard.id);
    setCardLastFour(selectedCard.last_four || selectedCard.card_number?.slice(-4) || '');
    setCardName(selectedCard.card_name || '');
    setCardMaskedNumber(selectedCard.masked_number || '');
    setCardType(selectedCard.card_type || '');
    setIsCreditCard(true);

    const activeDraftId = currentDraftId || stagingData.draftId || '';
    if (activeDraftId.startsWith('stmt-view-')) {
      const stmtId = parseInt(activeDraftId.replace('stmt-view-', ''), 10);
      if (!isNaN(stmtId)) {
        try {
          await updateStatement(stmtId, { card_id: selectedCard.id });
        } catch (e) {
          console.error('Failed to update statement card in backend', e);
        }
      }
    }

    setLinkSuccessToast(`Card linked to "${selectedCard.card_name || selectedCard.masked_number || 'Card'}"`);
    setTimeout(() => setLinkSuccessToast(null), 3500);
  };

  const hasFetchedRef = useRef(false);

  const runExtraction = async (pwdToUse: string) => {
    setIsExtractingData(true);
    setExtractError(null);
    setErrorMsg(null);

    const activeDraftId = currentDraftId || stagingData.draftId || '';

    try {
      if (activeDraftId.startsWith('stmt-view-')) {
        const stmtId = parseInt(activeDraftId.replace('stmt-view-', ''), 10);
        if (isNaN(stmtId)) throw new Error('Invalid statement ID');

        const res = pwdToUse.trim()
          ? await unlockExistingStatement(stmtId, pwdToUse.trim(), unlockAndStore)
          : await extractStatementExpenses(stmtId);

        const parsedExpenses = (res.expenses || []).map((e: any, idx: number) => ({
          id: `exp-${e.id || idx}`,
          title: e.title || 'Extracted Item',
          category: e.category || 'General',
          amount: e.amount,
          transaction_type: e.transaction_type,
          transaction_sign: e.transaction_sign,
          amount_formatted: e.amount_formatted,
          expense_date: e.expense_date,
          vendor: e.vendor || '—'
        }));

        setItems(parsedExpenses);
        setCategoryOptions(getCategorySelectOptions(parsedExpenses.map((i: any) => i.category || '')));

        if (res.statement) {
          if (res.statement.bank_name || res.statement.bank_title) {
            setBankName(res.statement.bank_name || res.statement.bank_title);
          }
          if (res.statement.statement_date) {
            setStatementDate(res.statement.statement_date);
          }
          if (res.statement.due_date) {
            setDueDate(res.statement.due_date);
          }
          if (res.statement.minimum_amount != null) {
            setMinimumAmount(res.statement.minimum_amount);
          }
          if (res.statement.total_due != null && res.statement.total_due > 0) {
            setTotalDue(res.statement.total_due);
          } else if (res.statement.total_amount != null) {
            setTotalDue(res.statement.total_amount);
          }
          if (res.statement.card_id) {
            setCardId(res.statement.card_id);
          }
          if (res.statement.card_name) {
            setCardName(res.statement.card_name);
          }
          if (res.statement.card_masked_number) {
            setCardMaskedNumber(res.statement.card_masked_number);
          }
          if (res.statement.card_last_four) {
            setCardLastFour(res.statement.card_last_four);
          }
          if (res.statement.card_type) {
            setCardType(res.statement.card_type);
          }
          if (res.statement.is_credit_card != null) {
            setIsCreditCard(res.statement.is_credit_card);
          }
          if (res.statement.file_url) {
            const sep = res.statement.file_url.includes('?') ? '&' : '?';
            setCurrentPdfUrl(`${res.statement.file_url}${sep}_t=${Date.now()}`);
          }
        }

        if (pwdToUse.trim()) {
          setPassword(pwdToUse.trim());
          setIsPdfLocked(false);
        }
        setShowExtractPasswordModal(false);
      } else if (stagingData.file) {
        const res = await parseExpenseFile(stagingData.file, projectId, pwdToUse.trim() || undefined);
        const parsedItems = (res.expenses || []).map((item, index) => ({ ...item, id: `item-${index}` }));
        setItems(parsedItems);
        setCategoryOptions(getCategorySelectOptions(parsedItems.map((i: any) => i.category || '')));
        if (res.bank_name) setBankName(res.bank_name);
        if (res.statement_date) setStatementDate(res.statement_date);
        if (res.due_date) setDueDate(res.due_date);
        if (res.minimum_amount != null) setMinimumAmount(res.minimum_amount);
        if (res.total_due != null) setTotalDue(res.total_due);
        if (res.card_id) setCardId(res.card_id);
        if (res.card_name) setCardName(res.card_name);
        if (res.card_masked_number) setCardMaskedNumber(res.card_masked_number);
        if (res.card_last_four) setCardLastFour(res.card_last_four);
        if (res.card_type) setCardType(res.card_type);
        if (res.is_credit_card != null) setIsCreditCard(res.is_credit_card);
        if (res.draft_id) {
          setCurrentDraftId(res.draft_id);
          const newUrl = `${window.location.pathname}?draft_id=${encodeURIComponent(res.draft_id)}`;
          window.history.replaceState(null, '', newUrl);
        }
        if (res.pdf_url) setCurrentPdfUrl(res.pdf_url);
        if (pwdToUse.trim()) {
          setPassword(pwdToUse.trim());
          setIsPdfLocked(false);
        }
        setShowExtractPasswordModal(false);
      } else {
        throw new Error('No statement or file available to extract.');
      }
    } catch (err: any) {
      console.error('Extraction failed:', err);
      const msg = err.message || 'Failed to extract data from statement.';
      if (/password/i.test(msg) || /encrypted/i.test(msg) || /locked/i.test(msg)) {
        setIsPdfLocked(true);
        setShowExtractPasswordModal(true);
      }
      setExtractError(msg);
      setErrorMsg(msg);
    } finally {
      setIsExtractingData(false);
    }
  };

  const handleTriggerExtract = () => {
    setExtractError(null);
    if (password.trim().length > 0) {
      runExtraction(password.trim());
    } else if (isPdfLocked) {
      setShowExtractPasswordModal(true);
    } else {
      runExtraction('');
    }
  };

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
          if (res.card_id) setCardId(res.card_id);
          if (res.card_name) setCardName(res.card_name);
          if (res.card_masked_number) setCardMaskedNumber(res.card_masked_number);
          if (res.card_last_four) setCardLastFour(res.card_last_four);
          if (res.card_type) setCardType(res.card_type);
          if (res.is_credit_card != null) setIsCreditCard(res.is_credit_card);
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
    setConfirming(true);
    setErrorMsg(null);
    try {
      const res = await confirmStagedExpenses({
        draft_id: currentDraftId || stagingData.draftId || 'draft-1',
        statement_id: stagingData.statementId,
        filename: stagingData.filename,
        project_id: projectId || stagingData.projectId,
        card_id: cardId,
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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 3.5rem)', gap: '1rem' }}>
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
            <ArrowLeft size={16} /> {isExistingStatement ? 'Back to Statements' : 'Back to Expenses'}
          </button>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-glass)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isExistingStatement
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
                  {isExistingStatement ? 'Statement Review & Edit:' : 'Staging Review:'} {stagingData.filename}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {items.length === 0 && (
            <button
              type="button"
              onClick={handleTriggerExtract}
              disabled={isExtractingData || isExtracting}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: isExtractingData || isExtracting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 10px rgba(168, 85, 247, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={15} className={isExtractingData || isExtracting ? 'animate-spin' : ''} />
              <span>{isExtractingData || isExtracting ? 'Extracting Data...' : '✨ Extract Data'}</span>
            </button>
          )}

          {password && (
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
            <span>
              {confirming
                ? 'Saving Expenses...'
                : isExistingStatement
                ? `Save & Update Statement (${items.length} Items)`
                : `Confirm & Save ${items.length} Expenses`}
            </span>
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

      {/* Link Bank Success Alert */}
      {linkSuccessToast && (
        <div
          style={{
            padding: '0.65rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.15)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{linkSuccessToast}</span>
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
                background: isLinked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                border: isLinked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isLinked ? '#34d399' : '#818cf8'
              }}
            >
              <Building2 size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Bank Name
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <input
                  type="text"
                  value={bankName}
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

                {isLinked ? (
                  <button
                    type="button"
                    onClick={() => setIsLinkBankModalOpen(true)}
                    title={`Linked to ${linkedBank?.title}. Click to change or re-link.`}
                    style={{
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      color: '#34d399',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCircle2 size={12} />
                    <span>Linked</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLinkBankModalOpen(true)}
                    title="Bank not linked in system. Click to link or create bank."
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
                      border: '1px solid rgba(99, 102, 241, 0.45)',
                      color: '#c7d2fe',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.2)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card (Credit Card / Last 4) */}
          {shouldShowCard && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(236, 72, 153, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f472b6',
                  flexShrink: 0
                }}
              >
                <CreditCard size={16} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.05em'
                  }}
                >
                  Card
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span
                    style={{
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      fontFamily: 'monospace'
                    }}
                  >
                    {cardLastFour ? `•••• ${cardLastFour}` : cardMaskedNumber ? cardMaskedNumber : 'Credit Card'}
                  </span>

                  {cardId ? (
                    <button
                      type="button"
                      onClick={() => setIsLinkCardModalOpen(true)}
                      title={`Linked to ${cardName || cardMaskedNumber || cardLastFour}${cardType ? ` (${cardType})` : ''}. Click to change or re-link.`}
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        color: '#34d399',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle2 size={12} />
                      <span>Linked</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsLinkCardModalOpen(true)}
                      title="Card not linked in system. Click to link or create card."
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
                        border: '1px solid rgba(236, 72, 153, 0.45)',
                        color: '#fbcfe8',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(236, 72, 153, 0.2)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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
                value={statementDate || ''}
                onChange={(e) => setStatementDate(e.target.value)}
                placeholder="e.g. 12 July 2026"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#c084fc',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  outline: 'none',
                  width: '140px'
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
                value={dueDate || ''}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="e.g. 01 August 2026"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  outline: 'none',
                  width: '140px'
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
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: items.length === 0 ? 'center' : 'flex-start',
              alignItems: items.length === 0 ? 'center' : 'stretch'
            }}
          >
            {isExtracting || isExtractingData ? (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  color: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  margin: 'auto'
                }}
              >
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
                  Gemini AI Analyzing Statement...
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
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  width: '100%',
                  maxWidth: '480px',
                  margin: 'auto',
                  gap: '1.25rem'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c084fc'
                  }}
                >
                  <Sparkles size={32} />
                </div>

                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>
                    {isPdfLocked ? 'Password-Protected Statement' : 'No Expenses Extracted Yet'}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.5 }}>
                    {isPdfLocked
                      ? 'This document is encrypted. Provide the password to unlock, preview, and extract all line items and statement metadata.'
                      : 'Extract transactions, dates, amounts, credit/debit types, and bank metadata using Gemini AI.'}
                  </p>
                </div>

                {extractError && (
                  <div
                    style={{
                      padding: '0.65rem 1rem',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#f87171',
                      fontSize: '0.82rem',
                      maxWidth: '420px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{extractError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%', maxWidth: '320px' }}>
                  <button
                    type="button"
                    onClick={handleTriggerExtract}
                    disabled={isExtractingData || isExtracting}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      cursor: isExtractingData || isExtracting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Sparkles size={18} className={isExtractingData || isExtracting ? 'animate-spin' : ''} />
                    <span>{isExtractingData || isExtracting ? 'Extracting Data with AI...' : '✨ Extract Data / Expenses'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddRow}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: '0.25rem'
                    }}
                  >
                    + Or manually add an expense row
                  </button>
                </div>
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
                      {/* Category custom select */}
                      <td style={{ padding: '0.5rem 0.4rem', minWidth: '135px' }}>
                        <Select
                          value={item.category || 'General'}
                          onChange={(val) => handleItemChange(idx, 'category', val)}
                          options={categoryOptions}
                          creatable={true}
                          onCreateOption={(newCat) => handleCreateCategory(idx, newCat)}
                          placeholder="Category"
                          size="sm"
                          buttonStyle={{
                            background: '#1e293b',
                            border: '1px solid var(--border-glass)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                          menuStyle={{
                            minWidth: '180px'
                          }}
                        />
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
                      {/* Amount input with DR/CR editable select dropdown & sign */}
                      <td style={{ padding: '0.5rem 0.4rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          {/* Editable DR/CR Dropdown using Select */}
                          <div style={{ width: '68px', flexShrink: 0 }}>
                            <Select
                              value={item.transaction_type || (item.amount_formatted?.startsWith('+') ? 'CR' : 'DR')}
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
          {items.length > 0 && (
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
          )}


        </div>

        {/* Right Half: Native Frontend PDF Document Viewer (50%) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <PdfDocumentViewer
            pdfUrl={currentPdfUrl || stagingData.pdfUrl}
            filename={stagingData.filename}
            isPdf={stagingData.isPdf}
            password={password}
            onPasswordSubmit={(pw) => {
              setPassword(pw);
              setExtractPasswordInput(pw);
            }}
            onUnlockedSuccess={(pw) => {
              setPassword(pw);
              setExtractPasswordInput(pw);
              setIsPdfLocked(false);
            }}
            onLockedDetected={() => {
              setIsPdfLocked(true);
            }}
          />
        </div>

      </div>

      <LinkBankModal
        isOpen={isLinkBankModalOpen}
        onClose={() => setIsLinkBankModalOpen(false)}
        detectedBankName={bankName}
        currentBankId={projectId}
        projects={projects}
        onSelectBank={handleSelectBank}
        onBankCreated={onBankCreated}
      />

      <LinkCardModal
        isOpen={isLinkCardModalOpen}
        onClose={() => setIsLinkCardModalOpen(false)}
        detectedLastFour={cardLastFour}
        detectedBankName={bankName}
        currentCardId={cardId}
        currentBankId={projectId}
        projects={projects}
        onSelectCard={handleSelectCard}
        onCardCreated={onCardCreated}
      />

      {/* Password Modal for Protected Statement Extraction */}
      {showExtractPasswordModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '1.75rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowExtractPasswordModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#c084fc'
                }}
              >
                <Lock size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Unlock & Extract Expenses
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {stagingData.filename}
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              This statement PDF is password-protected. Enter the document password to decrypt the file, unlock preview, and extract all line items.
            </p>

            {extractError && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{extractError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!extractPasswordInput.trim()) {
                  setExtractError('Please enter the PDF password');
                  return;
                }
                runExtraction(extractPasswordInput.trim());
              }}
            >
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Document Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showExtractPassword ? 'text' : 'password'}
                    value={extractPasswordInput}
                    onChange={(e) => {
                      setExtractPasswordInput(e.target.value);
                      setExtractError(null);
                    }}
                    placeholder="Enter password..."
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-glass)',
                      color: '#f8fafc',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowExtractPassword(!showExtractPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showExtractPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowExtractPasswordModal(false)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExtractingData || !extractPasswordInput.trim()}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isExtractingData || !extractPasswordInput.trim()
                      ? 'rgba(168, 85, 247, 0.3)'
                      : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: isExtractingData || !extractPasswordInput.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)'
                  }}
                >
                  <Sparkles size={14} className={isExtractingData ? 'animate-spin' : ''} />
                  <span>{isExtractingData ? 'Extracting...' : 'Unlock & Extract'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
