import React, { useState } from 'react';
import { X, Plus, Sparkles, Upload, FileText, FileSpreadsheet } from 'lucide-react';
import { Project } from '../types';
import { Select } from './ui/Select';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Project>, files?: File[]) => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Frontend');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(
      {
        title,
        description,
        category,
        status
      },
      selectedFiles
    );

    setTitle('');
    setDescription('');
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                Category
              </label>
              <Select
                value={category}
                onChange={(val) => setCategory(val)}
                options={[
                  { value: 'Frontend', label: 'Commercial' },
                  { value: 'Backend', label: 'Retail' },
                  { value: 'Security', label: 'Investment' },
                  { value: 'DevOps', label: 'Payroll' },
                  { value: 'Database', label: 'Savings' }
                ]}
                buttonStyle={{
                  padding: '0.65rem 0.9rem',
                  fontSize: '0.85rem',
                  background: '#1e293b'
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
