import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard,
  Plus,
  X,
  Search,
  Check,
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Card, Project } from '../types';
import * as api from '../services/api';
import {
  detectCardNetwork,
  validateCardNumber,
  formatCardNumber,
  validateExpiryDate,
  formatExpiryDate
} from '../utils/cardValidation';
import { CardNetworkBadge } from './ui/CardNetworkBadge';

interface LinkCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedLastFour?: string;
  detectedBankName?: string;
  currentCardId?: number;
  currentBankId?: number;
  projects: Project[];
  onSelectCard: (card: Card) => Promise<void> | void;
  onCardCreated?: (newCard: Card) => void;
}

const CARD_TYPE_OPTIONS = [
  'Visa',
  'Mastercard',
  'Amex',
  'RuPay',
  'Discover',
  'Credit',
  'Debit',
  'Virtual'
];

export const LinkCardModal: React.FC<LinkCardModalProps> = ({
  isOpen,
  onClose,
  detectedLastFour = '',
  detectedBankName = '',
  currentCardId,
  currentBankId,
  projects = [],
  onSelectCard,
  onCardCreated
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'create' | 'existing'>('existing');

  // Form states for creating a new card
  const [newCardName, setNewCardName] = useState<string>('');
  const [newCardNumber, setNewCardNumber] = useState<string>('');
  const [newCardBankId, setNewCardBankId] = useState<number | undefined>(currentBankId);
  const [newCardType, setNewCardType] = useState<string>('Visa');
  const [userSelectedType, setUserSelectedType] = useState<boolean>(false);
  const [newCardHolder, setNewCardHolder] = useState<string>('Primary Cardholder');
  const [newCardExpiry, setNewCardExpiry] = useState<string>('12/28');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Compute live validation results
  const cardValidation = validateCardNumber(newCardNumber);
  const expiryValidation = validateExpiryDate(newCardExpiry);

  const handleCardNumberChange = (raw: string) => {
    // If user enters bullets or mask, keep as is
    if (raw.includes('•') || raw.includes('*')) {
      setNewCardNumber(raw);
      return;
    }

    const formatted = formatCardNumber(raw);
    setNewCardNumber(formatted);

    // Auto-detect network and select type if user hasn't manually overridden
    const detected = detectCardNetwork(formatted);
    if (detected !== 'Unknown' && !userSelectedType) {
      setNewCardType(detected);
    }
  };

  const handleExpiryChange = (raw: string) => {
    const formatted = formatExpiryDate(raw);
    setNewCardExpiry(formatted);
  };

  // Load existing cards when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingCards(true);
      setError(null);
      setUserSelectedType(false);

      api.fetchCards()
        .then((res) => {
          const list = res.cards || [];
          setCards(list);
          if (list.length === 0) {
            setActiveTab('create');
          } else {
            setActiveTab('existing');
          }
        })
        .catch((err) => {
          console.error('Failed to load cards:', err);
          setError('Failed to load cards list.');
        })
        .finally(() => {
          setLoadingCards(false);
        });

      // Pre-fill creation form
      const prefillBankName = detectedBankName || (projects.find(p => p.id === currentBankId)?.title) || '';
      setNewCardName(prefillBankName ? `${prefillBankName} Credit Card` : 'Credit Card');
      setNewCardNumber(detectedLastFour ? `•••• •••• •••• ${detectedLastFour}` : '');
      setNewCardBankId(currentBankId || (projects.length > 0 ? projects[0].id : undefined));
      setNewCardType('Visa');
      setNewCardHolder('Primary Cardholder');
      setNewCardExpiry('12/28');
      setSearchQuery('');
    }
  }, [isOpen, detectedLastFour, detectedBankName, currentBankId, projects]);

  if (!isOpen) return null;

  const handleCreateAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber.trim()) {
      setError('Please provide the card number or last 4 digits.');
      return;
    }

    // Strict validation if user entered a full card number
    if (cardValidation.error) {
      setError(cardValidation.error);
      return;
    }
    if (!cardValidation.isPartial && !cardValidation.isValid) {
      setError(cardValidation.error || 'Please enter a valid card number');
      return;
    }

    if (newCardExpiry.trim() && expiryValidation.error) {
      setError(expiryValidation.error);
      return;
    }

    const targetBankId = newCardBankId || currentBankId || (projects.length > 0 ? projects[0].id : 1);

    try {
      setSubmitting(true);
      setError(null);

      const created = await api.createCard({
        project_id: targetBankId,
        card_number: newCardNumber.trim(),
        card_name: newCardName.trim() || 'Credit Card',
        card_holder_name: newCardHolder.trim() || 'Primary Cardholder',
        card_type: newCardType,
        expiry_date: newCardExpiry.trim() || '12/28',
        status: 'active'
      });

      if (onCardCreated) {
        onCardCreated(created);
      }

      await onSelectCard(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to create and link card:', err);
      setError(err?.message || 'Failed to create and link card. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectExisting = async (card: Card) => {
    try {
      setSubmitting(true);
      setError(null);
      await onSelectCard(card);
      onClose();
    } catch (err: any) {
      console.error('Failed to link card:', err);
      setError(err?.message || 'Failed to link card.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCards = cards.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.card_name?.toLowerCase().includes(q) ||
      c.last_four?.includes(q) ||
      c.card_number?.includes(q) ||
      c.bank_name?.toLowerCase().includes(q) ||
      c.card_type?.toLowerCase().includes(q) ||
      c.card_holder_name?.toLowerCase().includes(q)
    );
  });

  return createPortal(
    <div
      className="modal-backdrop"
      style={{ zIndex: 1000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '540px', width: '92%' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8'
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                Link Credit Card
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {detectedLastFour
                  ? `Associate statement ending in •• ${detectedLastFour} with your card`
                  : 'Associate statement with a credit or debit card'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-glass)'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('existing');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'existing' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'existing' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Existing Cards</span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'inherit'
              }}
            >
              {cards.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setError(null);
            }}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'create' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'create' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={14} />
            <span>Add New Card</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Existing Cards Tab */}
        {activeTab === 'existing' && (
          <div>
            <div
              style={{
                position: 'relative',
                marginBottom: '1rem'
              }}
            >
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)'
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cards by name, number, bank..."
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-glass)',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>

            <div
              style={{
                maxHeight: '280px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              {loadingCards ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Loading workspace cards...
                </div>
              ) : filteredCards.length === 0 ? (
                <div
                  style={{
                    padding: '2.5rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <CreditCard size={32} style={{ opacity: 0.3 }} />
                  <div style={{ fontSize: '0.85rem' }}>
                    {cards.length === 0 ? 'No cards created in your workspace yet.' : 'No cards match your search.'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#a5b4fc',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Plus size={14} /> Add New Card
                  </button>
                </div>
              ) : (
                filteredCards.map((card) => {
                  const isCurrent = card.id === currentCardId;
                  const isMatched = detectedLastFour && (card.last_four === detectedLastFour || card.card_number?.endsWith(detectedLastFour));

                  return (
                    <div
                      key={card.id}
                      style={{
                        padding: '0.75rem 0.95rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isCurrent
                          ? 'rgba(16, 185, 129, 0.1)'
                          : isMatched
                          ? 'rgba(99, 102, 241, 0.12)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isCurrent
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : isMatched
                          ? '1px solid rgba(99, 102, 241, 0.4)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: isCurrent
                              ? 'rgba(16, 185, 129, 0.2)'
                              : isMatched
                              ? 'rgba(99, 102, 241, 0.25)'
                              : 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isCurrent ? '#34d399' : isMatched ? '#a5b4fc' : 'var(--text-muted)',
                            flexShrink: 0
                          }}
                        >
                          <CreditCard size={18} />
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                              {card.card_name || `${card.bank_name} Card`}
                            </span>
                            {isMatched && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '10px',
                                  background: 'rgba(99, 102, 241, 0.2)',
                                  color: '#c7d2fe',
                                  border: '1px solid rgba(99, 102, 241, 0.4)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                              >
                                <Sparkles size={10} /> Match
                              </span>
                            )}
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '10px',
                                  background: 'rgba(16, 185, 129, 0.2)',
                                  color: '#34d399',
                                  border: '1px solid rgba(16, 185, 129, 0.4)'
                                }}
                              >
                                Current
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#e2e8f0' }}>
                              {card.masked_number || `•••• •••• •••• ${card.last_four || '••••'}`}
                            </span>
                            <span>•</span>
                            <CardNetworkBadge network={card.card_type} size="sm" />
                            {card.bank_name && (
                              <>
                                <span>•</span>
                                <span>{card.bank_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectExisting(card)}
                        disabled={submitting || isCurrent}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          background: isCurrent
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isCurrent || submitting ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          flexShrink: 0
                        }}
                      >
                        {isCurrent ? (
                          <>
                            <Check size={13} />
                            <span>Linked</span>
                          </>
                        ) : (
                          <span>Link Card</span>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Add New Card Tab */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateAndLink}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {/* Card Number / Last 4 */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Card Number / Last 4 Digits <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newCardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    placeholder="e.g. 4315 8157 2560 7017 or •••• 9149"
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem 6.5rem 0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: cardValidation.error
                        ? '1px solid #ef4444'
                        : cardValidation.isValid && cardValidation.isComplete
                        ? '1px solid #10b981'
                        : '1px solid var(--border-glass)',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: '0.6rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      pointerEvents: 'none'
                    }}
                  >
                    {cardValidation.isValid && cardValidation.isComplete && (
                      <CheckCircle2 size={16} color="#34d399" />
                    )}
                    <CardNetworkBadge
                      network={cardValidation.network !== 'Unknown' ? cardValidation.network : newCardType}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Live validation feedback */}
                <div style={{ marginTop: '0.35rem', minHeight: '1.1rem', fontSize: '0.72rem' }}>
                  {cardValidation.error && (
                    <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={12} /> {cardValidation.error}
                    </span>
                  )}
                  {!cardValidation.error && cardValidation.isValid && cardValidation.isComplete && (
                    <span style={{ color: '#34d399', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check size={12} /> Valid {cardValidation.network} card (checksum verified)
                    </span>
                  )}
                  {!cardValidation.error && cardValidation.warning && (
                    <span style={{ color: 'var(--text-dim)' }}>
                      {cardValidation.warning}
                    </span>
                  )}
                  {!cardValidation.error && !cardValidation.warning && cardValidation.isPartial && (
                    <span style={{ color: 'var(--text-dim)' }}>
                      Statement last-4 mode: will link statements ending in •••• {cardValidation.digits.slice(-4) || 'XXXX'}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Nickname */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Card Nickname / Title
                </label>
                <input
                  type="text"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  placeholder="e.g. SBI SimplyCLICK Credit Card"
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-glass)',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Bank Selection & Card Type Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Bank / Issuer
                  </label>
                  <select
                    value={newCardBankId || ''}
                    onChange={(e) => setNewCardBankId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: '#1e293b',
                      border: '1px solid var(--border-glass)',
                      color: '#f8fafc',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Card Network / Type
                    </label>
                    {cardValidation.network !== 'Unknown' && (
                      <span style={{ fontSize: '0.68rem', color: '#818cf8', fontWeight: 600 }}>
                        Auto-detected
                      </span>
                    )}
                  </div>
                  <select
                    value={newCardType}
                    onChange={(e) => {
                      setNewCardType(e.target.value);
                      setUserSelectedType(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: '#1e293b',
                      border: '1px solid var(--border-glass)',
                      color: '#f8fafc',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  >
                    {CARD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cardholder Name & Expiry Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={newCardHolder}
                    onChange={(e) => setNewCardHolder(e.target.value)}
                    placeholder="e.g. Primary Cardholder"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-glass)',
                      color: '#f8fafc',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    Expiry Date (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={newCardExpiry}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    placeholder="e.g. 12/28"
                    maxLength={5}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: newCardExpiry && expiryValidation.error
                        ? '1px solid #ef4444'
                        : newCardExpiry && expiryValidation.isValid
                        ? '1px solid #10b981'
                        : '1px solid var(--border-glass)',
                      color: '#f8fafc',
                      fontSize: '0.82rem',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  {newCardExpiry && expiryValidation.error && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: '#f87171' }}>
                      {expiryValidation.error}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-glass)'
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
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
                disabled={submitting || !newCardNumber.trim()}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: submitting || !newCardNumber.trim()
                    ? 'rgba(99, 102, 241, 0.3)'
                    : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: submitting || !newCardNumber.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                }}
              >
                {submitting ? (
                  <span>Saving & Linking...</span>
                ) : (
                  <>
                    <Plus size={15} />
                    <span>Create & Link Card</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
