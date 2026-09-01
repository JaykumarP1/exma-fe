import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, ExternalLink, FileText } from 'lucide-react';

interface PdfDocumentViewerProps {
  pdfUrl?: string | null;
  filename: string;
  isPdf: boolean;
}

export const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({ pdfUrl, filename, isPdf }) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const fullPdfUrl = pdfUrl ? (pdfUrl.startsWith('http') ? pdfUrl : pdfUrl) : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0f172a',
        overflow: 'hidden',
        borderLeft: '1px solid var(--border-glass)'
      }}
    >
      {/* Top Controls Toolbar */}
      <div
        style={{
          padding: '0.6rem 1rem',
          background: 'rgba(30, 41, 59, 0.85)',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={16} style={{ color: '#38bdf8' }} />
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#f8fafc',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              maxWidth: '200px'
            }}
          >
            {filename}
          </span>
        </div>

        {/* Control Buttons */}
        {isPdf && fullPdfUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                cursor: zoom <= 50 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Zoom Out (-25%)"
            >
              <ZoomOut size={14} />
            </button>

            {/* Zoom Badge */}
            <span
              onClick={handleResetZoom}
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#38bdf8',
                padding: '0.2rem 0.5rem',
                background: 'rgba(56, 189, 248, 0.12)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              title="Click to Reset Zoom (100%)"
            >
              {zoom}%
            </span>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 250}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                cursor: zoom >= 250 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Zoom In (+25%)"
            >
              <ZoomIn size={14} />
            </button>

            <div style={{ width: '1px', height: '16px', background: 'var(--border-glass)', margin: '0 0.2rem' }} />

            {/* Rotate */}
            <button
              onClick={handleRotate}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Rotate 90° Clockwise"
            >
              <RotateCw size={14} />
            </button>

            {/* Fit Width */}
            <button
              onClick={handleResetZoom}
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Fit Width"
            >
              <Maximize2 size={14} />
            </button>

            {/* External Open */}
            <a
              href={fullPdfUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '0.35rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#818cf8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Open PDF in New Browser Tab"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>

      {/* Main Document Display Body */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1rem',
          background: '#090d16'
        }}
      >
        {isPdf && fullPdfUrl ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-out'
            }}
          >
            <object
              data={fullPdfUrl}
              type="application/pdf"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--border-glass)',
                background: '#1e293b'
              }}
            >
              <embed src={fullPdfUrl} type="application/pdf" style={{ width: '100%', height: '100%' }} />
            </object>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '2rem'
            }}
          >
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              {isPdf ? 'PDF Preview Loading...' : 'Spreadsheet Document Preview'}
            </div>
            <p style={{ fontSize: '0.85rem', maxWidth: '340px', marginTop: '0.4rem' }}>
              {isPdf
                ? 'Native PDF Viewer is loading pages.'
                : 'Excel and CSV files do not require PDF rendering. Review extracted line items in the table on the left.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
