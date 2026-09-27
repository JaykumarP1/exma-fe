import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Tag,
  X,
  Plus,
  Save,
  Building2,
  Check,
  AlertCircle
} from 'lucide-react';
import { Project } from '../types';
import { PRESET_BANK_TAGS, getTagColor, parseBankTags } from '../utils/tagColors';

interface ManageBankTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: Project | null;
  onSave: (bankId: number, tags: string[]) => Promise<void>;
}

export const ManageBankTagsModal: React.FC<ManageBankTagsModalProps> = ({
  isOpen,
  onClose,
  bank,
  onSave
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && bank) {
      setTags(parseBankTags(bank.tags, bank.category));
      setCustomTagInput('');
      setError(null);
    }
  }, [isOpen, bank]);

  if (!isOpen || !bank) return null;

  const togglePresetTag = (preset: string) => {
    setTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === preset.toLowerCase());
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== preset.toLowerCase());
      } else {
        return [...prev, preset];
      }
    });
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customTagInput.trim();
    if (!clean) return;

    if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setCustomTagInput('');
      return;
    }

    setTags((prev) => [...prev, clean]);
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const finalTags = tags.length > 0 ? tags : ['Banking'];
      await onSave(bank.id, finalTags);
      onClose();
    } catch (err: any) {
      console.error('Failed to update bank tags', err);
      setError(err?.message || 'Failed to update bank tags.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="modal-backdrop"
      style={{ zIndex: 1100 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: '480px', width: '92%' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}
            >
              <Tag size={19} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Manage Bank Tags
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                <Building2 size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {bank.title}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Active Tags */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '0.45rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Assigned Tags ({tags.length})
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.45rem',
                minHeight: '40px',
                padding: '0.55rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-glass)',
                alignItems: 'center'
              }}
            >
              {tags.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  No tags selected (defaults to Banking)
                </span>
              ) : (
                tags.map((tag) => {
                  const style = getTagColor(tag);
                  return (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: style.bg,
                        color: style.text,
                        border: `1px solid ${style.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: style.text,
                          opacity: 0.75,
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title={`Remove ${tag}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Preset Tags Selection */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '0.45rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Popular Options (Click to Toggle)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {PRESET_BANK_TAGS.map((preset) => {
                const isSelected = tags.some((t) => t.toLowerCase() === preset.toLowerCase());
                const color = getTagColor(preset);

                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => togglePresetTag(preset)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                      background: isSelected ? color.bg : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? color.text : 'var(--text-muted)',
                      border: isSelected
                        ? `1px solid ${color.border}`
                        : '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {isSelected ? <Check size={12} /> : <Plus size={11} style={{ opacity: 0.6 }} />}
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Custom Tag */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '0.35rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Add Custom Tag
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="e.g. Fixed Deposit, Forex, Demat..."
                style={{
                  flex: 1,
                  padding: '0.55rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => handleAddCustomTag()}
                disabled={!customTagInput.trim()}
                style={{
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: customTagInput.trim() ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${customTagInput.trim() ? 'rgba(56, 189, 248, 0.35)' : 'var(--border-glass)'}`,
                  color: customTagInput.trim() ? 'var(--accent-primary)' : 'var(--text-dim)',
                  cursor: customTagInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.65rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary)',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Save size={15} />
              {loading ? 'Saving...' : 'Save Tags'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

