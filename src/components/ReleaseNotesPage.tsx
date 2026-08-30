import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Plus, CheckCircle2, Trash2, X } from 'lucide-react';
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


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>

      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(99, 102, 241, 0.12) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8'
          }}>
            <Sparkles size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
                Platform Release Notes & System Changelog
              </h2>
              {releases.length > 0 && (
                <span style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {releases[0].version} (Latest)
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Historical database timeline of all platform updates, multi-agent features, and system improvements.
            </p>
          </div>
        </div>

        {isAdmin && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Plus size={18} /> Create New Release
          </button>
        )}
      </div>

      {/* Admin New Release Creation Form Modal / Card */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="glass-panel" style={{ padding: '1.75rem', border: '1px solid rgba(99, 102, 241, 0.4)', background: 'rgba(15, 23, 42, 0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} style={{ color: '#818cf8' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Publish New Release to Database</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Version Tag *</label>
              <input
                type="text"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="e.g. v1.5.0"
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: '#f8fafc', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Release Date *</label>
              <input
                type="date"
                value={newReleaseDate}
                onChange={(e) => setNewReleaseDate(e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: '#f8fafc', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Release Tagline / Headline</label>
            <input
              type="text"
              value={newTagline}
              onChange={(e) => setNewTagline(e.target.value)}
              placeholder="e.g. Advanced Multi-Agent Collaboration & Sidekiq Cron Scheduling"
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: '#f8fafc', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Feature Points Checklist *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {featureInputs.map((val, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleFeatureInputChange(idx, e.target.value)}
                    placeholder={`Feature item #${idx + 1}`}
                    required={idx === 0}
                    style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: '#f8fafc', fontSize: '0.82rem' }}
                  />
                  {featureInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeatureInput(idx)}
                      style={{ padding: '0.55rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddFeatureInput}
              style={{ marginTop: '0.6rem', padding: '0.4rem 0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-glass)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} /> Add Feature Line
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{ padding: '0.6rem 1.1rem', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '0.6rem 1.25rem', borderRadius: '6px', background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', border: 'none', color: '#ffffff', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {submitting ? 'Saving to Database...' : 'Save & Publish Release'}
            </button>
          </div>
        </form>
      )}

      {/* Release Notes History List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {releases.map((rel) => (
          <div key={rel.id} className="glass-panel" style={{ padding: '1.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <span style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#818cf8',
                    fontSize: '1rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {rel.version}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    <Calendar size={14} /> {rel.release_date_formatted || rel.release_date}
                  </div>
                </div>

                {rel.tagline && (
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.35rem' }}>
                    {rel.tagline}
                  </h3>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                  By {rel.author || 'Platform Admin'}
                </span>

                {isAdmin && (
                  <button
                    onClick={() => setDeletingRelease({ id: rel.id, version: rel.version })}
                    style={{
                      padding: '0.35rem 0.6rem',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                    title="Delete release note from database"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>

            {/* Feature Points List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.85rem', padding: '1rem 1.25rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              {rel.features?.map((feat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.85rem', color: '#e2e8f0' }}>
                  <CheckCircle2 size={16} style={{ color: '#34d399', marginTop: '0.15rem', flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Release Note Confirmation Popup Modal */}
      <ConfirmModal
        isOpen={!!deletingRelease}
        title="Delete Release Note"
        message={`Are you sure you want to permanently delete release note ${deletingRelease?.version}? This action cannot be undone.`}
        confirmText="Delete Release"
        cancelText="Keep Release"
        type="danger"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingRelease(null)}
      />

    </div>
  );
};

