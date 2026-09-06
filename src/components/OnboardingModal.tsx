import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Globe,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';
import { AuthenticatedUser, Workspace, CurrencyOption } from '../types';
import { completeOnboarding } from '../services/api';
import { CHARACTER_AVATARS, CharacterAvatar } from '../utils/characterAvatars';

interface OnboardingModalProps {
  isOpen: boolean;
  user: AuthenticatedUser;
  currentWorkspace?: Workspace | null;
  onComplete: (updatedUser: AuthenticatedUser, updatedWorkspace?: Workspace) => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
}

const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'United States Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  user,
  currentWorkspace,
  onComplete,
  onShowToast
}) => {
  if (!isOpen) return null;

  // Derive reasonable initial defaults
  const defaultDisplayName = user.name || user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const defaultWsName = currentWorkspace?.name || `${defaultDisplayName}'s Workspace`;

  const [name, setName] = useState<string>(defaultDisplayName);
  const [selectedAvatar, setSelectedAvatar] = useState<CharacterAvatar>(
    CHARACTER_AVATARS.find((a) => a.avatarUrl === user.avatar_url) || CHARACTER_AVATARS[0]
  );
  const [currency, setCurrency] = useState<string>(user.currency || currentWorkspace?.currency || 'USD');
  const [workspaceName, setWorkspaceName] = useState<string>(defaultWsName);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (isSkip = false) => {
    try {
      setLoading(true);
      const chosenName = isSkip ? (name || defaultDisplayName) : (name.trim() || defaultDisplayName);
      const chosenWsName = isSkip ? (workspaceName || defaultWsName) : (workspaceName.trim() || `${chosenName}'s Workspace`);
      const chosenAvatarUrl = selectedAvatar.avatarUrl;
      const chosenCurrency = currency || 'USD';

      const res = await completeOnboarding({
        user: {
          name: chosenName,
          avatar_url: chosenAvatarUrl,
          currency: chosenCurrency
        },
        workspace: {
          name: chosenWsName,
          currency: chosenCurrency
        }
      });

      onShowToast(
        isSkip
          ? 'Onboarding skipped. You can update your profile anytime in Settings.'
          : `Welcome to Exma, ${chosenName}! Your workspace is ready.`,
        'success'
      );

      onComplete(res.user, res.workspace);
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      onShowToast(err.message || 'Failed to complete setup. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-card"
        style={{
          width: '100%',
          maxWidth: '680px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(9, 13, 22, 0.98) 100%)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.25))',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Welcome to Exma!
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Let's customize your profile and initialize your primary workspace.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
              transition: 'color 0.2s ease'
            }}
            title="Skip for now"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          {/* Section 1: Choose Character Avatar */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#f8fafc',
                marginBottom: '0.65rem'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <User size={15} style={{ color: '#38bdf8' }} /> Choose Your Character Avatar
              </span>
              <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>
                {selectedAvatar.name} • {selectedAvatar.badge}
              </span>
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '0.75rem'
              }}
            >
              {CHARACTER_AVATARS.map((avatar) => {
                const isSelected = selectedAvatar.id === avatar.id;
                return (
                  <div
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(99, 102, 241, 0.15) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '2px solid #38bdf8' : '1px solid var(--border-glass)',
                      boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.35)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <img
                      src={avatar.avatarUrl}
                      alt={avatar.name}
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                      }}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                        {avatar.name}
                      </div>
                      <div style={{ fontSize: '0.64rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {avatar.badge}
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          color: '#38bdf8'
                        }}
                      >
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Full Name & Workspace Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Full Name */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  marginBottom: '0.45rem'
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!workspaceName || workspaceName === `${name}'s Workspace`) {
                    setWorkspaceName(`${e.target.value}'s Workspace`);
                  }
                }}
                placeholder="e.g. Alex Morgan"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Workspace Name */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  marginBottom: '0.45rem'
                }}
              >
                Initial Workspace Name
              </label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. Personal Finances"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: '#f8fafc',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Section 3: Base Accounting Currency (3 in a row matching settings) */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#f8fafc',
                marginBottom: '0.5rem'
              }}
            >
              <Globe size={15} style={{ color: '#38bdf8' }} />
              Preferred Base Currency
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: '0.6rem'
              }}
            >
              {SUPPORTED_CURRENCIES.map((curr) => {
                const isSelected = currency === curr.code;
                return (
                  <div
                    key={curr.code}
                    onClick={() => setCurrency(curr.code)}
                    style={{
                      padding: '0.65rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.12) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-glass)',
                      boxShadow: isSelected ? '0 2px 10px rgba(56, 189, 248, 0.2)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: isSelected ? '#38bdf8' : '#f8fafc',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {curr.symbol}
                      </span>
                      {isSelected && <CheckCircle2 size={14} style={{ color: '#38bdf8' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{curr.code}</div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {curr.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-glass)',
            paddingTop: '1.25rem',
            marginTop: '0.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              transition: 'color 0.2s ease'
            }}
          >
            Skip for now
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading}
            style={{
              padding: '0.7rem 1.4rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Setting up...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
