import React from 'react';
import { X } from 'lucide-react';
import { PdfDocumentViewer } from './PdfDocumentViewer';

interface ViewPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string | null;
  filename: string;
  isPdf?: boolean;
}

export const ViewPdfModal: React.FC<ViewPdfModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  filename,
  isPdf = true
}) => {
  if (!isOpen) return null;

  const fullPdfUrl = pdfUrl
    ? (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')
        ? pdfUrl
        : `http://localhost:4000${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`)
    : null;



  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '90vw',
          maxWidth: '1100px',
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          background: '#090d16',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'rgba(30, 41, 59, 0.9)',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
            View Statement PDF
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <PdfDocumentViewer pdfUrl={fullPdfUrl} filename={filename} isPdf={isPdf} />
        </div>
      </div>
    </div>
  );
};

