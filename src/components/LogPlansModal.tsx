import React from 'react';
import { X, Layers, CheckCircle2, Clock, Zap, ListChecks } from 'lucide-react';

import { TokenUsageLogItem, PlanItem } from '../types';
import { formatIntervalRange } from '../utils/dateUtils';



interface LogPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  logItem: TokenUsageLogItem | null;
}

export const LogPlansModal: React.FC<LogPlansModalProps> = ({ isOpen, onClose, logItem }) => {
  if (!isOpen || !logItem) return null;

  const plans: PlanItem[] = logItem.plans || [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          background: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.25))',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <ListChecks size={22} />
            </div>

            <div>
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                Session Plans — Fetch #{logItem.id}
              </h3>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Clock size={12} /> Time Window:{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {logItem.fetch_start_time && logItem.fetch_end_time
                    ? formatIntervalRange(logItem.fetch_start_time, logItem.fetch_end_time)
                    : logItem.interval_formatted}
                </strong>

              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ color: 'var(--text-dim)', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Badges Bar */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginBottom: '1.25rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.82rem',
              color: '#f8fafc',
              fontWeight: 700
            }}
          >
            <Layers size={16} style={{ color: '#38bdf8' }} />
            <span>{plans.length} Execution Plans Recorded</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8'
              }}
            >
              <Zap size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
              {logItem.formatted_delta} Tokens
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{logItem.fetched_at_formatted}</span>
          </div>
        </div>

        {/* Plans List Container */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            paddingRight: '0.25rem',
            maxHeight: '440px'
          }}
        >
          {plans.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ListChecks size={36} style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }} />
              <p>No specific plan items were recorded for this fetch interval.</p>
            </div>
          ) : (
            plans.map((plan, idx) => (
              <div
                key={plan.id || idx}
                style={{
                  padding: '1.1rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {/* Plan Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#818cf8'
                      }}
                    >
                      Plan #{idx + 1}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>{plan.title}</h4>
                  </div>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      background:
                        plan.status === 'completed' || plan.status === 'verified'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(245, 158, 11, 0.2)',
                      color: plan.status === 'completed' || plan.status === 'verified' ? '#34d399' : '#fbbf24',
                      textTransform: 'uppercase'
                    }}
                  >
                    {plan.status || 'COMPLETED'}
                  </span>
                </div>

                {/* Steps List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingLeft: '0.5rem' }}>
                  {plan.steps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        fontSize: '0.82rem',
                        color: '#cbd5e1'
                      }}
                    >
                      <CheckCircle2 size={15} style={{ color: '#34d399', marginTop: '0.1rem', flexShrink: 0 }} />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Execution plans automatically captured per token fetch interval
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-glass)',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
