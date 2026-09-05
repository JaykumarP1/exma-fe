import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Building2,
  FileText,
  Receipt,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  AlertCircle,
  X,
  Link as LinkIcon,
  Unlink
} from 'lucide-react';
import { Card, Project, Statement, Expense, CardsResponse } from '../types';
import * as api from '../services/api';
import { Select } from './ui/Select';
import { Tooltip } from './Tooltip';
import { formatCurrency } from '../utils/currency';

interface CardsPageProps {
  projects: Project[];
  currency: string;
}

export const CardsPage: React.FC<CardsPageProps> = ({ projects, currency }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<CardsResponse['stats']>({
    total_cards: 0,
    active_cards: 0,
    total_spend: 0,
    total_statement_balance: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Slider drawer state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardDetails, setCardDetails] = useState<Card | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'statements' | 'expenses'>('statements');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);

  // Link dialogs
  const [isLinkStatementsOpen, setIsLinkStatementsOpen] = useState(false);
  const [isLinkExpensesOpen, setIsLinkExpensesOpen] = useState(false);
  const [availableStatements, setAvailableStatements] = useState<Statement[]>([]);
  const [availableExpenses, setAvailableExpenses] = useState<Expense[]>([]);
  const [selectedStatementIds, setSelectedStatementIds] = useState<number[]>([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<number[]>([]);
  const [propagateExpenses, setPropagateExpenses] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    project_id: projects[0]?.id || 0,
    card_name: '',
    card_number: '',
    card_holder_name: '',
    card_type: 'Visa',
    expiry_date: '',
    status: 'active'
  });

  const loadCards = async () => {
    setLoading(true);
    try {
      const res = await api.fetchCards({
        bank_id: selectedBank,
        status: selectedStatus,
        search: searchQuery
      });
      setCards(res.cards || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error('Failed to load cards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [selectedBank, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCards();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCardDetails = async (cardId: number) => {
    setLoadingDetails(true);
    try {
      const details = await api.fetchCard(cardId);
      setCardDetails(details);
    } catch (err) {
      console.error('Failed to fetch card details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectCard = (card: Card) => {
    setSelectedCard(card);
    loadCardDetails(card.id);
  };

  const handleOpenAddModal = () => {
    setFormData({
      project_id: projects[0]?.id || 0,
      card_name: '',
      card_number: '',
      card_holder_name: '',
      card_type: 'Visa',
      expiry_date: '',
      status: 'active'
    });
    setEditingCard(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (card: Card, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData({
      project_id: card.project_id || projects[0]?.id || 0,
      card_name: card.card_name || '',
      card_number: card.masked_number || '',
      card_holder_name: card.card_holder_name || '',
      card_type: card.card_type || 'Visa',
      expiry_date: card.expiry_date || '',
      status: card.status || 'active'
    });
    setEditingCard(card);
    setIsAddModalOpen(true);
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCard) {
        await api.updateCard(editingCard.id, {
          project_id: formData.project_id,
          card_name: formData.card_name,
          card_holder_name: formData.card_holder_name,
          card_type: formData.card_type,
          expiry_date: formData.expiry_date,
          status: formData.status
        });
      } else {
        await api.createCard({
          project_id: formData.project_id,
          card_name: formData.card_name,
          card_number: formData.card_number,
          card_holder_name: formData.card_holder_name,
          card_type: formData.card_type,
          expiry_date: formData.expiry_date,
          status: formData.status
        });
      }
      setIsAddModalOpen(false);
      loadCards();
      if (selectedCard) {
        loadCardDetails(selectedCard.id);
      }
    } catch (err) {
      console.error('Failed to save card:', err);
    }
  };

  const handleDeleteCard = async () => {
    if (!deletingCard) return;
    try {
      await api.deleteCard(deletingCard.id);
      setDeletingCard(null);
      if (selectedCard?.id === deletingCard.id) {
        setSelectedCard(null);
        setCardDetails(null);
      }
      loadCards();
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  const handleToggleStatus = async (card: Card) => {
    const newStatus = card.status === 'active' ? 'locked' : 'active';
    try {
      await api.updateCard(card.id, { status: newStatus });
      loadCards();
      if (cardDetails?.id === card.id) {
        setCardDetails({ ...cardDetails, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to toggle card status:', err);
    }
  };

  // Linking statements
  const handleOpenLinkStatements = async () => {
    try {
      const res = await api.fetchStatements();
      const unlinked = (res.statements || []).filter((s) => s.card_id !== selectedCard?.id);
      setAvailableStatements(unlinked);
      setSelectedStatementIds([]);
      setIsLinkStatementsOpen(true);
    } catch (err) {
      console.error('Failed to fetch statements for linking:', err);
    }
  };

  const handleConfirmLinkStatements = async () => {
    if (!selectedCard || selectedStatementIds.length === 0) return;
    try {
      await api.linkCardStatements(selectedCard.id, selectedStatementIds, propagateExpenses);
      setIsLinkStatementsOpen(false);
      loadCardDetails(selectedCard.id);
      loadCards();
    } catch (err) {
      console.error('Failed to link statements:', err);
    }
  };

  const handleUnlinkStatement = async (statementId: number) => {
    if (!selectedCard) return;
    try {
      await api.unlinkCardStatement(selectedCard.id, statementId, true);
      loadCardDetails(selectedCard.id);
      loadCards();
    } catch (err) {
      console.error('Failed to unlink statement:', err);
    }
  };

  // Linking expenses
  const handleOpenLinkExpenses = async () => {
    try {
      const res = await api.fetchExpenses();
      const unlinked = (res.expenses || []).filter((e) => e.card_id !== selectedCard?.id);
      setAvailableExpenses(unlinked);
      setSelectedExpenseIds([]);
      setIsLinkExpensesOpen(true);
    } catch (err) {
      console.error('Failed to fetch expenses for linking:', err);
    }
  };

  const handleConfirmLinkExpenses = async () => {
    if (!selectedCard || selectedExpenseIds.length === 0) return;
    try {
      await api.linkCardExpenses(selectedCard.id, selectedExpenseIds);
      setIsLinkExpensesOpen(false);
      loadCardDetails(selectedCard.id);
      loadCards();
    } catch (err) {
      console.error('Failed to link expenses:', err);
    }
  };

  const handleUnlinkExpense = async (expenseId: number) => {
    if (!selectedCard) return;
    try {
      await api.unlinkCardExpense(selectedCard.id, expenseId);
      loadCardDetails(selectedCard.id);
      loadCards();
    } catch (err) {
      console.error('Failed to unlink expense:', err);
    }
  };

  const getCardGradient = (cardType: string) => {
    const type = cardType?.toLowerCase() || '';
    if (type.includes('visa')) {
      return 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)';
    }
    if (type.includes('mastercard')) {
      return 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #b91c1c 100%)';
    }
    if (type.includes('amex')) {
      return 'linear-gradient(135deg, #0f172a 0%, #334155 50%, #475569 100%)';
    }
    if (type.includes('rupay')) {
      return 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)';
    }
    return 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e1b4b 100%)';
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.15))',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}
            >
              <CreditCard size={20} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Payment & Credit Cards
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Manage credit cards, debit cards, and link them to bank accounts, statements, and expenses.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
          }}
        >
          <Plus size={16} /> Add New Card
        </button>
      </div>

      {/* Summary Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Cards
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem' }}>
            {stats.total_cards}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Registered payment cards
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
            Active Cards
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '0.35rem' }}>
            {stats.active_cards}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Ready for statement & expense billing
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
            Total Card Spend
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.35rem' }}>
            {formatCurrency(stats.total_spend, currency)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Cumulative charged expenses
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 700 }}>
            Statement Dues
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc', marginTop: '0.35rem' }}>
            {formatCurrency(stats.total_statement_balance, currency)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Total from linked statements
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)'
            }}
          />
          <input
            type="text"
            placeholder="Search cards by name, number, holder, or bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              color: '#ffffff',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <Select
            value={selectedBank}
            onChange={(val) => setSelectedBank(val)}
            options={[
              { value: 'all', label: 'All Banks / Projects' },
              ...projects.map((p) => ({ value: p.id.toString(), label: p.title }))
            ]}
          />
        </div>

        <div style={{ minWidth: '150px' }}>
          <Select
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'locked', label: 'Locked' },
              { value: 'expired', label: 'Expired' }
            ]}
          />
        </div>
      </div>

      {/* Cards Grid */}
      {loading && cards.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading cards...
        </div>
      ) : cards.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <CreditCard size={44} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
            No Cards Found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            Add your credit or debit cards to link statements and track expenses per card.
          </p>
          <button
            onClick={handleOpenAddModal}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Add Your First Card
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {cards.map((card) => {
            const isLocked = card.status === 'locked';
            const isExpired = card.status === 'expired';

            return (
              <div
                key={card.id}
                onClick={() => handleSelectCard(card)}
                style={{
                  background: getCardGradient(card.card_type),
                  borderRadius: '16px',
                  padding: '1.5rem',
                  color: '#ffffff',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  border: selectedCard?.id === card.id ? '2px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.12)',
                  transition: 'all 0.25s ease',
                  transform: selectedCard?.id === card.id ? 'translateY(-4px)' : 'none'
                }}
              >
                {/* Decorative background glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-30px',
                    right: '-30px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    filter: 'blur(16px)',
                    pointerEvents: 'none'
                  }}
                />

                {/* Card Top Row: Bank Badge & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#f8fafc'
                    }}
                  >
                    <Building2 size={12} /> {card.bank_name || card.project_title || 'Unassigned'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.18rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: isLocked ? 'rgba(245, 158, 11, 0.25)' : isExpired ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                        color: isLocked ? '#fbbf24' : isExpired ? '#f87171' : '#34d399',
                        border: isLocked ? '1px solid rgba(245, 158, 11, 0.4)' : isExpired ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      {card.status}
                    </span>
                  </div>
                </div>

                {/* Chip & Network */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  {/* EMV Chip Visual */}
                  <div
                    style={{
                      width: '38px',
                      height: '28px',
                      borderRadius: '5px',
                      background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)',
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-around',
                      padding: '3px'
                    }}
                  >
                    <div style={{ height: '1px', background: 'rgba(0, 0, 0, 0.2)' }} />
                    <div style={{ height: '1px', background: 'rgba(0, 0, 0, 0.2)' }} />
                  </div>

                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 900,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }}
                  >
                    {card.card_type}
                  </span>
                </div>

                {/* Card Number */}
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.15rem',
                    letterSpacing: '0.18em',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {card.masked_number}
                </div>

                {/* Card Holder & Expiry */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.05em' }}>
                      Cardholder
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {card.card_holder_name}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.7, letterSpacing: '0.05em' }}>
                      Expires
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: 700 }}>
                      {card.expiry_date}
                    </div>
                  </div>
                </div>

                {/* Bottom Card Summary Footnote */}
                <div
                  style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    opacity: 0.85
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <FileText size={12} /> {card.statements_count || 0} statements
                  </span>

                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Receipt size={12} /> {card.expenses_count || 0} expenses ({formatCurrency(card.total_spend || 0, currency)})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Right Slider Drawer for Card Details & Linkages */}
      {selectedCard && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 16, 0.72)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'stretch'
          }}
          onClick={() => {
            setSelectedCard(null);
            setCardDetails(null);
          }}
        >
          <div
            className="animate-slide-in-right"
            style={{
              width: '100%',
              maxWidth: '680px',
              height: '100vh',
              maxHeight: '100vh',
              background: 'linear-gradient(180deg, #0b1329 0%, #0f172a 100%)',
              borderLeft: '1px solid var(--border-glass)',
              boxShadow: '-16px 0 48px rgba(0, 0, 0, 0.75)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.15))',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8'
                  }}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    {selectedCard.card_name || `${selectedCard.card_type} Card`}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                    {selectedCard.bank_name || selectedCard.project_title || 'Unassigned Bank'} • {selectedCard.masked_number}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => handleToggleStatus(selectedCard)}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedCard.status === 'active' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: selectedCard.status === 'active' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                    color: selectedCard.status === 'active' ? '#fbbf24' : '#34d399',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {selectedCard.status === 'active' ? <Lock size={13} /> : <Unlock size={13} />}
                  {selectedCard.status === 'active' ? 'Lock Card' : 'Activate'}
                </button>

                <button
                  onClick={(e) => handleOpenEditModal(selectedCard, e)}
                  style={{
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                  title="Edit Card Details"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => setDeletingCard(selectedCard)}
                  style={{
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    cursor: 'pointer'
                  }}
                  title="Delete Card"
                >
                  <Trash2 size={16} />
                </button>

                <button
                  onClick={() => {
                    setSelectedCard(null);
                    setCardDetails(null);
                  }}
                  style={{
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    marginLeft: '0.25rem'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-glass)',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '0 1.5rem'
              }}
            >
              <button
                onClick={() => setActiveTab('statements')}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: activeTab === 'statements' ? '#818cf8' : 'var(--text-muted)',
                  borderBottom: activeTab === 'statements' ? '2px solid #6366f1' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <FileText size={14} /> Linked Statements ({cardDetails?.statements?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: activeTab === 'expenses' ? '#818cf8' : 'var(--text-muted)',
                  borderBottom: activeTab === 'expenses' ? '2px solid #6366f1' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Receipt size={14} /> Linked Expenses ({cardDetails?.expenses?.length || 0})
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading linked records...
                </div>
              ) : activeTab === 'statements' ? (
                <div>
                  {/* Statements Header & Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                        Card Statements
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        Statements assigned to this card
                      </p>
                    </div>

                    <button
                      onClick={handleOpenLinkStatements}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.15))',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        color: '#818cf8',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <LinkIcon size={13} /> Link Statement
                    </button>
                  </div>

                  {(!cardDetails?.statements || cardDetails.statements.length === 0) ? (
                    <div
                      style={{
                        padding: '2.5rem 1rem',
                        textAlign: 'center',
                        border: '1px dashed var(--border-glass)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.01)'
                      }}
                    >
                      <FileText size={32} style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                        No statements linked to this card yet.
                      </p>
                      <button
                        onClick={handleOpenLinkStatements}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(99, 102, 241, 0.2)',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          color: '#818cf8',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        Select Statements to Link
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {cardDetails.statements.map((stmt) => (
                        <div
                          key={stmt.id}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-glass)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                              {stmt.filename}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              Due: {stmt.due_date || 'N/A'} • {stmt.expenses_count} items
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                                {formatCurrency(stmt.total_due || stmt.total_amount, currency)}
                              </div>
                            </div>

                            <Tooltip content="Unlink Statement">
                              <button
                                onClick={() => handleUnlinkStatement(stmt.id)}
                                style={{
                                  padding: '0.35rem',
                                  borderRadius: 'var(--radius-xs)',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#f87171',
                                  cursor: 'pointer'
                                }}
                              >
                                <Unlink size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Expenses Header & Action */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                        Card Expenses
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        Individual transactions linked to this card
                      </p>
                    </div>

                    <button
                      onClick={handleOpenLinkExpenses}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(79, 70, 229, 0.15))',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        color: '#818cf8',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <LinkIcon size={13} /> Link Expenses
                    </button>
                  </div>

                  {(!cardDetails?.expenses || cardDetails.expenses.length === 0) ? (
                    <div
                      style={{
                        padding: '2.5rem 1rem',
                        textAlign: 'center',
                        border: '1px dashed var(--border-glass)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.01)'
                      }}
                    >
                      <Receipt size={32} style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                        No individual expenses linked to this card yet.
                      </p>
                      <button
                        onClick={handleOpenLinkExpenses}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(99, 102, 241, 0.2)',
                          border: '1px solid rgba(99, 102, 241, 0.35)',
                          color: '#818cf8',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        Select Expenses to Link
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {cardDetails.expenses.map((exp) => (
                        <div
                          key={exp.id}
                          style={{
                            padding: '0.85rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-glass)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                              {exp.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                              {exp.category} • {exp.expense_date || 'No date'} {exp.vendor ? `• ${exp.vendor}` : ''}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                                {formatCurrency(exp.amount, currency)}
                              </div>
                            </div>

                            <Tooltip content="Unlink Expense">
                              <button
                                onClick={() => handleUnlinkExpense(exp.id)}
                                style={{
                                  padding: '0.35rem',
                                  borderRadius: 'var(--radius-xs)',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#f87171',
                                  cursor: 'pointer'
                                }}
                              >
                                <Unlink size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Card Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 16, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{ width: '100%', maxWidth: '480px', padding: '1.75rem', background: '#0f172a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8'
                  }}
                >
                  <CreditCard size={18} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {editingCard ? 'Edit Payment Card' : 'Add New Card'}
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCard} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Bank Account / Project
                </label>
                <Select
                  value={formData.project_id.toString()}
                  onChange={(val) => setFormData({ ...formData, project_id: parseInt(val, 10) })}
                  options={projects.map((p) => ({ value: p.id.toString(), label: p.title }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Card Nickname / Label (e.g. HDFC Regalia Gold)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sapphiro Travel Card"
                  value={formData.card_name}
                  onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {!editingCard && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Card Number (Full or Last 4) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="4111 2222 3333 4444"
                    value={formData.card_number}
                    onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-glass)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Cardholder Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JOHN DOE"
                  value={formData.card_holder_name}
                  onChange={(e) => setFormData({ ...formData, card_holder_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Card Network
                  </label>
                  <Select
                    value={formData.card_type}
                    onChange={(val) => setFormData({ ...formData, card_type: val })}
                    options={[
                      { value: 'Visa', label: 'Visa' },
                      { value: 'Mastercard', label: 'Mastercard' },
                      { value: 'Amex', label: 'American Express' },
                      { value: 'RuPay', label: 'RuPay' },
                      { value: 'Discover', label: 'Discover' },
                      { value: 'Virtual', label: 'Virtual Card' }
                    ]}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    Expiry Date (MM/YY) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="12/28"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-glass)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(val) => setFormData({ ...formData, status: val })}
                  options={[
                    { value: 'active', label: 'Active (Ready for use)' },
                    { value: 'locked', label: 'Locked (Temporarily frozen)' },
                    { value: 'expired', label: 'Expired' }
                  ]}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {editingCard ? 'Save Changes' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Statements Modal */}
      {isLinkStatementsOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 16, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsLinkStatementsOpen(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{ width: '100%', maxWidth: '540px', padding: '1.75rem', background: '#0f172a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                  <LinkIcon size={18} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Link Statements to Card
                </h3>
              </div>
              <button onClick={() => setIsLinkStatementsOpen(false)} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            {availableStatements.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No unlinked statements found in this workspace.
              </div>
            ) : (
              <div>
                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {availableStatements.map((stmt) => (
                    <label
                      key={stmt.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedStatementIds.includes(stmt.id) ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: selectedStatementIds.includes(stmt.id) ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatementIds.includes(stmt.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStatementIds([...selectedStatementIds, stmt.id]);
                          } else {
                            setSelectedStatementIds(selectedStatementIds.filter((id) => id !== stmt.id));
                          }
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                          {stmt.filename}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {stmt.bank_title || stmt.bank_name} • {stmt.expenses_count} expenses
                        </div>
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(stmt.total_due || stmt.total_amount, currency)}
                      </div>
                    </label>
                  ))}
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={propagateExpenses}
                    onChange={(e) => setPropagateExpenses(e.target.checked)}
                  />
                  <span>Also associate all individual expenses inside these statements to this card</span>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    onClick={() => setIsLinkStatementsOpen(false)}
                    style={{
                      padding: '0.55rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmLinkStatements}
                    disabled={selectedStatementIds.length === 0}
                    style={{
                      padding: '0.55rem 1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: selectedStatementIds.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: selectedStatementIds.length === 0 ? 0.5 : 1
                    }}
                  >
                    Link {selectedStatementIds.length} Statement(s)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Expenses Modal */}
      {isLinkExpensesOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 16, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsLinkExpensesOpen(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{ width: '100%', maxWidth: '540px', padding: '1.75rem', background: '#0f172a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                  <LinkIcon size={18} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Link Expenses to Card
                </h3>
              </div>
              <button onClick={() => setIsLinkExpensesOpen(false)} style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>

            {availableExpenses.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No unlinked expenses found in this workspace.
              </div>
            ) : (
              <div>
                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {availableExpenses.slice(0, 50).map((exp) => (
                    <label
                      key={exp.id}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedExpenseIds.includes(exp.id) ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: selectedExpenseIds.includes(exp.id) ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedExpenseIds.includes(exp.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedExpenseIds([...selectedExpenseIds, exp.id]);
                          } else {
                            setSelectedExpenseIds(selectedExpenseIds.filter((id) => id !== exp.id));
                          }
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                          {exp.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {exp.category} • {exp.expense_date || 'No date'}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(exp.amount, currency)}
                      </div>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    onClick={() => setIsLinkExpensesOpen(false)}
                    style={{
                      padding: '0.55rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'transparent',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmLinkExpenses}
                    disabled={selectedExpenseIds.length === 0}
                    style={{
                      padding: '0.55rem 1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: selectedExpenseIds.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: selectedExpenseIds.length === 0 ? 0.5 : 1
                    }}
                  >
                    Link {selectedExpenseIds.length} Expense(s)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCard && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 8, 16, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setDeletingCard(null)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{ width: '100%', maxWidth: '420px', padding: '1.75rem', background: '#0f172a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertCircle size={22} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Delete Payment Card
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to delete{' '}
              <strong style={{ color: '#f8fafc' }}>
                {deletingCard.card_name || deletingCard.masked_number}
              </strong>
              ? Associated statements and expenses will remain preserved and unlinked.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setDeletingCard(null)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCard}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Delete Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
