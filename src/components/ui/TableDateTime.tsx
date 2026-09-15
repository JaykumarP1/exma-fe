import React from 'react';
import { formatDateDDMonYY, formatTimeHHMM, formatDateTime } from '../../utils/dateUtils';

export interface TableDateTimeProps {
  date: string | number | Date | null | undefined;
  icon?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  style?: React.CSSProperties;
  showTime?: boolean;
}

/**
 * Reusable table cell component for rendering timestamps/dates:
 * - Line 1: DD Mon YY (e.g. "06 Sep 26")
 * - Line 2: HH:MM (e.g. "14:35") below the date (if showTime is true and time exists)
 */
export const TableDateTime: React.FC<TableDateTimeProps> = ({
  date,
  icon,
  align = 'left',
  className = '',
  style,
  showTime = true
}) => {
  if (!date) {
    return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  }

  const dateStr = formatDateDDMonYY(date);
  const timeStr = showTime ? formatTimeHHMM(date) : '';
  const fullTooltip = formatDateTime(date);

  return (
    <div
      className={className}
      title={fullTooltip}
      style={{
        display: 'inline-flex',
        alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        flexDirection: 'column',
        gap: '0.15rem',
        lineHeight: 1.25,
        textAlign: align,
        ...style
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
        {icon}
        <span
          style={{
            color: '#f8fafc',
            fontWeight: 600,
            fontSize: '0.82rem',
            whiteSpace: 'nowrap'
          }}
        >
          {dateStr}
        </span>
      </div>
      {timeStr ? (
        <span
          style={{
            color: 'var(--text-dim)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.02em',
            paddingLeft: icon ? '1.15rem' : '0',
            whiteSpace: 'nowrap'
          }}
        >
          {timeStr}
        </span>
      ) : null}
    </div>
  );
};

export default TableDateTime;

