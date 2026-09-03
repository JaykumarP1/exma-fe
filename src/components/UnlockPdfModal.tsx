import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Upload, X, ShieldCheck, AlertCircle } from 'lucide-react';

import { Project } from '../types';

import { StagingDataState } from './ExpenseStagingPage';
import { Select } from './ui';

interface UnlockPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onStagingReady?: (data: StagingDataState) => void;
}

export const UnlockPdfModal: React.FC<UnlockPdfModalProps> = ({
  isOpen,
  onClose,
  projects,
  onStagingReady
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [unlockAndStore, setUnlockAndStore] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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

          {/* Password Input (Optional - only needed for password-protected PDFs) */}
          {(!selectedFile || selectedFile.name.toLowerCase().endsWith('.pdf')) && (
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.4rem', display: 'block' }}>
                PDF Password (Optional if unencrypted)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  placeholder="Enter password to unlock PDF (or leave blank if none)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem 0.7rem 2.4rem',
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
              onChange={setSelectedProjectId}
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


