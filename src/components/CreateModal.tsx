import React, { useState } from 'react';
import { X, Plus, Sparkles, Upload, FileText, FileSpreadsheet, Tag, Check } from 'lucide-react';
import { Project } from '../types';
import { Select } from './ui/Select';
import { PRESET_BANK_TAGS, getTagColor } from '../utils/tagColors';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Project>, files?: File[]) => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>(['Banking']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [status, setStatus] = useState<Project['status']>('active');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFileError(null);
    const files = Array.from(e.target.files);

    const validFiles: File[] = [];
    let hasInvalid = false;

    files.forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'xls', 'xlsx'].includes(ext || '')) {
        validFiles.push(file);
      } else {
        hasInvalid = true;
      }
    });

    if (hasInvalid) {
      setFileError('Only PDF (.pdf) and Excel (.xls, .xlsx) files are allowed.');
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (preset: string) => {
    setTags((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === preset.toLowerCase());
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== preset.toLowerCase());
      } else {
        return [...prev, preset];
      }
    });
  };

  const handleAddCustomTag = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const finalTags = tags.length > 0 ? tags : ['Banking'];
    onSubmit(
      {
        title: title.trim(),
        description: description.trim(),
        tags: finalTags,
        category: finalTags.join(', '),
        status
      },
      selectedFiles
    );

    setTitle('');
    setDescription('');
    setTags(['Banking']);
    setCustomTagInput('');
    setSelectedFiles([]);
    setFileError(null);
    onClose();
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return <FileText size={16} style={{ color: '#ef4444' }} />;
    }
    return <FileSpreadsheet size={16} style={{ color: '#10b981' }} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{ width: '100%', maxWidth: '520px', padding: '2rem', background: '#0f172a' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>New Bank Entry</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-dim)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
                fontWeight: 600
              }}
            >
              Bank Name / Account Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Chase Business Checking"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
                fontWeight: 600
              }}
            >
              Description / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of bank account details or statement period..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Multi-Tag Selection */}
          <div style={{ marginBottom: '0.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
                fontWeight: 600
              }}
            >
              Tags ({tags.length} selected)
            </label>

            {/* Selected Tags Chips */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.35rem',
                padding: '0.5rem 0.65rem',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-glass)',
                marginBottom: '0.65rem',
                alignItems: 'center',
                minHeight: '38px'
              }}
            >
              {tags.length === 0 ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  No tags selected (defaults to Banking)
                </span>
              ) : (
                tags.map((t) => {
                  const style = getTagColor(t);
                  return (
                    <span
                      key={t}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background: style.bg,
                        color: style.text,
                        border: `1px solid ${style.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <Tag size={10} style={{ opacity: 0.8 }} />
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
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
                      >
                        <X size={11} />
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            {/* Preset Toggle Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.65rem' }}>
              {PRESET_BANK_TAGS.map((preset) => {
                const isSelected = tags.some((t) => t.toLowerCase() === preset.toLowerCase());
                const color = getTagColor(preset);

                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => toggleTag(preset)}
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease',
                      background: isSelected ? color.bg : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? color.text : 'var(--text-muted)',
                      border: isSelected ? `1px solid ${color.border}` : '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    {isSelected ? <Check size={11} /> : <Plus size={10} style={{ opacity: 0.6 }} />}
                    {preset}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div style={{ display: 'flex', gap: '0.45rem' }}>
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
                placeholder="Type custom tag (e.g. Demat, Forex, FD) & press Enter..."
                style={{
                  flex: 1,
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                disabled={!customTagInput.trim()}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: customTagInput.trim() ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${customTagInput.trim() ? 'rgba(56, 189, 248, 0.35)' : 'var(--border-glass)'}`,
                  color: customTagInput.trim() ? 'var(--accent-primary)' : 'var(--text-dim)',
                  cursor: customTagInput.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <Plus size={13} /> Add Tag
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
                fontWeight: 600
              }}
            >
              Status
            </label>
            <Select
              value={status}
              onChange={(val) => setStatus(val as Project['status'])}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' }
              ]}
              buttonStyle={{
                padding: '0.65rem 0.9rem',
                fontSize: '0.85rem',
                background: '#1e293b'
              }}
            />
          </div>

          {/* File Upload Section */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
                fontWeight: 600
              }}
            >
              Attach Bank Statements (PDF / Excel)
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed var(--border-glass)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Upload size={16} />
              <span>Choose PDF (.pdf) or Excel (.xls, .xlsx) files</span>
              <input
                type="file"
                multiple
                accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>

            {fileError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem' }}>{fileError}</p>}

            {selectedFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.6rem' }}>
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.4rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      {getFileIcon(file.name)}
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '240px'
                        }}
                      >
                        {file.name}
                      </span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      style={{ color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
              }}
            >
              <Plus size={16} /> Save Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
