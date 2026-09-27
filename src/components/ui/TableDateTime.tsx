import React from 'react';
import { formatDateDDMonYY, formatTimeHHMM, formatDateTime } from '../../utils/dateUtils';

export interface TableDateTimeProps {
  date: string | number | Date | null | undefined;
  icon?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  style?: React.CSSProperties;
  showTime?: boolean;
  inline?: boolean;
}

/**
 * Reusable table cell component for rendering timestamps/dates:
 * - Line 1: DD Mon YY (e.g. "06 Sep 26")
 * - Line 2: HH:MM (e.g. "14:35") below the date (if showTime is true and time exists)
 * - If inline is true: renders date and time together on a single line (e.g. "06 Sep 26, 14:35")
 */
export const TableDateTime: React.FC<TableDateTimeProps> = ({
  date,
  icon,
  align = 'left',
  className = '',
  style,
  showTime = true,
  inline = false
}) => {
  if (!date) {
    return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  }

  const dateStr = formatDateDDMonYY(date);
  const timeStr = showTime ? formatTimeHHMM(date) : '';
  const fullTooltip = formatDateTime(date);

  if (inline) {
    return (
      <div
        className={className}
        title={fullTooltip}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          whiteSpace: 'nowrap',
          lineHeight: 1.25,
          ...style
        }}
      >
        {icon}
        <span
          style={{
            color: 'var(--text-dim)',
            fontWeight: 500,
            fontSize: '0.74rem',
            whiteSpace: 'nowrap'
          }}
        >
          {dateStr}
          {timeStr ? `, ${timeStr}` : ''}
        </span>
      </div>
    );
  }

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

