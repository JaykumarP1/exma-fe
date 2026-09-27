import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
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
  Lock,
  Download,
  Sparkles,
  Eye,
  Upload,
  Mail,
  CreditCard,
  Plus,
  Calendar,
  AlertCircle,
  Search,
  X,
  Activity,
  Archive,
  RotateCcw,
  TrendingUp,
  BarChart2,
  Landmark,
  ShieldCheck,
  Tag,
  ChevronDown,
  Menu,
  LucideIcon
} from 'lucide-react';
import { Statement, StatementsResponse, Project, Card } from '../types';
import { formatCurrency } from '../utils/currency';

import { DeleteStatementModal } from './DeleteStatementModal';
import { UnlockPdfModal } from './UnlockPdfModal';
import { UnlockStatementModal } from './UnlockStatementModal';
import { ViewPdfModal } from './ViewPdfModal';
import { LinkBankModal } from './LinkBankModal';
import { UpdatePaymentModal } from './UpdatePaymentModal';
import { EmailStatementDetailModal } from './EmailStatementDetailModal';
import { Select } from './ui/Select';
import { TableDateTime } from './ui';
import { Tooltip } from './Tooltip';
import { getStatementMonthYear } from '../utils/dateUtils';

import * as api from '../services/api';

import { StagingDataState } from './ExpenseStagingPage';

export interface StatementCategoryConfig {
  key: string;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  icon: LucideIcon;
}

export const STATEMENT_CATEGORIES: StatementCategoryConfig[] = [
  { key: 'banking', label: 'Banking', shortLabel: 'Banking', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)', icon: Building2 },
  { key: 'cc', label: 'Credit Card', shortLabel: 'CC', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.3)', icon: CreditCard },
  { key: 'mf', label: 'Mutual Funds', shortLabel: 'MF', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.3)', icon: TrendingUp },
  { key: 'stock', label: 'Stocks / Demat', shortLabel: 'Stock', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)', icon: BarChart2 },
  { key: 'loan', label: 'Loan / EMI', shortLabel: 'Loan', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)', icon: Landmark },
  { key: 'insurance', label: 'Insurance', shortLabel: 'Insurance', color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.12)', border: 'rgba(45, 212, 191, 0.3)', icon: ShieldCheck },
  { key: 'other', label: 'Other', shortLabel: 'Other', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)', icon: Tag }
];

export const getCategoryConfig = (key?: string): StatementCategoryConfig => {
  const norm = (key || 'banking').toLowerCase().trim();
  return STATEMENT_CATEGORIES.find((c) => c.key === norm) || STATEMENT_CATEGORIES[0];
};

interface StatementPageProps {
  projects: Project[];
  currency?: string;
  onStagingReady?: (data: StagingDataState) => void;
  onBankCreated?: (newBank: Project) => void;
  onSync?: () => void;
  loadingSync?: boolean;
  onToggleSidebar?: () => void;
}

export const StatementPage: React.FC<StatementPageProps> = ({
  projects,
  currency = 'USD',
  onStagingReady,
  onBankCreated,
  onSync,
  loadingSync = false,
  onToggleSidebar
}) => {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [stats, setStats] = useState<StatementsResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [banks, setBanks] = useState<Project[]>(projects || []);
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filter states from URL search parameters so refresh and bookmarks preserve them
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>(() => {
    return searchParams.get('tab') === 'archived' ? 'archived' : 'active';
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return searchParams.get('q') || searchParams.get('search') || '';
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return searchParams.get('bank') || searchParams.get('bank_id') || searchParams.get('project_id') || 'all';
  });
  const [selectedCardId, setSelectedCardId] = useState<string>(() => {
    return searchParams.get('card') || searchParams.get('card_id') || 'all';
  });
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>(() => {
    return searchParams.get('source') || 'all';
  });
  const [selectedPaymentStatusFilter, setSelectedPaymentStatusFilter] = useState<string>(() => {
    return searchParams.get('payment') || searchParams.get('payment_status') || 'all';
  });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(() => {
    return searchParams.get('category') || 'all';
  });

  const [cards, setCards] = useState<Card[]>([]);
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState<number | null>(null);
  const [categoryMenuPos, setCategoryMenuPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  } | null>(null);
  const [activeMenuStmt, setActiveMenuStmt] = useState<Statement | null>(null);
  const [deletingStatement, setDeletingStatement] = useState<Statement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockingStatement, setUnlockingStatement] = useState<Statement | null>(null);
  const [updatingPaymentStatement, setUpdatingPaymentStatement] = useState<Statement | null>(null);
  const [viewingEmailStatement, setViewingEmailStatement] = useState<Statement | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [extractingId, setExtractingId] = useState<number | null>(null);
  const [viewingPdfStatement, setViewingPdfStatement] = useState<Statement | null>(null);
  const [linkingStatement, setLinkingStatement] = useState<Statement | null>(null);

  // Sync applied filters to URL query string so page refreshes and links maintain state
  useEffect(() => {
    const params = new URLSearchParams();

    if (activeTab === 'archived') {
      params.set('tab', 'archived');
    }
    if (selectedProjectId && selectedProjectId !== 'all') {
      params.set('bank', selectedProjectId);
    }
    if (selectedCardId && selectedCardId !== 'all') {
      params.set('card', selectedCardId);
    }
    if (selectedSourceFilter && selectedSourceFilter !== 'all') {
      params.set('source', selectedSourceFilter);
    }
    if (selectedPaymentStatusFilter && selectedPaymentStatusFilter !== 'all') {
      params.set('payment', selectedPaymentStatusFilter);
    }
    if (selectedCategoryFilter && selectedCategoryFilter !== 'all') {
      params.set('category', selectedCategoryFilter);
    }
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }

    const currentQs = searchParams.toString();
    const newQs = params.toString();
    if (currentQs !== newQs) {
      setSearchParams(params, { replace: true });
    }
  }, [
    activeTab,
    selectedProjectId,
    selectedCardId,
    selectedSourceFilter,
    selectedPaymentStatusFilter,
    selectedCategoryFilter,
    searchQuery
  ]);

  // Sync URL search params with state when user navigates using back/forward
  useEffect(() => {
    const urlTab = searchParams.get('tab') === 'archived' ? 'archived' : 'active';
    const urlBank = searchParams.get('bank') || searchParams.get('bank_id') || searchParams.get('project_id') || 'all';
    const urlCard = searchParams.get('card') || searchParams.get('card_id') || 'all';
    const urlSource = searchParams.get('source') || 'all';
    const urlPayment = searchParams.get('payment') || searchParams.get('payment_status') || 'all';
    const urlCategory = searchParams.get('category') || 'all';
    const urlSearch = searchParams.get('q') || searchParams.get('search') || '';

    setActiveTab((prev) => (prev !== urlTab ? urlTab : prev));
    setSelectedProjectId((prev) => (prev !== urlBank ? urlBank : prev));
    setSelectedCardId((prev) => (prev !== urlCard ? urlCard : prev));
    setSelectedSourceFilter((prev) => (prev !== urlSource ? urlSource : prev));
    setSelectedPaymentStatusFilter((prev) => (prev !== urlPayment ? urlPayment : prev));
    setSelectedCategoryFilter((prev) => (prev !== urlCategory ? urlCategory : prev));
    setSearchQuery((prev) => (prev !== urlSearch ? urlSearch : prev));
  }, [searchParams]);

  useEffect(() => {
    if (!openCategoryMenuId) return;
    const handleClose = () => {
      setOpenCategoryMenuId(null);
      setCategoryMenuPos(null);
      setActiveMenuStmt(null);
    };
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [openCategoryMenuId]);

  const handleUpdateCategory = async (stmt: Statement, newCategory: string) => {
    try {
      setStatements((prev) =>
        prev.map((s) => (s.id === stmt.id ? { ...s, category: newCategory } : s))
      );
      const catConfig = getCategoryConfig(newCategory);
      setToastMessage(`Categorized "${stmt.statement_month_year || stmt.filename}" as ${catConfig.label}`);
      setTimeout(() => setToastMessage(null), 3000);

      await api.updateStatementCategory(stmt.id, newCategory);
    } catch (err: any) {
      console.error('Failed to update statement category', err);
      setToastMessage(err?.message || 'Failed to update statement category');
      setTimeout(() => setToastMessage(null), 3500);
      loadStatements();
    }
  };

  useEffect(() => {
    if (projects && projects.length > 0) {
      setBanks(projects);
    }
  }, [projects]);

  useEffect(() => {
    api.fetchProjects()
      .then((res) => {
        if (res && Array.isArray(res)) {
          setBanks(res);
        }
      })
      .catch((err) => {
        console.error('Failed to load banks for statement filter', err);
      });
  }, []);

  const handleBankCreated = (newBank: Project) => {
    setBanks((prev) => {
      if (prev.some((b) => b.id === newBank.id)) return prev;
      return [...prev, newBank];
    });
    if (onBankCreated) {
      onBankCreated(newBank);
    }
  };

  useEffect(() => {
    api.fetchCards()
      .then((res) => {
        if (res && res.cards) {
          setCards(res.cards);
        }
      })
      .catch((err) => {
        console.error('Failed to load cards for statement filter', err);
      });
  }, []);

  const bankOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: 'all', label: 'All Bank Accounts' }];
    const seenBankNames = new Set<string>();

    banks.forEach((b) => {
      const name = b.title?.trim();
      if (name && !seenBankNames.has(name.toLowerCase())) {
        opts.push({ value: String(b.id), label: name });
        seenBankNames.add(name.toLowerCase());
      }
    });

    statements.forEach((s) => {
      const rawName = (s.bank_name || s.bank_title)?.trim();
      if (rawName && rawName.toLowerCase() !== 'unassigned bank' && !seenBankNames.has(rawName.toLowerCase())) {
        opts.push({ value: `name-${rawName}`, label: rawName });
        seenBankNames.add(rawName.toLowerCase());
      }
    });

    return opts;
  }, [banks, statements]);

  const cardOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: 'all', label: 'All Cards' }];
    const seenCardKeys = new Set<string>();

    cards.forEach((c) => {
      const last4 = c.last_four || (c.card_number ? c.card_number.slice(-4) : '');
      const name = c.card_name || 'Card';
      const label = last4 ? `${name} (•••• ${last4})` : name;
      opts.push({ value: String(c.id), label });
      seenCardKeys.add(String(c.id));
      if (last4) seenCardKeys.add(`digits-${last4}`);
    });

    statements.forEach((s) => {
      if (s.card_id && !seenCardKeys.has(String(s.card_id))) {
        const last4 = s.card_last_four || s.detected_card_last_four || '';
        const name = s.card_name || 'Card';
        const label = last4 ? `${name} (•••• ${last4})` : name;
        opts.push({ value: String(s.card_id), label });
        seenCardKeys.add(String(s.card_id));
      } else if (!s.card_id && (s.card_last_four || s.detected_card_last_four)) {
        const last4 = s.card_last_four || s.detected_card_last_four || '';
        const key = `digits-${last4}`;
        if (!seenCardKeys.has(key)) {
          opts.push({ value: key, label: `Card (•••• ${last4})` });
          seenCardKeys.add(key);
        }
      }
    });

    return opts;
  }, [cards, statements]);

  const handleLinkBankForStatement = async (bank: Project) => {
    if (!linkingStatement) return;
    try {
      await api.updateStatement(linkingStatement.id, {
        bank_id: bank.id,
        bank_name: bank.title
      });
      setStatements((prev) =>
        prev.map((s) =>
          s.id === linkingStatement.id
            ? { ...s, project_id: bank.id, bank_id: bank.id, bank_title: bank.title, bank_name: bank.title }
            : s
        )
      );
      setToastMessage(`Linked statement "${linkingStatement.filename}" to ${bank.title}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e: any) {
      console.error('Failed to link bank to statement', e);
      setToastMessage(e?.message || 'Failed to link statement to bank');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleStatementUnlocked = (updatedStmt: Statement, extractedCount?: number) => {
    setStatements((prev) =>
      prev.map((s) => (s.id === updatedStmt.id ? { ...s, ...updatedStmt } : s))
    );
    setToastMessage(
      extractedCount && extractedCount > 0
        ? `Statement unlocked & extracted ${extractedCount} expense(s)!`
        : 'Statement unlocked successfully!'
    );
    setTimeout(() => setToastMessage(null), 4000);
    loadStatements();
  };

  const handleStatementPaymentUpdated = (updatedStmt: Statement) => {
    setStatements((prev) =>
      prev.map((s) => (s.id === updatedStmt.id ? { ...s, ...updatedStmt } : s))
    );
    setToastMessage(`Payment status updated for "${updatedStmt.statement_month_year || updatedStmt.filename}"`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredStatements = useMemo(() => {
    return statements.filter((stmt) => {
      // 1. Bank Account filter
      if (selectedProjectId !== 'all') {
        const pId = String(stmt.project_id ?? stmt.bank_id ?? '');
        const stmtTitle = (stmt.bank_title || stmt.bank_name || '').toLowerCase().trim();

        if (selectedProjectId.startsWith('name-')) {
          const targetName = selectedProjectId.replace('name-', '').toLowerCase().trim();
          if (stmtTitle !== targetName) return false;
        } else {
          const targetBank = banks.find((p) => String(p.id) === selectedProjectId);
          const targetTitle = targetBank?.title?.toLowerCase().trim();
          const idMatch = pId === selectedProjectId;
          const titleMatch = Boolean(targetTitle && stmtTitle && stmtTitle === targetTitle);

          if (!idMatch && !titleMatch) return false;
        }
      }

      // 2. Card filter
      if (selectedCardId !== 'all') {
        if (selectedCardId.startsWith('digits-')) {
          const targetDigits = selectedCardId.replace('digits-', '');
          const last4 = stmt.card_last_four || stmt.detected_card_last_four;
          const matchesDigits = last4 === targetDigits || stmt.filename.includes(targetDigits);
          if (!matchesDigits) return false;
        } else {
          const targetCard = cards.find((c) => String(c.id) === selectedCardId);
          const targetLast4 = targetCard?.last_four || (targetCard?.card_number ? targetCard.card_number.slice(-4) : '');

          const matchesId = String(stmt.card_id) === selectedCardId;
          const matchesLast4 = Boolean(
            targetLast4 && (
              stmt.card_last_four === targetLast4 ||
              stmt.detected_card_last_four === targetLast4 ||
              stmt.filename.includes(targetLast4)
            )
          );

          if (!matchesId && !matchesLast4) return false;
        }
      }

      // 3. Search query: statement date, month/year, filename, due date, bank name, card, email
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const filenameMatch = stmt.filename?.toLowerCase().includes(q);
        const dateMatch = stmt.statement_date?.toLowerCase().includes(q);
        const monthYearMatch = (stmt.statement_month_year || getStatementMonthYear(stmt.statement_date, stmt.filename))?.toLowerCase().includes(q);
        const dueDateMatch = stmt.due_date?.toLowerCase().includes(q);
        const bankMatch = (stmt.bank_title || stmt.bank_name || '')?.toLowerCase().includes(q);
        const cardMatch = (stmt.card_name || stmt.card_masked_number || stmt.card_last_four || stmt.detected_card_last_four || '')?.toLowerCase().includes(q);
        const emailMatch = (stmt.source_email || stmt.email_name || '')?.toLowerCase().includes(q);

        if (!filenameMatch && !dateMatch && !monthYearMatch && !dueDateMatch && !bankMatch && !cardMatch && !emailMatch) {
          return false;
        }
      }

      // 4. Source filter
      if (selectedSourceFilter === 'upload' && (stmt.source === 'email' || stmt.is_email_sync)) return false;
      if (selectedSourceFilter === 'email' && (stmt.source !== 'email' && !stmt.is_email_sync)) return false;

      // 5. Payment status filter
      if (selectedPaymentStatusFilter !== 'all') {
        const status = stmt.payment_status?.toLowerCase();
        const isPaid = status === 'paid' || Boolean(stmt.payment_date);

        if (selectedPaymentStatusFilter === 'paid') return isPaid;
        if (selectedPaymentStatusFilter === 'unpaid') return !isPaid;
        if (selectedPaymentStatusFilter === 'overdue') return !isPaid && status === 'overdue';
        if (selectedPaymentStatusFilter === 'due_soon') return !isPaid && status === 'due_soon';
      }

      // 6. Category filter
      if (selectedCategoryFilter !== 'all') {
        const cat = (stmt.category || 'banking').toLowerCase();
        if (cat !== selectedCategoryFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [
    statements,
    selectedProjectId,
    selectedCardId,
    searchQuery,
    selectedSourceFilter,
    selectedPaymentStatusFilter,
    selectedCategoryFilter,
    banks,
  ]);

  // Dynamic metrics calculated based on applied filters
  const {
    filteredUnpaidCount,
    filteredUnpaidAmount,
    filteredTotalCount,
    filteredTotalAmount,
    filteredUniqueCardsCount
  } = useMemo(() => {
    let unpaidCount = 0;
    let unpaidAmount = 0;
    const totalCount = filteredStatements.length;
    let totalAmount = 0;
    const cardKeys = new Set<string>();

    filteredStatements.forEach((stmt) => {
      const amt = parseFloat(String(stmt.total_due || stmt.total_amount || 0));
      const validAmt = isNaN(amt) ? 0 : amt;
      totalAmount += validAmt;

      const status = stmt.payment_status?.toLowerCase();
      const isPaid = status === 'paid' || Boolean(stmt.payment_date);
      if (!isPaid) {
        unpaidCount += 1;
        unpaidAmount += validAmt;
      }

      if (stmt.card_id) {
        cardKeys.add(`id-${stmt.card_id}`);
      } else {
        const last4 = stmt.card_last_four || stmt.detected_card_last_four;
        if (last4) {
          cardKeys.add(`digits-${last4}`);
        } else if (stmt.card_name && stmt.card_name.trim().toLowerCase() !== 'card') {
          cardKeys.add(`name-${stmt.card_name.trim().toLowerCase()}`);
        }
      }
    });

    return {
      filteredUnpaidCount: unpaidCount,
      filteredUnpaidAmount: unpaidAmount,
      filteredTotalCount: totalCount,
      filteredTotalAmount: totalAmount,
      filteredUniqueCardsCount: cardKeys.size
    };
  }, [filteredStatements]);

  const getPaymentStatusBadge = (stmt: Statement) => {
    const status = stmt.payment_status?.toLowerCase();
    const isPaid = status === 'paid' || Boolean(stmt.payment_date);

    if (isPaid) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.22rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.35)'
          }}
        >
          <CheckCircle2 size={12} /> Paid
        </span>
      );
    }

    if (status === 'overdue') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.22rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.35)'
          }}
        >
          <AlertCircle size={12} /> Overdue
        </span>
      );
    }

    if (status === 'due_soon') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.22rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(245, 158, 11, 0.35)'
          }}
        >
          <Clock size={12} /> Due Soon
        </span>
      );
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.22rem 0.6rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.72rem',
          fontWeight: 600,
          background: 'rgba(148, 163, 184, 0.12)',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.25)'
        }}
      >
        <Clock size={12} /> Unpaid
      </span>
    );
  };


  const loadStatements = async () => {
    try {
      setLoading(true);
      const [stmtRes, projRes, cardsRes] = await Promise.allSettled([
        api.fetchStatements({
          ...(selectedProjectId !== 'all' ? { bank_id: selectedProjectId } : {}),
          archived: activeTab === 'archived'
        }),
        api.fetchProjects(),
        api.fetchCards()
      ]);

      if (stmtRes.status === 'fulfilled') {
        setStatements(stmtRes.value.statements);
        setStats(stmtRes.value.stats);
      }
      if (projRes.status === 'fulfilled' && Array.isArray(projRes.value)) {
        setBanks(projRes.value);
      }
      if (cardsRes.status === 'fulfilled' && cardsRes.value && cardsRes.value.cards) {
        setCards(cardsRes.value.cards);
      }
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
          statementDate: stmt.statement_date,
          dueDate: stmt.due_date,
          minimumAmount: stmt.minimum_amount,
          totalDue: stmt.total_due || stmt.total_amount,
          cardId: stmt.card_id,
          cardName: stmt.card_name,
          cardMaskedNumber: stmt.card_masked_number,
          cardLastFour: stmt.card_last_four,
          cardType: stmt.card_type,
          isCreditCard: stmt.is_credit_card,
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
          statementDate: stmt.statement_date,
          dueDate: stmt.due_date,
          minimumAmount: stmt.minimum_amount,
          totalDue: stmt.total_due || stmt.total_amount,
          cardId: stmt.card_id,
          cardName: stmt.card_name,
          cardMaskedNumber: stmt.card_masked_number,
          cardLastFour: stmt.card_last_four,
          cardType: stmt.card_type,
          isCreditCard: stmt.is_credit_card,
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
  }, [selectedProjectId, activeTab]);

  const handleArchiveStatement = async (stmt: Statement) => {
    try {
      await api.archiveStatement(stmt.id);
      setToastMessage(`Statement "${stmt.filename}" moved to Archive.`);
      await loadStatements();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error: any) {
      console.error('Failed to archive statement', error);
      setToastMessage(error?.message || 'Failed to archive statement');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleRestoreStatement = async (stmt: Statement) => {
    try {
      await api.restoreStatement(stmt.id);
      setToastMessage(`Statement "${stmt.filename}" restored to Active Statements.`);
      await loadStatements();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error: any) {
      console.error('Failed to restore statement', error);
      setToastMessage(error?.message || 'Failed to restore statement');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleConfirmDeleteStatement = async (deleteExpenses: boolean) => {
    if (!deletingStatement) return;
    try {
      setDeleteLoading(true);
      await api.deleteStatement(deletingStatement.id, deleteExpenses, activeTab === 'archived');
      setStatements((prev) => prev.filter((item) => item.id !== deletingStatement.id));
      setToastMessage(activeTab === 'archived' ? 'Statement permanently deleted.' : `Statement "${deletingStatement.filename}" moved to Archive.`);
      setDeletingStatement(null);
      await loadStatements();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error: any) {
      console.error('Failed to delete statement', error);
      setToastMessage(error?.message || 'Failed to delete statement');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setDeleteLoading(false);
    }
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

      {/* Dynamic Filter-Aware Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {/* 1. Total Unpaid Statements with Amount */}
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.1rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0
            }}
          >
            <Clock size={24} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Unpaid Statements
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.55rem', fontWeight: 800, color: '#f8fafc' }}>
                {filteredUnpaidCount}
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(filteredUnpaidAmount, currency)}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
              {filteredUnpaidCount === 1 ? '1 unpaid statement pending' : `${filteredUnpaidCount} unpaid statements pending`}
            </div>
          </div>
        </div>

        {/* 2. Total Statements with Amount */}
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.1rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(56, 189, 248, 0.04) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              flexShrink: 0
            }}
          >
            <Layers size={24} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Statements
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.55rem', fontWeight: 800, color: '#f8fafc' }}>
                {filteredTotalCount}
              </span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {formatCurrency(filteredTotalAmount, currency)}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
              {filteredTotalCount === 1 ? '1 statement under filter' : `${filteredTotalCount} statements under filter`}
            </div>
          </div>
        </div>

        {/* 3. Total Cards */}
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.4rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.1rem',
            background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)',
            border: '1px solid rgba(244, 114, 182, 0.25)'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(244, 114, 182, 0.15)',
              border: '1px solid rgba(244, 114, 182, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f472b6',
              flexShrink: 0
            }}
          >
            <CreditCard size={24} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Cards
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.55rem', fontWeight: 800, color: '#f8fafc' }}>
                {filteredUniqueCardsCount}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
              {filteredUniqueCardsCount === 1 ? '1 card linked to filtered statements' : `${filteredUniqueCardsCount} cards linked to filtered statements`}
            </div>
          </div>
        </div>
      </div>

      {/* Table Header & Controls */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'relative',
          zIndex: 30,
          overflow: 'visible'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {onToggleSidebar && (
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={onToggleSidebar}
                title="Toggle navigation menu"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.2rem',
                  marginRight: '0.2rem'
                }}
              >
                <Menu size={20} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                {activeTab === 'archived' ? 'Archived Statements' : 'Uploaded Bank Statements'}
              </h2>
            </div>

            {/* Active vs Archived Tab Switcher */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(15, 23, 42, 0.65)',
                borderRadius: '8px',
                padding: '0.2rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                gap: '0.25rem'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: activeTab === 'active' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: activeTab === 'active' ? '#38bdf8' : 'var(--text-muted)',
                  border: activeTab === 'active' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={13} /> Active ({activeTab === 'active' ? filteredStatements.length : (stats?.total_statements || 0)})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('archived')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: activeTab === 'archived' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                  color: activeTab === 'archived' ? '#f59e0b' : 'var(--text-muted)',
                  border: activeTab === 'archived' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Archive size={13} /> Archived ({activeTab === 'archived' ? filteredStatements.length : (stats?.archived_statements || 0)})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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

            <Tooltip content="Sync Email Statements & Workspace Vitals">
              <button
                onClick={onSync || loadStatements}
                disabled={loading || loadingSync}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: loading || loadingSync ? 'not-allowed' : 'pointer'
                }}
              >
                <Activity size={15} className={loading || loadingSync ? 'animate-spin' : ''} />
                <span>Sync</span>
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

        {/* Filters and Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 35
          }}
        >
          {/* Search Input for Filename / Statement Date */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search filename, date, or month..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 2rem 0.5rem 2.35rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-glass)',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Bank Account Filter */}
          <div style={{ minWidth: '175px', flex: '0 1 auto', position: 'relative' }}>
            <Select
              value={selectedProjectId}
              onChange={(val) => {
                setSelectedProjectId(val);
                setSelectedCardId('all');
              }}
              icon={<Building2 size={14} />}
              options={bankOptions}
              size="sm"
            />
          </div>

          {/* Card Filter */}
          <div style={{ minWidth: '175px', flex: '0 1 auto', position: 'relative' }}>
            <Select
              value={selectedCardId}
              onChange={(val) => setSelectedCardId(val)}
              icon={<CreditCard size={14} />}
              options={cardOptions}
              size="sm"
            />
          </div>

          {/* Source Filter */}
          <div style={{ minWidth: '140px', flex: '0 1 auto', position: 'relative' }}>
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

          {/* Payment Status Filter */}
          <div style={{ minWidth: '160px', flex: '0 1 auto', position: 'relative' }}>
            <Select
              value={selectedPaymentStatusFilter}
              onChange={(val) => setSelectedPaymentStatusFilter(val)}
              icon={<DollarSign size={14} />}
              options={[
                { value: 'all', label: 'All Payment Statuses' },
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'paid', label: 'Paid' },
                { value: 'due_soon', label: 'Due Soon' },
                { value: 'overdue', label: 'Overdue' }
              ]}
              size="sm"
            />
          </div>

          {/* Category Filter */}
          <div style={{ minWidth: '160px', flex: '0 1 auto', position: 'relative' }}>
            <Select
              value={selectedCategoryFilter}
              onChange={(val) => setSelectedCategoryFilter(val)}
              icon={<Tag size={14} />}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'banking', label: 'Banking' },
                { value: 'cc', label: 'Credit Card (CC)' },
                { value: 'mf', label: 'Mutual Funds (MF)' },
                { value: 'stock', label: 'Stocks / Demat' },
                { value: 'loan', label: 'Loan / EMI' },
                { value: 'insurance', label: 'Insurance' },
                { value: 'other', label: 'Other' }
              ]}
              size="sm"
            />
          </div>

          {/* Reset Filters Quick Button */}
          {(Boolean(searchQuery.trim()) ||
            selectedProjectId !== 'all' ||
            selectedCardId !== 'all' ||
            selectedSourceFilter !== 'all' ||
            selectedPaymentStatusFilter !== 'all' ||
            selectedCategoryFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedProjectId('all');
                setSelectedCardId('all');
                setSelectedSourceFilter('all');
                setSelectedPaymentStatusFilter('all');
                setSelectedCategoryFilter('all');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
              title="Reset all applied filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Statements Table View */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', display: 'block' }} />
            <span>Loading statement records...</span>
          </div>
        ) : statements.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {activeTab === 'archived' ? (
              <>
                <Archive size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4, color: '#f59e0b' }} />
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>No Archived Statements</div>
                <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  Statements you archive will appear here. You can restore them anytime.
                </p>
              </>
            ) : (
              <>
                <FileText size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>No Statements Found</div>
                <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                  Upload PDF statements in the Expenses tab or from any Bank card.
                </p>
              </>
            )}
          </div>
        ) : filteredStatements.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Search size={36} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>No Matching Statements</div>
            <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
              Try adjusting your search query or filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedProjectId('all');
                setSelectedCardId('all');
                setSelectedSourceFilter('all');
                setSelectedPaymentStatusFilter('all');
                setSelectedCategoryFilter('all');
              }}
              style={{
                marginTop: '1rem',
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Reset All Filters
            </button>
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
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'left', width: '300px', minWidth: '300px', maxWidth: '300px', boxSizing: 'border-box' }}>
                    Statement / File Name
                  </th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Bank Account</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Total Due</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Payment</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Line Items</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Mail From</th>
                  <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Uploaded At</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStatements.map((stmt) => {
                  const monthYear = stmt.statement_month_year || getStatementMonthYear(stmt.statement_date, stmt.filename);
                  const displayTitle = monthYear || stmt.filename;
                  const isPdf = stmt.file_type?.toLowerCase().includes('pdf') || stmt.filename?.toLowerCase().endsWith('.pdf');

                  return (
                    <tr
                      key={stmt.id}
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s ease' }}
                    >
                      <td
                        style={{
                          padding: '0.85rem 1rem',
                          fontWeight: 600,
                          color: '#f8fafc',
                          width: '300px',
                          minWidth: '300px',
                          maxWidth: '300px',
                          boxSizing: 'border-box',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%', minWidth: 0, overflow: 'hidden' }}>
                          <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
                            {isPdf ? (
                              <Tooltip content="PDF Document">
                                <FileText size={16} style={{ color: '#f87171' }} />
                              </Tooltip>
                            ) : (
                              <Tooltip content="Excel Spreadsheet">
                                <FileSpreadsheet size={16} style={{ color: '#34d399' }} />
                              </Tooltip>
                            )}
                          </span>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', width: '100%', minWidth: 0 }}>

                              <span
                                title={displayTitle}
                                style={{
                                  fontSize: '0.88rem',
                                  fontWeight: 700,
                                  color: '#f8fafc',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  flex: 1,
                                  minWidth: 0
                                }}
                              >
                                {displayTitle}
                              </span>

                              <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
                                {stmt.is_unlocked ? (
                                  <Tooltip content="Unlocked Statement (Password Free)">
                                    <Unlock size={14} style={{ color: '#38bdf8' }} />
                                  </Tooltip>
                                ) : (
                                  <Tooltip content="Locked Statement — Click to Unlock">
                                    <button
                                      type="button"
                                      onClick={() => setUnlockingStatement(stmt)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: '0.1rem',
                                        cursor: 'pointer',
                                        color: '#f59e0b',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Lock size={14} />
                                    </button>
                                  </Tooltip>
                                )}
                              </span>
                            </div>

                            {monthYear && (
                              <div
                                title={stmt.filename}
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--text-dim)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  width: '100%',
                                  minWidth: 0
                                }}
                              >
                                {stmt.filename}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                    <td style={{ padding: '0.85rem 0.75rem', color: '#e2e8f0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building2 size={14} style={{ color: 'var(--text-dim)' }} />
                          <span>{stmt.bank_name || stmt.bank_title}</span>
                          {!banks.some((p) => p.id === (stmt.project_id || stmt.bank_id)) && (
                            <Tooltip content="Bank not linked in system. Click to link or create bank.">
                              <button
                                type="button"
                                onClick={() => setLinkingStatement(stmt)}
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '5px',
                                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)',
                                  border: '1px solid rgba(99, 102, 241, 0.4)',
                                  color: '#a5b4fc',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  marginLeft: '0.2rem',
                                  boxShadow: '0 2px 4px rgba(99, 102, 241, 0.15)',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Plus size={12} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                        {(stmt.card_masked_number || stmt.card_last_four || stmt.detected_card_last_four || stmt.card_name) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#818cf8' }}>
                            <CreditCard size={11} />
                            <span>
                              {stmt.card_name ||
                                stmt.card_masked_number ||
                                `Card (•••• ${stmt.card_last_four || stmt.detected_card_last_four})`}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: '#34d399',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.9rem'
                          }}
                        >
                          {formatCurrency(stmt.total_due || stmt.total_amount, currency)}
                        </span>
                        {stmt.due_date && (
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            Due: <TableDateTime date={stmt.due_date} showTime={false} />
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <Tooltip content="Click to update payment status & date">
                        <button
                          type="button"
                          onClick={() => setUpdatingPaymentStatement(stmt)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '0.25rem'
                          }}
                        >
                          {getPaymentStatusBadge(stmt)}
                          {(stmt.payment_status === 'paid' || Boolean(stmt.payment_date)) && stmt.payment_date && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: '#38bdf8',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <Calendar size={11} style={{ flexShrink: 0 }} />
                              <TableDateTime date={stmt.payment_date} showTime={false} />
                            </span>
                          )}
                        </button>
                      </Tooltip>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.82rem' }}>
                          {stmt.expenses_count} {stmt.expenses_count === 1 ? 'expense' : 'expenses'}
                        </span>
                        {stmt.expenses_count > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem', fontFamily: 'inherit' }}>CR:</span>
                              +{formatCurrency(stmt.total_credit || 0, currency)}
                            </span>
                            <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem', fontFamily: 'inherit' }}>DR:</span>
                              -{formatCurrency(stmt.total_debit || 0, currency)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </td>


                    <td style={{ padding: '0.85rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-start' }}>
                        {stmt.mail_from || stmt.email_details?.from ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.78rem',
                              fontWeight: 500,
                              color: '#e2e8f0'
                            }}
                          >
                            <Mail size={13} style={{ color: '#38bdf8', flexShrink: 0 }} />
                            <span
                              title={stmt.mail_from || stmt.email_details?.from}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '185px'
                              }}
                            >
                              {stmt.mail_from || stmt.email_details?.from}
                            </span>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.75rem',
                              color: 'var(--text-dim)'
                            }}
                          >
                            {stmt.source === 'upload' ? (
                              <>
                                <Upload size={12} style={{ color: '#c084fc', flexShrink: 0 }} />
                                <span>Direct Upload</span>
                              </>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        )}

                        {/* Interactive Category Option Dropdown below Mail From */}
                        {(() => {
                          const catConfig = getCategoryConfig(stmt.category);
                          const CatIcon = catConfig.icon;
                          const isOpen = openCategoryMenuId === stmt.id;

                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isOpen) {
                                  setOpenCategoryMenuId(null);
                                  setCategoryMenuPos(null);
                                  setActiveMenuStmt(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  const menuEstimatedHeight = 280;
                                  const placeAbove = spaceBelow < menuEstimatedHeight && rect.top >= menuEstimatedHeight;

                                  const menuWidth = 185;
                                  let left = rect.left;
                                  if (left + menuWidth > window.innerWidth - 12) {
                                    left = Math.max(12, window.innerWidth - menuWidth - 12);
                                  }

                                  setCategoryMenuPos(
                                    placeAbove
                                      ? { bottom: window.innerHeight - rect.top + 4, left }
                                      : { top: rect.bottom + 4, left }
                                  );
                                  setOpenCategoryMenuId(stmt.id);
                                  setActiveMenuStmt(stmt);
                                }
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.16rem 0.48rem',
                                borderRadius: '5px',
                                background: catConfig.bg,
                                border: `1px solid ${catConfig.border}`,
                                color: catConfig.color,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                              title={`Category: ${catConfig.label} (Click to change)`}
                            >
                              <CatIcon size={11} />
                              <span>{catConfig.shortLabel}</span>
                              <ChevronDown
                                size={10}
                                style={{
                                  opacity: 0.7,
                                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.15s ease'
                                }}
                              />
                            </button>
                          );
                        })()}
                      </div>
                    </td>


                    <td style={{ padding: '0.85rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {stmt.source === 'email' || stmt.is_email_sync ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#38bdf8'
                            }}
                          >
                            <Mail size={13} style={{ flexShrink: 0 }} />
                            <span
                              title={stmt.source_email || stmt.email_name || 'Email Synced'}
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '175px'
                              }}
                            >
                              {stmt.source_email || stmt.email_name || 'Email Synced'}
                            </span>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: '#c084fc'
                            }}
                          >
                            <Upload size={13} style={{ flexShrink: 0 }} />
                            <span>Direct Upload</span>
                          </div>
                        )}

                        <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <TableDateTime
                            date={stmt.uploaded_at || stmt.created_at || stmt.uploaded_at_formatted}
                            inline
                          />
                        </div>
                      </div>
                    </td>


                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem' }}>
                        {/* View Extracted Email & Statement Details (Mail Icon) */}
                        <Tooltip content="View Email & Extraction Details">
                          <button
                            onClick={() => setViewingEmailStatement(stmt)}
                            style={{
                              color: (stmt.source === 'email' || stmt.source_email || stmt.email_details) ? '#38bdf8' : 'var(--text-dim)',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              background: 'transparent',
                              border: 'none',
                              outline: 'none'
                            }}
                          >
                            <Mail size={15} />
                          </button>
                        </Tooltip>

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

                        {/* 3. Update Payment Status & Date (DollarSign Icon) */}
                        <Tooltip content="Update Payment Details">
                          <button
                            onClick={() => setUpdatingPaymentStatement(stmt)}
                            style={{
                              color: (stmt.payment_status === 'paid' || Boolean(stmt.payment_date)) ? '#34d399' : '#38bdf8',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              background: 'transparent',
                              border: 'none',
                              outline: 'none'
                            }}
                          >
                            <DollarSign size={15} />
                          </button>
                        </Tooltip>

                        {/* 4. Download Statement File (Download Icon) */}
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

                        {/* 5. Archive / Restore / Permanent Delete */}
                        {activeTab === 'active' ? (
                          <Tooltip content="Archive Statement">
                            <button
                              onClick={() => handleArchiveStatement(stmt)}
                              style={{
                                color: 'var(--text-dim)',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                background: 'transparent',
                                border: 'none',
                                outline: 'none'
                              }}
                            >
                              <Archive size={15} />
                            </button>
                          </Tooltip>
                        ) : (
                          <>
                            <Tooltip content="Restore to Active Statements">
                              <button
                                onClick={() => handleRestoreStatement(stmt)}
                                style={{
                                  color: '#38bdf8',
                                  cursor: 'pointer',
                                  padding: '0.25rem',
                                  background: 'transparent',
                                  border: 'none',
                                  outline: 'none'
                                }}
                              >
                                <RotateCcw size={15} />
                              </button>
                            </Tooltip>
                            <Tooltip content="Delete Permanently">
                              <button
                                onClick={() => setDeletingStatement(stmt)}
                                style={{
                                  color: '#f87171',
                                  cursor: 'pointer',
                                  padding: '0.25rem',
                                  background: 'transparent',
                                  border: 'none',
                                  outline: 'none'
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </td>


                  </tr>
                  );
                })}
                {filteredStatements.length === 0 && statements.length > 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      {activeTab === 'archived' ? 'No archived statements found matching the selected filters.' : 'No statements found matching the selected filters.'}
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

      {/* Unlock PDF Modal (New Upload) */}
      <UnlockPdfModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        projects={banks}
        cards={cards}
        onStagingReady={onStagingReady}
      />

      {/* Unlock Existing Statement Modal */}
      {unlockingStatement && (
        <UnlockStatementModal
          isOpen={!!unlockingStatement}
          statement={unlockingStatement}
          projects={banks}
          cards={cards}
          onClose={() => setUnlockingStatement(null)}
          onUnlocked={handleStatementUnlocked}
        />
      )}




      {/* View PDF Statement Modal */}
      {viewingPdfStatement && (
        <ViewPdfModal
          isOpen={!!viewingPdfStatement}
          onClose={() => setViewingPdfStatement(null)}
          pdfUrl={viewingPdfStatement.file_url}
          filename={viewingPdfStatement.filename}
          projects={banks}
          cards={cards}
          isPdf={viewingPdfStatement.file_type?.toLowerCase().includes('pdf') || viewingPdfStatement.filename?.toLowerCase().endsWith('.pdf')}
        />
      )}

      {/* Link Bank Modal */}
      {linkingStatement && (
        <LinkBankModal
          isOpen={!!linkingStatement}
          onClose={() => setLinkingStatement(null)}
          detectedBankName={linkingStatement.bank_name || linkingStatement.bank_title}
          currentBankId={linkingStatement.project_id || linkingStatement.bank_id}
          projects={banks}
          onSelectBank={handleLinkBankForStatement}
          onBankCreated={handleBankCreated}
        />
      )}

      {/* Update Payment Modal */}
      {updatingPaymentStatement && (
        <UpdatePaymentModal
          isOpen={!!updatingPaymentStatement}
          statement={updatingPaymentStatement}
          currency={currency}
          onClose={() => setUpdatingPaymentStatement(null)}
          onUpdated={handleStatementPaymentUpdated}
        />
      )}

      {/* Email Statement Extraction Details Modal */}
      {viewingEmailStatement && (
        <EmailStatementDetailModal
          isOpen={!!viewingEmailStatement}
          statement={viewingEmailStatement}
          currency={currency}
          onClose={() => setViewingEmailStatement(null)}
          onViewPdf={handleViewPdf}
          onExtract={handleExtractStatement}
          onUnlock={(s) => setUnlockingStatement(s)}
        />
      )}

      {/* Category Selection Floating Dropdown (Portal to document.body to avoid table overflow clipping) */}
      {openCategoryMenuId && activeMenuStmt && categoryMenuPos && createPortal(
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99998,
              background: 'transparent'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpenCategoryMenuId(null);
              setCategoryMenuPos(null);
              setActiveMenuStmt(null);
            }}
          />
          <div
            style={{
              position: 'fixed',
              ...(categoryMenuPos.top !== undefined ? { top: categoryMenuPos.top } : {}),
              ...(categoryMenuPos.bottom !== undefined ? { bottom: categoryMenuPos.bottom } : {}),
              left: categoryMenuPos.left,
              zIndex: 99999,
              minWidth: '185px',
              background: '#0b1120',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '9px',
              padding: '0.35rem',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-dim)',
                padding: '0.2rem 0.5rem 0.35rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '0.2rem'
              }}
            >
              Select Category
            </div>
            {STATEMENT_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              const isSelected = (activeMenuStmt.category || 'banking').toLowerCase() === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const targetStmt = activeMenuStmt;
                    setOpenCategoryMenuId(null);
                    setCategoryMenuPos(null);
                    setActiveMenuStmt(null);
                    await handleUpdateCategory(targetStmt, cat.key);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.38rem 0.55rem',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    color: isSelected ? '#ffffff' : '#cbd5e1',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 700 : 500,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <IconComponent size={12} style={{ color: cat.color }} />
                  <span style={{ flex: 1 }}>{cat.label}</span>
                  {isSelected && <span style={{ color: '#10b981', fontSize: '0.72rem', fontWeight: 800 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </>,
        document.body
      )}

    </div>
  );
};

