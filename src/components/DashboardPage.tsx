import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Receipt,
  FileText,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  Activity
} from 'lucide-react';
import { Project, StatsSummary } from '../types';

interface DashboardPageProps {
  stats: StatsSummary | null;
  projects: Project[];
  currency: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ stats, projects }) => {
  const navigate = useNavigate();

  const totalCards = projects.reduce((acc, p) => acc + (p.cards?.length || 0), 0);
  const totalDocs = projects.reduce((acc, p) => acc + (p.documents?.length || 0), 0);

  const quickLinks = [
    {
      title: 'Banks & Accounts',
      desc: 'Manage connected banking institutions, accounts, and statement attachments.',
      count: `${projects.length} Connected`,
      icon: Building2,
      path: '/banks',
      color: '#818cf8',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%)',
      borderColor: 'rgba(99, 102, 241, 0.3)',
      badgeBg: 'rgba(99, 102, 241, 0.2)',
      badgeColor: '#c7d2fe'
    },
    {
      title: 'Expenses & Transactions',
      desc: 'Browse, categorize, filter, and track all extracted expense line items.',
      count: 'View Expenses',
      icon: Receipt,
      path: '/expenses',
      color: '#34d399',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      badgeBg: 'rgba(16, 185, 129, 0.2)',
      badgeColor: '#a7f3d0'
    },
    {
      title: 'Statements & PDFs',
      desc: 'Upload, unlock encrypted files, preview PDFs, and extract transactions with AI.',
      count: `${totalDocs} Uploaded`,
      icon: FileText,
      path: '/statements',
      color: '#38bdf8',
      gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
      borderColor: 'rgba(56, 189, 248, 0.3)',
      badgeBg: 'rgba(56, 189, 248, 0.2)',
      badgeColor: '#bae6fd'
    },
    {
      title: 'Payment Cards',
      desc: 'Track credit, debit, and virtual cards with auto-matching to statement files.',
      count: `${totalCards} Cards`,
      icon: CreditCard,
      path: '/cards',
      color: '#f472b6',
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.05) 100%)',
      borderColor: 'rgba(236, 72, 153, 0.3)',
      badgeBg: 'rgba(236, 72, 153, 0.2)',
      badgeColor: '#fbcfe8'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Vitals & Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              flexShrink: 0
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Connected Banks
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {stats ? stats.total_projects : projects.length}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              flexShrink: 0
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Active Accounts
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {stats ? stats.active_projects : projects.filter((p) => p.status === 'active').length}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f472b6',
              flexShrink: 0
            }}
          >
            <CreditCard size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              Payment Cards
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {totalCards}
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              flexShrink: 0
            }}
          >
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>
              API Latency
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
              {stats ? `${stats.avg_latency_ms} ms` : 'Optimal'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: '#818cf8' }} /> Workspace Modules
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quick access shortcuts</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-md)',
                  background: item.gradient,
                  border: `1px solid ${item.borderColor}`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1.25rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: item.badgeBg,
                      border: `1px solid ${item.borderColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.color
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      background: item.badgeBg,
                      color: item.badgeColor,
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}
                  >
                    {item.count}
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: item.color,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginTop: 'auto'
                  }}
                >
                  <span>Open {item.title.split(' ')[0]}</span>
                  <ArrowRight size={15} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Coming Soon Placeholder Card */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.75rem',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: '-40px',
            bottom: '-40px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c084fc',
            flexShrink: 0
          }}
        >
          <Sparkles size={30} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Financial Intelligence Dashboard
            </h4>
            <span
              style={{
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#c084fc',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              In Development
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
            We are designing interactive monthly cash-flow charts, category spending heatmaps, vendor analytics, and AI budgeting projections. For now, all bank accounts and statement documents are accessible in the dedicated Banks section.
          </p>
        </div>

        <button
          onClick={() => navigate('/banks')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 700,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)',
            flexShrink: 0
          }}
        >
          <Building2 size={16} />
          <span>Go to Banks</span>
        </button>
      </div>
    </div>
  );
};
