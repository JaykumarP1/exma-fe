import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  variant?: 'indigo' | 'purple';
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  variant = 'indigo',
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate smart page numbers array with ellipses
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const activeBg = variant === 'purple' ? '#818cf8' : '#6366f1';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0.85rem 1.25rem',
        borderTop: '1px solid var(--border-glass)',
        background: 'rgba(255, 255, 255, 0.02)',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        userSelect: 'none'
      }}
    >
      {/* Left: Range Info & Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span>
          Showing <strong style={{ color: '#f8fafc' }}>{startItem}</strong> to{' '}
          <strong style={{ color: '#f8fafc' }}>{endItem}</strong> of{' '}
          <strong style={{ color: '#f8fafc' }}>{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <>
            <span style={{ color: 'var(--border-glass)' }}>|</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                style={{
                  background: '#1e293b',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '6px',
                  padding: '0.2rem 0.5rem',
                  color: '#f8fafc',
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            style={{
              padding: '0.35rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: currentPage === 1 ? 'var(--text-dim)' : '#f8fafc',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.4 : 1,
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '0.35rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: currentPage === 1 ? 'var(--text-dim)' : '#f8fafc',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.4 : 1,
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, idx) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} style={{ padding: '0 0.3rem', color: 'var(--text-dim)' }}>
                  •••
                </span>
              );
            }
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                style={{
                  minWidth: '28px',
                  height: '28px',
                  padding: '0 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: page === currentPage ? activeBg : 'rgba(255, 255, 255, 0.05)',
                  border: page === currentPage ? `1px solid ${activeBg}` : '1px solid var(--border-glass)',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            );
          })}

          {/* Next Page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.35rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: currentPage === totalPages ? 'var(--text-dim)' : '#f8fafc',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.4 : 1,
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.35rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: currentPage === totalPages ? 'var(--text-dim)' : '#f8fafc',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.4 : 1,
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
