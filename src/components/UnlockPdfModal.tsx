import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Unlock, Upload, X, ShieldCheck, AlertCircle } from 'lucide-react';
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
      setError('Please select a password-protected PDF statement file.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter the PDF password.');
      return;
    }

    const projId = selectedProjectId ? parseInt(selectedProjectId, 10) : undefined;
    const matchedProj = projects.find((p) => p.id === projId);

    const initialStagingData: StagingDataState = {
      draftId: `draft-temp-${Date.now()}`,
      filename: selectedFile.name,
      pdfUrl: URL.createObjectURL(selectedFile),
      isPdf: true,
      file: selectedFile,
      password: password,
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
              <Unlock size={20} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Unlock & Save PDF Statement
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Decrypt password-protected PDFs for 1-click password-free download & OCR
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
              Select PDF Statement File
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
                accept=".pdf"
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
                  Click or drag a password-protected <strong style={{ color: '#f8fafc' }}>.PDF</strong> statement
                </div>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.4rem', display: 'block' }}>
              PDF Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="Enter password to unlock PDF"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
              <Unlock size={16} /> Unlock & Preview Statement
            </button>

          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};


