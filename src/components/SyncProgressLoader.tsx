import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Sparkles, FileText, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface SyncProgressLoaderProps {
  email?: string;
  host?: string;
  limit?: number | string;
  overlay?: boolean; // If true, positioned absolute over a card (inset: 0)
}

const SYNC_STEPS = [
  { text: 'Connecting securely to IMAP host...', icon: ShieldCheck, color: '#38bdf8' },
  { text: 'Scanning inbox for bank & card statements...', icon: Mail, color: '#818cf8' },
  { text: 'Fetching PDF & Excel statement attachments...', icon: FileText, color: '#c084fc' },
  { text: 'Applying decryption passwords & AI extraction...', icon: Sparkles, color: '#34d399' },
  { text: 'Finalizing expenses & recording statements...', icon: CheckCircle2, color: '#10b981' }
];

export const SyncProgressLoader: React.FC<SyncProgressLoaderProps> = ({
  email,
  host,
  limit,
  overlay = true
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % SYNC_STEPS.length);
    }, 2200);

    return () => clearInterval(timer);
  }, []);

  const currentStep = SYNC_STEPS[stepIndex];
  const StepIcon = currentStep.icon;

  const containerStyle: React.CSSProperties = overlay
    ? {
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        borderRadius: 'inherit',
        background: 'radial-gradient(circle at 50% 30%, rgba(15, 23, 42, 0.96) 0%, rgba(9, 13, 22, 0.98) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 0 30px rgba(56, 189, 248, 0.15)',
        animation: 'fadeIn 0.25s ease'
      }
    : {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        borderRadius: 'var(--radius-sm)',
        background: 'radial-gradient(circle at 50% 30%, rgba(15, 23, 42, 0.96) 0%, rgba(9, 13, 22, 0.98) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 0 30px rgba(56, 189, 248, 0.15)'
      };

  return (
    <div style={containerStyle}>
      {/* Central Animated Radar / Orbital Sync Rig */}
      <div
        style={{
          position: 'relative',
          width: '84px',
          height: '84px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}
      >
        {/* Outer Orbiting Glow Ring */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px dashed rgba(56, 189, 248, 0.4)',
            animation: 'syncOrbit 10s linear infinite'
          }}
        />

        {/* Inner Counter-Orbiting Gradient Ring */}
        <div
          style={{
            position: 'absolute',
            inset: '6px',
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: '#38bdf8',
            borderRightColor: '#10b981',
            borderBottomColor: '#818cf8',
            animation: 'syncOrbitReverse 2.5s linear infinite'
          }}
        />

        {/* Center Glowing Core */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(16, 185, 129, 0.25) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            boxShadow: '0 0 24px rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'syncPulseGlow 2.5s ease-in-out infinite'
          }}
        >
          <RefreshCw size={24} style={{ color: '#38bdf8', animation: 'syncOrbit 2s linear infinite' }} />
        </div>

        {/* Floating Satellite Indicator */}
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 12px #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            animation: 'syncFloat 2s ease-in-out infinite'
          }}
        >
          <StepIcon size={11} />
        </div>
      </div>

      {/* Sync Title & Details */}
      <div style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}
          />
          <h4
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}
          >
            Syncing Statements...
          </h4>
        </div>

        {email && (
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.65rem' }}>
            Account: <strong style={{ color: '#f8fafc' }}>{email}</strong>
            {host ? <span style={{ opacity: 0.7 }}> ({host})</span> : null}
            {limit ? <span style={{ color: '#38bdf8' }}> • limit {limit}</span> : null}
          </div>
        )}

        {/* Animated Step Tracker */}
        <div
          style={{
            minHeight: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '0.85rem'
          }}
        >
          <StepIcon size={13} style={{ color: currentStep.color }} />
          <span
            key={stepIndex}
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: '#e2e8f0',
              animation: 'fadeIn 0.3s ease'
            }}
          >
            {currentStep.text}
          </span>
        </div>

        {/* Continuous Laser Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '0.65rem'
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '45%',
              height: '100%',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, transparent, #38bdf8, #10b981, transparent)',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.6)',
              animation: 'syncShimmerBeam 1.8s ease-in-out infinite'
            }}
          />
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
          Please keep this window open while statements are being discovered & processed.
        </div>
      </div>
    </div>
  );
};

export default SyncProgressLoader;

