import React, { useState } from 'react';
import { X, Code, Copy, Check, Table, Cpu, Zap, FileText } from 'lucide-react';
import { PdfProcessingLogItem } from '../types';
import { formatDateTime } from '../utils/dateUtils';


interface RawDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  logItem: PdfProcessingLogItem | null;
}

export const RawDataModal: React.FC<RawDataModalProps> = ({ isOpen, onClose, logItem }) => {
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !logItem) return null;

  const rawData = logItem.raw_response_data || [];
  const jsonString = JSON.stringify(rawData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid var(--border-glass)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background:
                  logItem.extraction_mode === 'ai'
                    ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(147, 51, 234, 0.15))'
                    : 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.15))',
                border:
                  logItem.extraction_mode === 'ai'
                    ? '1px solid rgba(168, 85, 247, 0.4)'
                    : '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {logItem.extraction_mode === 'ai' ? (
                <Cpu size={20} style={{ color: '#c084fc' }} />
              ) : (
                <Zap size={20} style={{ color: '#38bdf8' }} />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{logItem.filename}</h3>
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background:
                      logItem.extraction_mode === 'ai' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    color: logItem.extraction_mode === 'ai' ? '#c084fc' : '#38bdf8',
                    border:
                      logItem.extraction_mode === 'ai'
                        ? '1px solid rgba(168, 85, 247, 0.3)'
                        : '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {logItem.extraction_mode === 'ai' ? '✨ AI Vision' : '⚡ Standard Regex'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Processed in {logItem.workspace_name} • {logItem.page_count} page(s) • {formatDateTime(logItem.created_at || logItem.created_at_formatted)}
              </p>

            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-muted)',
              borderRadius: '8px',
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

        {/* Controls & Metrics Bar */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            background: 'rgba(15, 23, 42, 0.4)',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          {/* View Toggle */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              padding: '2px'
            }}
          >
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: viewMode === 'table' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Table size={14} /> Table View ({rawData.length})
            </button>
            <button
              onClick={() => setViewMode('json')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                background: viewMode === 'json' ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                color: viewMode === 'json' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Code size={14} /> Raw JSON
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Total Tokens: <strong style={{ color: '#818cf8' }}>{logItem.total_tokens.toLocaleString()}</strong>
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Cost: <strong style={{ color: '#34d399' }}>{logItem.formatted_cost}</strong>
            </span>
            <button
              onClick={handleCopy}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: copied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)',
                color: copied ? '#34d399' : '#f8fafc',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>
          {rawData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <FileText size={32} style={{ margin: '0 auto 0.75rem auto', display: 'block', opacity: 0.5 }} />
              No raw response items recorded for this statement.
            </div>
          ) : viewMode === 'table' ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-glass)',
                      textAlign: 'left',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <th style={{ padding: '0.65rem 0.75rem' }}>#</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Title</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Category</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Date</th>
                    <th style={{ padding: '0.65rem 0.75rem' }}>Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.map((item: any, index: number) => (
                    <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td
                        style={{ padding: '0.65rem 0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}
                      >
                        {index + 1}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                        {item.title || item.name || '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}
                        >
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '0.65rem 0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: '#34d399'
                        }}
                      >
                        {item.amount ? `${Number(item.amount).toFixed(2)}` : '0.00'}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {item.expense_date || item.date || '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>{item.vendor || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <pre
              style={{
                margin: 0,
                padding: '1.25rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid var(--border-glass)',
                color: '#38bdf8',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              {jsonString}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
