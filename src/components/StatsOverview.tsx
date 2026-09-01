import React from 'react';
import { Layers, CheckCircle2, Clock, Building2 } from 'lucide-react';
import { StatsSummary } from '../types';

interface StatsOverviewProps {
  stats: StatsSummary | null;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Banks',
      value: stats ? stats.total_projects : '-',
      icon: Building2,
      color: '#818cf8',
      bg: 'rgba(129, 140, 248, 0.1)'
    },
    {
      title: 'Active Accounts',
      value: stats ? stats.active_projects : '-',
      icon: Layers,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.1)'
    },
    {
      title: 'Reconciled',
      value: stats ? stats.completed_projects : '-',
      icon: CheckCircle2,
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.1)'
    },
    {
      title: 'Avg Latency',
      value: stats ? `${stats.avg_latency_ms} ms` : '-',
      icon: Clock,
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.1)'
    }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}
    >
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="glass-panel"
            style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: card.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${card.color}33`
              }}
            >
              <IconComponent size={22} style={{ color: card.color }} />
            </div>

            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{card.title}</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.1rem' }}>{card.value}</h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};
