import React, { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        onDismiss(toast.id);
      }, 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '380px',
        width: 'calc(100vw - 48px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isSuccess = toast.type === 'success';

        const bg = isError
          ? 'linear-gradient(135deg, rgba(30, 15, 20, 0.95) 0%, rgba(239, 68, 68, 0.2) 100%)'
          : isWarning
            ? 'linear-gradient(135deg, rgba(30, 25, 15, 0.95) 0%, rgba(245, 158, 11, 0.2) 100%)'
            : isSuccess
              ? 'linear-gradient(135deg, rgba(15, 30, 20, 0.95) 0%, rgba(16, 185, 129, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(56, 189, 248, 0.2) 100%)';

        const borderColor = isError
          ? 'rgba(239, 68, 68, 0.45)'
          : isWarning
            ? 'rgba(245, 158, 11, 0.45)'
            : isSuccess
              ? 'rgba(16, 185, 129, 0.45)'
              : 'rgba(56, 189, 248, 0.45)';

        const iconColor = isError ? '#f87171' : isWarning ? '#fbbf24' : isSuccess ? '#34d399' : '#38bdf8';

        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: bg,
              border: `1px solid ${borderColor}`,
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(12px)',
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ color: iconColor, marginTop: '0.15rem', flexShrink: 0 }}>
              {isError && <AlertCircle size={20} />}
              {isWarning && <AlertTriangle size={20} />}
              {isSuccess && <CheckCircle2 size={20} />}
              {!isError && !isWarning && !isSuccess && <Info size={20} />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.15rem' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.35' }}>{toast.message}</div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '0.2rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s ease'
              }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
