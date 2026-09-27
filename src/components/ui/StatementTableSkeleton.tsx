import React from 'react';

interface StatementTableSkeletonProps {
  rows?: number;
}

export const StatementTableSkeleton: React.FC<StatementTableSkeletonProps> = ({ rows = 7 }) => {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <thead>
          <tr
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderBottom: '1px solid var(--border-glass)',
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              fontSize: '0.72rem',
              letterSpacing: '0.05em'
            }}
          >
            <th style={{ padding: '0.85rem 1rem', textAlign: 'left', width: '300px', minWidth: '300px', maxWidth: '300px', boxSizing: 'border-box' }}>
              Statement / File Name
            </th>
            <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Bank Account</th>
            <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Total Due</th>
            <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Payment</th>
            <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Line Items</th>
            <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Mail From</th>
            <th style={{ padding: '0.85rem 0.75rem', textAlign: 'left' }}>Uploaded At</th>
            <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, idx) => {
            const titleWidth = [110, 130, 95, 120, 105, 115, 125][idx % 7];
            const fileWidth = [160, 190, 140, 175, 155, 180, 165][idx % 7];
            const bankWidth = [85, 110, 75, 95, 100, 90, 80][idx % 7];
            const cardWidth = [120, 140, 105, 130, 115, 135, 110][idx % 7];
            const dueWidth = [65, 80, 55, 75, 60, 70, 65][idx % 7];
            const mailWidth = [150, 175, 135, 160, 145, 170, 155][idx % 7];
            const uploadWidth = [140, 165, 110, 150, 130, 155, 125][idx % 7];

            return (
              <tr key={`statement-skeleton-${idx}`} className="table-skeleton-row">
                {/* 1. Statement / File Name */}
                <td
                  style={{
                    padding: '0.85rem 1rem',
                    width: '300px',
                    minWidth: '300px',
                    maxWidth: '300px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                    <div
                      className="table-skeleton-block"
                      style={{ width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div
                          className="table-skeleton-block"
                          style={{ width: `${titleWidth}px`, height: '14px', borderRadius: '4px' }}
                        />
                        <div
                          className="table-skeleton-block"
                          style={{ width: '12px', height: '12px', borderRadius: '3px' }}
                        />
                      </div>
                      <div
                        className="table-skeleton-block"
                        style={{ width: `${fileWidth}px`, height: '10px', borderRadius: '3px', opacity: 0.7 }}
                      />
                    </div>
                  </div>
                </td>

                {/* 2. Bank Account */}
                <td style={{ padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div
                        className="table-skeleton-block"
                        style={{ width: '14px', height: '14px', borderRadius: '3px' }}
                      />
                      <div
                        className="table-skeleton-block"
                        style={{ width: `${bankWidth}px`, height: '14px', borderRadius: '4px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <div
                        className="table-skeleton-block"
                        style={{ width: '12px', height: '12px', borderRadius: '2px', opacity: 0.6 }}
                      />
                      <div
                        className="table-skeleton-block"
                        style={{ width: `${cardWidth}px`, height: '10px', borderRadius: '3px', opacity: 0.7 }}
                      />
                    </div>
                  </div>
                </td>

                {/* 3. Total Due */}
                <td style={{ padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      className="table-skeleton-block"
                      style={{
                        width: `${dueWidth}px`,
                        height: '16px',
                        borderRadius: '4px',
                        background: 'linear-gradient(90deg, rgba(52, 211, 153, 0.08) 0%, rgba(52, 211, 153, 0.18) 50%, rgba(52, 211, 153, 0.08) 100%)'
                      }}
                    />
                    <div
                      className="table-skeleton-block"
                      style={{ width: '68px', height: '10px', borderRadius: '3px', opacity: 0.6 }}
                    />
                  </div>
                </td>

                {/* 4. Payment */}
                <td style={{ padding: '0.85rem 0.75rem' }}>
                  <div
                    className="table-skeleton-block table-skeleton-pill"
                    style={{ width: '74px', height: '22px' }}
                  />
                </td>

                {/* 5. Line Items */}
                <td style={{ padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div
                      className="table-skeleton-block"
                      style={{ width: '65px', height: '13px', borderRadius: '4px' }}
                    />
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <div
                        className="table-skeleton-block"
                        style={{ width: '42px', height: '9px', borderRadius: '2px', opacity: 0.7 }}
                      />
                      <div
                        className="table-skeleton-block"
                        style={{ width: '42px', height: '9px', borderRadius: '2px', opacity: 0.7 }}
                      />
                    </div>
                  </div>
                </td>

                {/* 6. Mail From */}
                <td style={{ padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <div
                        className="table-skeleton-block"
                        style={{ width: '12px', height: '12px', borderRadius: '2px' }}
                      />
                      <div
                        className="table-skeleton-block"
                        style={{ width: `${mailWidth}px`, height: '12px', borderRadius: '3px' }}
                      />
                    </div>
                    <div
                      className="table-skeleton-block table-skeleton-pill"
                      style={{ width: '54px', height: '18px' }}
                    />
                  </div>
                </td>

                {/* 7. Uploaded At */}
                <td style={{ padding: '0.85rem 0.75rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <div
                        className="table-skeleton-block"
                        style={{ width: '12px', height: '12px', borderRadius: '2px' }}
                      />
                      <div
                        className="table-skeleton-block"
                        style={{ width: `${uploadWidth}px`, height: '12px', borderRadius: '3px' }}
                      />
                    </div>
                    <div
                      className="table-skeleton-block"
                      style={{ width: '85px', height: '10px', borderRadius: '3px', opacity: 0.6 }}
                    />
                  </div>
                </td>

                {/* 8. Actions */}
                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'center' }}>
                    <div
                      className="table-skeleton-block"
                      style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                    />
                    <div
                      className="table-skeleton-block"
                      style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                    />
                    <div
                      className="table-skeleton-block"
                      style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                    />
                    <div
                      className="table-skeleton-block"
                      style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                    />
                    <div
                      className="table-skeleton-block"
                      style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                    />
                    <div
                      className="table-skeleton-block"
                      style={{ width: '24px', height: '24px', borderRadius: '6px' }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

