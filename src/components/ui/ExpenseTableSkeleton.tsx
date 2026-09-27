import React from 'react';

interface ExpenseTableSkeletonProps {
  rows?: number;
}

export const ExpenseTableSkeleton: React.FC<ExpenseTableSkeletonProps> = ({ rows = 6 }) => {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)' }}>
            <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Date</th>
            <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Description / Title</th>
            <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Category</th>
            <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Bank & Card</th>
            <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600 }}>Vendor / Payee</th>
            <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600, textAlign: 'right' }}>Amount</th>
            <th style={{ padding: '0.75rem 0.75rem', fontWeight: 600, textAlign: 'center' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, idx) => (
            <tr key={`expense-skeleton-${idx}`} className="table-skeleton-row">
              {/* Date */}
              <td style={{ padding: '0.75rem 0.75rem' }}>
                <div className="table-skeleton-block" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
              </td>

              {/* Description */}
              <td style={{ padding: '0.75rem 0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div className="table-skeleton-block" style={{ width: `${140 + (idx % 3) * 35}px`, height: '14px', borderRadius: '4px' }} />
                  <div className="table-skeleton-block" style={{ width: '90px', height: '10px', borderRadius: '3px', opacity: 0.6 }} />
                </div>
              </td>

              {/* Category */}
              <td style={{ padding: '0.75rem 0.75rem' }}>
                <div className="table-skeleton-block table-skeleton-pill" style={{ width: '70px', height: '22px' }} />
              </td>

              {/* Bank */}
              <td style={{ padding: '0.75rem 0.75rem' }}>
                <div className="table-skeleton-block" style={{ width: '85px', height: '14px', borderRadius: '4px' }} />
              </td>

              {/* Vendor */}
              <td style={{ padding: '0.75rem 0.75rem' }}>
                <div className="table-skeleton-block" style={{ width: '100px', height: '14px', borderRadius: '4px' }} />
              </td>

              {/* Amount */}
              <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right' }}>
                <div className="table-skeleton-block" style={{ width: '65px', height: '15px', borderRadius: '4px' }} />
              </td>

              {/* Action */}
              <td style={{ padding: '0.75rem 0.75rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'center' }}>
                  <div className="table-skeleton-block" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
                  <div className="table-skeleton-block" style={{ width: '24px', height: '24px', borderRadius: '6px' }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

