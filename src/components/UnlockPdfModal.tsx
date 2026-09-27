import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Lock,
  Upload,
  X,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Building2,
  Check,
  CreditCard
} from 'lucide-react';

import { Project, Card } from '../types';
import * as api from '../services/api';

import { StagingDataState } from './ExpenseStagingPage';
import { Select } from './ui';

interface UnlockPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  cards?: Card[];
  onStagingReady?: (data: StagingDataState) => void;
}

export const UnlockPdfModal: React.FC<UnlockPdfModalProps> = ({
  isOpen,
  onClose,
  projects,
  cards = [],
  onStagingReady
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPasswordSource, setSelectedPasswordSource] = useState<string | null>(null);
  const [unlockAndStore, setUnlockAndStore] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loadedCards, setLoadedCards] = useState<Card[]>(cards);

  useEffect(() => {
    if (cards && cards.length > 0) {
      setLoadedCards(cards);
    } else if (isOpen) {
      api.fetchCards()
        .then((res) => {
          if (res && res.cards) setLoadedCards(res.cards);
        })
        .catch(() => {});
    }
  }, [cards, isOpen]);

  const savedPasswordOptions = useMemo(() => {
    const list: { id: string | number; label: string; password: string; sourceType: 'card' | 'bank'; bankId?: number }[] = [];
    const seen = new Set<string>();

    if (loadedCards) {
      loadedCards.forEach((c) => {
        if (c.has_statement_password && c.statement_password && !seen.has(c.statement_password)) {
          const last4 = c.last_four || (c.card_number ? c.card_number.slice(-4) : '');
          const label = c.card_name || `${c.card_type || 'Credit'} Card`;
          list.push({
            id: `card-${c.id}`,
            label: `${label} (•••• ${last4})`,
            password: c.statement_password,
            sourceType: 'card',
            bankId: c.project_id
          });
          seen.add(c.statement_password);
        }
      });
    }

    projects.forEach((p) => {
      if (p.has_statement_password && p.statement_password && !seen.has(p.statement_password)) {
        list.push({
          id: p.id,
          label: p.title,
          password: p.statement_password,
          sourceType: 'bank',
          bankId: p.id
        });
        seen.add(p.statement_password);
      }
    });
    return list;
  }, [projects, loadedCards]);

  if (!isOpen) return null;


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a statement file (PDF or Excel).');
      return;
    }

    const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf');
    const projId = selectedProjectId ? parseInt(selectedProjectId, 10) : undefined;
    const matchedProj = projects.find((p) => p.id === projId);

    const initialStagingData: StagingDataState = {
      draftId: `draft-temp-${Date.now()}`,
      filename: selectedFile.name,
      pdfUrl: isPdf ? URL.createObjectURL(selectedFile) : undefined,
      isPdf: isPdf,
      file: selectedFile,
      password: password.trim() ? password : undefined,
      unlockAndStore: unlockAndStore,
      isExtracting: true,
      projectId: projId,
      projectTitle: matchedProj?.title,
      items: []
    };

    if (onStagingReady) {
      onStagingReady(initialStagingData);
    }

    setSelectedFile(null);
    setPassword('');
    setSelectedProjectId('');
    onClose();
  };



  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '520px', width: '90%' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Upload size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Upload Statement (PDF / Excel)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Upload PDF (locked or unlocked), Excel (.xlsx, .xls) or CSV statement to extract expenses
              </p>
            </div>

          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.2rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* File Picker */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.4rem', display: 'block' }}>
              Select Statement File (PDF / Excel / CSV)
            </label>
            <div
              style={{
                border: '2px dashed var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => document.getElementById('unlock-pdf-input')?.click()}
            >
              <input
                id="unlock-pdf-input"
                type="file"
                accept=".pdf,.xls,.xlsx,.csv,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              {selectedFile ? (
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Click or drag a statement file (<strong style={{ color: '#f8fafc' }}>PDF</strong>, <strong style={{ color: '#f8fafc' }}>Excel</strong>, or <strong style={{ color: '#f8fafc' }}>CSV</strong>)
                </div>
              )}
            </div>
          </div>

          {/* Saved Bank Passwords Quick-Fill Chips */}
          {savedPasswordOptions.length > 0 && (!selectedFile || selectedFile.name.toLowerCase().endsWith('.pdf')) && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(56, 189, 248, 0.06) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <KeyRound size={13} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f8fafc' }}>
                    Saved Passwords (Cards & Banks)
                  </span>
                </div>
                <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>
                  Click to quick-fill
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {savedPasswordOptions.map((opt) => {
                  const isSelected = password === opt.password;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setPassword(opt.password);
                        setSelectedPasswordSource(opt.label);
                        if (opt.bankId) {
                          setSelectedProjectId(String(opt.bankId));
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.3rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.7)',
                        border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        cursor: 'pointer'
                      }}
                      title={`Apply saved password for ${opt.label}`}
                    >
                      {opt.sourceType === 'card' ? (
                        <CreditCard size={12} style={{ color: isSelected ? '#10b981' : '#c084fc' }} />
                      ) : (
                        <Building2 size={12} style={{ color: isSelected ? '#10b981' : '#38bdf8' }} />
                      )}
                      <span>{opt.label}</span>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          padding: '0.05rem 0.3rem',
                          borderRadius: '3px',
                          background: opt.sourceType === 'card' ? 'rgba(192, 132, 252, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: opt.sourceType === 'card' ? '#c084fc' : '#38bdf8'
                        }}
                      >
                        {opt.sourceType === 'card' ? 'Card' : 'Bank'}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: isSelected ? '#a7f3d0' : 'var(--text-dim)',
                          letterSpacing: '0.08em'
                        }}
                      >
                        ••••••••
                      </span>
                      {isSelected && <Check size={12} style={{ color: '#10b981' }} />}
                    </button>
                  );
                })}
              </div>

              {selectedPasswordSource && password && (
                <div style={{ fontSize: '0.68rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Check size={11} style={{ color: '#10b981' }} />
                  <span>Password applied from <strong>{selectedPasswordSource}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Password Input (Optional - only needed for password-protected PDFs) */}
          {(!selectedFile || selectedFile.name.toLowerCase().endsWith('.pdf')) && (
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.4rem', display: 'block' }}>
                PDF Password (Optional if unencrypted)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password to unlock PDF (or leave blank if none)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 2.5rem 0.7rem 2.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-glass)',
                    color: '#ffffff',
                    fontSize: '0.88rem'
                  }}
                />
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Unlock & Store Option (only relevant if PDF has password) */}
          {(!selectedFile || selectedFile.name.toLowerCase().endsWith('.pdf')) && password.trim().length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.75rem 0.95rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
                border: unlockAndStore ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setUnlockAndStore(!unlockAndStore)}
            >
              <input
                type="checkbox"
                id="unlock-and-store-checkbox"
                checked={unlockAndStore}
                onChange={(e) => setUnlockAndStore(e.target.checked)}
                style={{ marginTop: '0.2rem', cursor: 'pointer', accentColor: '#10b981' }}
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <label
                  htmlFor="unlock-and-store-checkbox"
                  style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', cursor: 'pointer', display: 'block' }}
                >
                  Unlock and store decrypted PDF
                </label>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {unlockAndStore
                    ? 'Store decrypted PDF permanently (password not needed for future viewing).'
                    : 'Keep PDF locked with password after processing (re-entered password required to view PDF later).'}
                </div>
              </div>
            </div>
          )}



          {/* Project Assignment */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.4rem', display: 'block' }}>
              Assign to Bank / Project (Optional)
            </label>
            <Select
              value={selectedProjectId}
              onChange={(val) => {
                setSelectedProjectId(val);
                const matched = projects.find((p) => p.id === parseInt(val, 10));
                if (matched?.statement_password) {
                  setPassword(matched.statement_password);
                  setSelectedPasswordSource(matched.title);
                }
              }}
              options={[
                { value: '', label: 'Unassigned Bank' },
                ...projects.map((p) => ({ value: String(p.id), label: p.title }))
              ]}
              placeholder="Unassigned Bank"
            />
          </div>

          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.78rem',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>
              Your password is used in memory for a single decryption pass and is <strong>never stored</strong>.
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-glass)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.65rem 1.35rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: '1px solid #10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                cursor: 'pointer'
              }}
            >
              <Upload size={16} /> Process & Preview Statement
            </button>


          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};


