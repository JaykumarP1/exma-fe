import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PdfDocumentViewerProps {
  pdfUrl?: string | null;
  filename: string;
  isPdf: boolean;
  password?: string;
}

export const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({ pdfUrl, filename, isPdf, password }) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const isPdfFile = isPdf || filename.toLowerCase().endsWith('.pdf');

  const fullPdfUrl = pdfUrl
    ? (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://') || pdfUrl.startsWith('blob:') || pdfUrl.startsWith('data:')
        ? pdfUrl
        : `http://localhost:4000${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`)
    : null;


  // Load PDF Document
  useEffect(() => {
    if (!isPdfFile || !fullPdfUrl) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setPdfDoc(null);

    const loadingTask = pdfjsLib.getDocument({
      url: fullPdfUrl,
      password: password || undefined,
      withCredentials: false
    });


    loadingTask.promise
      .then((doc) => {
        if (!isMounted) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('PDF.js document load error:', err);
        setError(err.message || 'Failed to load PDF document.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
      loadingTask.destroy().catch(() => {});
    };
  }, [fullPdfUrl, isPdfFile, password]);



  // Render current page onto HTML5 canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    pdfDoc.getPage(currentPage).then((page) => {
      if (isCancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const scale = (zoom / 100) * 1.35;
      const viewport = page.getViewport({ scale, rotation });

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;

      task.promise.catch((err) => {
        if (err.name !== 'RenderingCancelledException') {
          console.error('PDF page render error:', err);
        }
      });
    });

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, zoom, rotation]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, numPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

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
              maxWidth: '180px'
            }}
          >
            {filename}
          </span>
        </div>

        {/* Page Navigation & Zoom Controls */}
        {isPdf && fullPdfUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Page Selector */}
            {numPages > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  style={{
                    padding: '0.25rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-main)',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: '0.78rem', color: '#f8fafc', fontWeight: 600, padding: '0 0.2rem' }}>
                  {currentPage} / {numPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= numPages}
                  style={{
                    padding: '0.25rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-main)',
                    cursor: currentPage >= numPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Next Page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            <div style={{ width: '1px', height: '16px', background: 'var(--border-glass)', margin: '0 0.1rem' }} />

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
              title="Reset Zoom (100%)"
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

            <div style={{ width: '1px', height: '16px', background: 'var(--border-glass)', margin: '0 0.1rem' }} />

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

      {/* Main PDF Canvas Display Body */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '1.5rem',
          background: '#090d16'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: '#38bdf8', marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>Rendering PDF Canvas...</div>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
            <AlertCircle size={40} style={{ color: '#ef4444', marginBottom: '0.75rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>{error}</div>
            {fullPdfUrl && (
              <a
                href={fullPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <ExternalLink size={14} style={{ marginRight: '0.4rem' }} /> Open PDF Externally
              </a>
            )}
          </div>
        ) : isPdfFile && fullPdfUrl ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: '#ffffff'
            }}
          >
            <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '2rem'
            }}
          >
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              {isPdfFile ? 'PDF Preview File Unattached' : 'Spreadsheet / Document View'}
            </div>
            <p style={{ fontSize: '0.85rem', maxWidth: '340px', marginTop: '0.4rem' }}>
              {isPdfFile
                ? 'The PDF file is unattached or preview URL is missing. Upload or attach the statement file to render PDF pages.'
                : 'Excel and CSV files do not require PDF canvas rendering. Review line items in the table on the left.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
