import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Square, CheckSquare, Trash2, X, Edit3, ChevronDown, ChevronRight, Check, Tag } from 'lucide-react';

import { ReleaseNoteItem, AuthenticatedUser } from '../types';
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
      <div style={{
        padding: '1.25rem 1.5rem',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#202124',
        border: '1px solid #3c4043'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(138, 180, 248, 0.15)',
            border: '1px solid rgba(138, 180, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8ab4f8'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#e8eaed', letterSpacing: '-0.01em' }}>
              Release Notes & Version History
            </h1>
            <p style={{ color: '#9aa0a6', fontSize: '0.84rem', marginTop: '0.15rem' }}>
              Google Keep notes layout for platform feature updates and task completion.
            </p>
          </div>
        </div>

        {isAdmin && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '6px',
              background: '#8ab4f8',
              border: 'none',
              color: '#202124',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Plus size={17} /> New Note
          </button>
        )}
      </div>

      {/* Admin New Release Form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} style={{ padding: '1.4rem', borderRadius: '8px', border: '1px solid #8ab4f8', background: '#202124' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#e8eaed', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Tag size={16} style={{ color: '#8ab4f8' }} /> Add Release Note
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{ background: 'transparent', border: 'none', color: '#9aa0a6', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9aa0a6', marginBottom: '0.3rem' }}>Version Tag *</label>
              <input
                type="text"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="e.g. v1.5.0"
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: '#303134', border: '1px solid #5f6368', color: '#e8eaed', fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9aa0a6', marginBottom: '0.3rem' }}>Release Date *</label>
              <input
                type="date"
                value={newReleaseDate}
                onChange={(e) => setNewReleaseDate(e.target.value)}
                required
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: '#303134', border: '1px solid #5f6368', color: '#e8eaed', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9aa0a6', marginBottom: '0.3rem' }}>Title / Headline</label>
            <input
              type="text"
              value={newTagline}
              onChange={(e) => setNewTagline(e.target.value)}
              placeholder="e.g. Multi-Tenant Workspaces & Release Notes"
              style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: '#303134', border: '1px solid #5f6368', color: '#e8eaed', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9aa0a6', marginBottom: '0.4rem' }}>List Items *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {featureInputs.map((val, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleFeatureInputChange(idx, e.target.value)}
                    placeholder={`Item #${idx + 1}`}
                    required={idx === 0}
                    style={{ flex: 1, padding: '0.5rem 0.65rem', borderRadius: '5px', background: '#303134', border: '1px solid #5f6368', color: '#e8eaed', fontSize: '0.8rem' }}
                  />
                  {featureInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeatureInput(idx)}
                      style={{ padding: '0.5rem', borderRadius: '5px', background: 'rgba(242, 139, 130, 0.15)', border: '1px solid rgba(242, 139, 130, 0.3)', color: '#f28b82', cursor: 'pointer' }}
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
              style={{ marginTop: '0.5rem', padding: '0.35rem 0.65rem', borderRadius: '5px', background: '#303134', border: '1px solid #5f6368', color: '#8ab4f8', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{ padding: '0.5rem 0.95rem', borderRadius: '5px', background: 'transparent', border: '1px solid #5f6368', color: '#9aa0a6', cursor: 'pointer', fontSize: '0.82rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '0.5rem 1.1rem', borderRadius: '5px', background: '#8ab4f8', border: 'none', color: '#202124', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
            >
              {submitting ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      )}

      {/* Google Keep CSS Multi-Column Masonry Grid */}
      <div style={{
        columns: '3 320px',
        columnGap: '0.9rem',
        width: '100%'
      }}>
        {releases.map((rel, idx) => (
          <div key={rel.id} style={{ breakInside: 'avoid', marginBottom: '0.9rem' }}>
            <KeepReleaseNoteCard
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
        message={`Are you sure you want to delete note ${deletingRelease?.version}?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingRelease(null)}
      />

    </div>
  );
};

interface KeepReleaseNoteCardProps {
  release: ReleaseNoteItem;
  cardIndex: number;
  isAdmin: boolean;
  onUpdate: (updated: ReleaseNoteItem) => void;
  onDelete: () => void;
}

const KeepReleaseNoteCard: React.FC<KeepReleaseNoteCardProps> = ({
  release,
  cardIndex,
  isAdmin,
  onUpdate,
  onDelete
}) => {
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});
  const [showCompleted, setShowCompleted] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTagline, setEditTagline] = useState(release.tagline || '');
  const [editFeatures, setEditFeatures] = useState<string[]>(release.features || []);
  const [saving, setSaving] = useState(false);

  // Pick Google Keep background color variant (charcoal #202124 or dark crimson #5c1d24)
  const isAccentCard = cardIndex % 4 === 1;
  const bgColor = isAccentCard ? '#5c1d24' : '#202124';
  const borderColor = isAccentCard ? 'rgba(242, 139, 130, 0.3)' : '#3c4043';

  const totalFeatures = release.features || [];
  const openFeaturesIndices = totalFeatures.map((_, i) => i).filter((i) => !completedItems[i]);
  const completedFeaturesIndices = totalFeatures.map((_, i) => i).filter((i) => completedItems[i]);

  const toggleItemDone = (idx: number) => {
    setCompletedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const isAllDone = totalFeatures.length > 0 && completedFeaturesIndices.length === totalFeatures.length;

  const handleMarkAllDone = async () => {
    const allDoneState: Record<number, boolean> = {};
    totalFeatures.forEach((_, idx) => {
      allDoneState[idx] = true;
    });
    setCompletedItems(allDoneState);

    if (isAdmin) {
      try {
        const res = await api.updateReleaseNote(release.id, { status: 'completed' });
        onUpdate(res.release);
      } catch (err) {
        console.error('Failed to update release status', err);
      }
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
    const clean = editFeatures.map((f) => f.trim()).filter(Boolean);
    if (clean.length === 0) {
      alert('Please keep at least one item line.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.updateReleaseNote(release.id, {
        tagline: editTagline.trim(),
        features: clean
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
    <div style={{
      padding: '1.1rem 1.25rem',
      borderRadius: '8px',
      background: bgColor,
      border: `1px solid ${borderColor}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      transition: 'all 0.2s ease',
      color: '#e8eaed'
    }}>

      {/* Header Title & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: '1.3' }}>
            {release.tagline || release.version}
          </h2>
          {release.tagline && (
            <span style={{ fontSize: '0.74rem', color: '#9aa0a6', fontWeight: 600, marginTop: '0.15rem', display: 'inline-block' }}>
              {release.version} • {release.release_date_formatted || release.release_date}
            </span>
          )}
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              style={{ padding: '0.25rem', background: 'transparent', border: 'none', color: '#9aa0a6', cursor: 'pointer', borderRadius: '4px' }}
              title="Edit note"
            >
              <Edit3 size={15} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              style={{ padding: '0.25rem', background: 'transparent', border: 'none', color: '#f28b82', cursor: 'pointer', borderRadius: '4px' }}
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
          <div style={{ marginBottom: '0.6rem' }}>
            <input
              type="text"
              value={editTagline}
              onChange={(e) => setEditTagline(e.target.value)}
              placeholder="Title"
              style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '5px', background: '#303134', border: '1px solid #5f6368', color: '#ffffff', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ marginBottom: '0.6rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {editFeatures.map((line, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.3rem' }}>
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => handleEditLineChange(idx, e.target.value)}
                    required={idx === 0}
                    style={{ flex: 1, padding: '0.4rem 0.55rem', borderRadius: '4px', background: '#303134', border: '1px solid #5f6368', color: '#ffffff', fontSize: '0.8rem' }}
                  />
                  {editFeatures.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEditLine(idx)}
                      style={{ padding: '0.35rem', borderRadius: '4px', background: 'transparent', border: 'none', color: '#f28b82', cursor: 'pointer' }}
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
              style={{ marginTop: '0.4rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'transparent', border: '1px solid #5f6368', color: '#8ab4f8', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
            >
              + List item
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ padding: '0.3rem 0.65rem', borderRadius: '4px', background: 'transparent', border: 'none', color: '#9aa0a6', fontSize: '0.76rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '0.3rem 0.75rem', borderRadius: '4px', background: '#8ab4f8', border: 'none', color: '#202124', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>

          {/* Uncompleted Checklist Items */}
          {openFeaturesIndices.map((idx) => (
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
              <Square size={17} style={{ color: '#9aa0a6', marginTop: '0.1rem', flexShrink: 0 }} />
              <span style={{ fontSize: '0.86rem', color: '#e8eaed', lineHeight: '1.35', wordBreak: 'break-word' }}>
                {totalFeatures[idx]}
              </span>
            </div>
          ))}

          {/* Collapsible Completed Items Header (Google Keep Accordion) */}
          {completedFeaturesIndices.length > 0 && (
            <div style={{ marginTop: openFeaturesIndices.length > 0 ? '0.35rem' : '0' }}>
              <div
                onClick={() => setShowCompleted(!showCompleted)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  paddingTop: '0.35rem',
                  borderTop: openFeaturesIndices.length > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  color: '#9aa0a6',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                {showCompleted ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                <span>{completedFeaturesIndices.length} completed items</span>
              </div>

              {/* Completed Checklist Items List */}
              {showCompleted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
                  {completedFeaturesIndices.map((idx) => (
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
                      <CheckSquare size={17} style={{ color: '#9aa0a6', marginTop: '0.1rem', flexShrink: 0 }} />
                      <span style={{
                        fontSize: '0.85rem',
                        color: '#9aa0a6',
                        textDecoration: 'line-through',
                        lineHeight: '1.35',
                        wordBreak: 'break-word'
                      }}>
                        {totalFeatures[idx]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Card Footer Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.4rem' }}>
            <span style={{ fontSize: '0.7rem', color: '#9aa0a6' }}>
              By {release.author || 'Admin'}
            </span>

            {!isAllDone && (
              <button
                type="button"
                onClick={handleMarkAllDone}
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  background: 'transparent',
                  border: '1px solid #5f6368',
                  color: '#8ab4f8',
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
