import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Square,
  CheckSquare,
  Trash2,
  X,
  Edit3,
  ChevronDown,
  ChevronRight,
  Check,
  Tag
} from 'lucide-react';
import { ReleaseNoteItem, FeatureItem, AuthenticatedUser } from '../types';

import { ConfirmModal } from './ConfirmModal';
import * as api from '../services/api';

interface ReleaseNotesPageProps {
  currentUser: AuthenticatedUser | null;
}

export const ReleaseNotesPage: React.FC<ReleaseNotesPageProps> = ({ currentUser }) => {
  const [releases, setReleases] = useState<ReleaseNoteItem[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newReleaseDate, setNewReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [featureInputs, setFeatureInputs] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const [deletingRelease, setDeletingRelease] = useState<{ id: number; version: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const loadReleases = async () => {
    try {
      const res = await api.fetchReleaseNotes();
      setReleases(res.releases || []);
    } catch (err) {
      console.error('Failed to fetch release notes from backend', err);
    }
  };

  useEffect(() => {
    loadReleases();
  }, []);

  const handleAddFeatureInput = () => {
    setFeatureInputs([...featureInputs, '']);
  };

  const handleFeatureInputChange = (index: number, val: string) => {
    const updated = [...featureInputs];
    updated[index] = val;
    setFeatureInputs(updated);
  };

  const handleRemoveFeatureInput = (index: number) => {
    if (featureInputs.length === 1) return;
    setFeatureInputs(featureInputs.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.trim()) {
      alert('Please provide a version tag (e.g. v1.5.0).');
      return;
    }

    const cleanFeatures = featureInputs.map((f) => f.trim()).filter(Boolean);
    if (cleanFeatures.length === 0) {
      alert('Please add at least one feature point.');
      return;
    }

    try {
      setSubmitting(true);
      const created = await api.createReleaseNote({
        version: newVersion.trim(),
        tagline: newTagline.trim(),
        release_date: newReleaseDate,
        features: cleanFeatures
      });

      setReleases([created.release, ...releases]);
      setIsCreating(false);
      setNewVersion('');
      setNewTagline('');
      setFeatureInputs(['']);
    } catch (err: any) {
      alert(err.message || 'Failed to save release note to database.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRelease) return;
    try {
      setDeleteLoading(true);
      await api.deleteReleaseNote(deletingRelease.id);
      setReleases((prev) => prev.filter((r) => r.id !== deletingRelease.id));
      setDeletingRelease(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete release note.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateRelease = (updatedRelease: ReleaseNoteItem) => {
    setReleases((prev) => prev.map((r) => (r.id === updatedRelease.id ? updatedRelease : r)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '100%' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.4rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(99, 102, 241, 0.12) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Release Notes & Version History
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.15rem' }}>
              Platform features, incremental updates, and interactive completion checklists.
            </p>
          </div>
        </div>

        {isAdmin && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            <Plus size={17} /> New Release Note
          </button>
        )}
      </div>

      {/* Admin New Release Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="glass-panel"
          style={{
            padding: '1.5rem',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            background: 'rgba(15, 23, 42, 0.98)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Tag size={16} style={{ color: '#38bdf8' }} /> Add Release Note
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.85rem',
              marginBottom: '0.85rem'
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '0.3rem'
                }}
              >
                Version Tag *
              </label>
              <input
                type="text"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="e.g. v1.5.0"
                required
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  color: '#f8fafc',
                  fontSize: '0.82rem'
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '0.3rem'
                }}
              >
                Release Date *
              </label>
              <input
                type="date"
                value={newReleaseDate}
                onChange={(e) => setNewReleaseDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  color: '#f8fafc',
                  fontSize: '0.82rem'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '0.3rem'
              }}
            >
              Title / Tagline
            </label>
            <input
              type="text"
              value={newTagline}
              onChange={(e) => setNewTagline(e.target.value)}
              placeholder="e.g. Multi-Tenant Workspaces & Release Notes"
              style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-glass)',
                color: '#f8fafc',
                fontSize: '0.82rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '0.4rem'
              }}
            >
              List Items *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {featureInputs.map((val, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleFeatureInputChange(idx, e.target.value)}
                    placeholder={`Item #${idx + 1}`}
                    required={idx === 0}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.65rem',
                      borderRadius: '5px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-glass)',
                      color: '#f8fafc',
                      fontSize: '0.8rem'
                    }}
                  />
                  {featureInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeatureInput(idx)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '5px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddFeatureInput}
              style={{
                marginTop: '0.5rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '5px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '5px',
                background: 'transparent',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.82rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.5rem 1.1rem',
                borderRadius: '5px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.82rem'
              }}
            >
              {submitting ? 'Saving...' : 'Save Release Note'}
            </button>
          </div>
        </form>
      )}

      {/* App-Themed Keep CSS Multi-Column Masonry Grid */}
      <div
        style={{
          columns: '3 330px',
          columnGap: '1rem',
          width: '100%'
        }}
      >
        {releases.map((rel, idx) => (
          <div key={rel.id} style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
            <ThemedKeepNoteCard
              release={rel}
              cardIndex={idx}
              isAdmin={isAdmin}
              onUpdate={handleUpdateRelease}
              onDelete={() => setDeletingRelease({ id: rel.id, version: rel.version })}
            />
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingRelease}
        title="Delete Release Note"
        message={`Are you sure you want to delete release note ${deletingRelease?.version}?`}
        confirmText="Delete Release"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingRelease(null)}
      />
    </div>
  );
};

interface ThemedKeepNoteCardProps {
  release: ReleaseNoteItem;
  cardIndex: number;
  isAdmin: boolean;
  onUpdate: (updated: ReleaseNoteItem) => void;
  onDelete: () => void;
}

const getNormalizedFeatures = (featuresList: (string | FeatureItem)[]): FeatureItem[] => {
  return (featuresList || []).map((item) => {
    if (typeof item === 'object' && item !== null) {
      return { text: (item as FeatureItem).text || '', done: !!(item as FeatureItem).done };
    }
    return { text: String(item), done: false };
  });
};

const ThemedKeepNoteCard: React.FC<ThemedKeepNoteCardProps> = ({ release, cardIndex, isAdmin, onUpdate, onDelete }) => {
  const [featureItems, setFeatureItems] = useState<FeatureItem[]>(() => getNormalizedFeatures(release.features));
  const [showCompleted, setShowCompleted] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTagline, setEditTagline] = useState(release.tagline || '');
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const normalized = getNormalizedFeatures(release.features);
    setFeatureItems(normalized);
    setEditTagline(release.tagline || '');
    setEditFeatures(normalized.map((f) => f.text));
  }, [release]);

  const openItems = featureItems.map((item, idx) => ({ ...item, idx })).filter((item) => !item.done);
  const completedItems = featureItems.map((item, idx) => ({ ...item, idx })).filter((item) => item.done);
  const isAllDone = featureItems.length > 0 && completedItems.length === featureItems.length;

  const isRubyCard = !isAllDone && cardIndex % 4 === 1;

  let bgGradient = 'linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)';
  let borderStyle = '1px solid var(--border-glass)';
  let accentColor = '#818cf8';

  if (isAllDone) {
    bgGradient = 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(15, 23, 42, 0.92) 100%)';
    borderStyle = '1px solid rgba(16, 185, 129, 0.35)';
    accentColor = '#34d399';
  } else if (isRubyCard) {
    bgGradient = 'linear-gradient(135deg, rgba(225, 29, 72, 0.16) 0%, rgba(15, 23, 42, 0.92) 100%)';
    borderStyle = '1px solid rgba(225, 29, 72, 0.35)';
    accentColor = '#fb7185';
  }

  const toggleItemDone = async (targetIdx: number) => {
    const updated = featureItems.map((item, idx) => (idx === targetIdx ? { ...item, done: !item.done } : item));
    setFeatureItems(updated);

    try {
      const allDone = updated.every((item) => item.done);
      const res = await api.updateReleaseNote(release.id, {
        features: updated,
        status: allDone ? 'completed' : 'published'
      });
      onUpdate(res.release);
    } catch (err) {
      console.error('Failed to update release note feature completion in backend', err);
    }
  };

  const handleMarkAllDone = async () => {
    const updated = featureItems.map((item) => ({ ...item, done: true }));
    setFeatureItems(updated);

    try {
      const res = await api.updateReleaseNote(release.id, {
        status: 'completed',
        features: updated
      });
      onUpdate(res.release);
    } catch (err) {
      console.error('Failed to mark release note all done', err);
    }
  };

  const handleAddEditLine = () => {
    setEditFeatures([...editFeatures, '']);
  };

  const handleEditLineChange = (idx: number, val: string) => {
    const copy = [...editFeatures];
    copy[idx] = val;
    setEditFeatures(copy);
  };

  const handleRemoveEditLine = (idx: number) => {
    if (editFeatures.length === 1) return;
    setEditFeatures(editFeatures.filter((_, i) => i !== idx));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLines = editFeatures.map((f) => f.trim()).filter(Boolean);
    if (cleanLines.length === 0) {
      alert('Please keep at least one item line.');
      return;
    }

    const updated = cleanLines.map((line) => {
      const existing = featureItems.find((f) => f.text === line);
      return { text: line, done: existing ? existing.done : false };
    });

    try {
      setSaving(true);
      const res = await api.updateReleaseNote(release.id, {
        tagline: editTagline.trim(),
        features: updated
      });
      onUpdate(res.release);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update release note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.2rem 1.35rem',
        borderRadius: 'var(--radius-md)',
        background: bgGradient,
        border: borderStyle,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
        transition: 'all 0.25s ease',
        color: 'var(--text-main)'
      }}
    >
      {/* Header Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0, lineHeight: '1.35' }}>
            {release.tagline || release.version}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
            <span
              style={{
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: accentColor,
                fontSize: '0.72rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)'
              }}
            >
              {release.version}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              • {release.release_date_formatted || release.release_date}
            </span>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: '0.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
              title="Edit note"
            >
              <Edit3 size={15} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              style={{
                padding: '0.25rem',
                background: 'transparent',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
              title="Delete note"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Inline Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} style={{ marginTop: '0.25rem' }}>
          <div style={{ marginBottom: '0.65rem' }}>
            <input
              type="text"
              value={editTagline}
              onChange={(e) => setEditTagline(e.target.value)}
              placeholder="Title"
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-glass)',
                color: '#ffffff',
                fontSize: '0.82rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {editFeatures.map((line, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.35rem' }}>
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => handleEditLineChange(idx, e.target.value)}
                    required={idx === 0}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.6rem',
                      borderRadius: '5px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-glass)',
                      color: '#ffffff',
                      fontSize: '0.8rem'
                    }}
                  />
                  {editFeatures.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEditLine(idx)}
                      style={{
                        padding: '0.35rem',
                        borderRadius: '5px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddEditLine}
              style={{
                marginTop: '0.45rem',
                padding: '0.25rem 0.55rem',
                borderRadius: '5px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + List item
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                padding: '0.35rem 0.7rem',
                borderRadius: '5px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.76rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '5px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {/* Uncompleted Checklist Items */}
          {openItems.map(({ text, idx }) => (
            <div
              key={idx}
              onClick={() => toggleItemDone(idx)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <Square size={17} style={{ color: 'var(--text-dim)', marginTop: '0.1rem', flexShrink: 0 }} />
              <span style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: '1.35', wordBreak: 'break-word' }}>
                {text}
              </span>
            </div>
          ))}

          {/* Collapsible Completed Items Accordion Header */}
          {completedItems.length > 0 && (
            <div style={{ marginTop: openItems.length > 0 ? '0.35rem' : '0' }}>
              <div
                onClick={() => setShowCompleted(!showCompleted)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  paddingTop: '0.35rem',
                  borderTop: openItems.length > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {showCompleted ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                <span>{completedItems.length} completed items</span>
              </div>

              {/* Completed Checklist Items List */}
              {showCompleted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
                  {completedItems.map(({ text, idx }) => (
                    <div
                      key={idx}
                      onClick={() => toggleItemDone(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.65rem',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <CheckSquare size={17} style={{ color: '#34d399', marginTop: '0.1rem', flexShrink: 0 }} />
                      <span
                        style={{
                          fontSize: '0.84rem',
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                          lineHeight: '1.35',
                          wordBreak: 'break-word'
                        }}
                      >
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Card Footer Action */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem',
              paddingTop: '0.4rem',
              borderTop: '1px dashed rgba(255,255,255,0.08)'
            }}
          >
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>By {release.author || 'Admin'}</span>

            {!isAllDone && (
              <button
                type="button"
                onClick={handleMarkAllDone}
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: '5px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Check size={12} /> Mark all done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
