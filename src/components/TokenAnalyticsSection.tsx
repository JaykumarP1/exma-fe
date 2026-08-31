import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, BarChart3, Clock } from 'lucide-react';
import { DailyTokenMetricItem, TokenAnalyticsResponse } from '../types';
import * as api from '../services/api';

export const TokenAnalyticsSection: React.FC = () => {
  const [data, setData] = useState<TokenAnalyticsResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<DailyTokenMetricItem | null>(null);
  const [chartRange, setChartRange] = useState<14 | 30>(14);

  const loadAnalytics = async () => {
    try {
      const res = await api.fetchTokenAnalytics();
      setData(res);
      if (res.daily_metrics.length > 0) {
        setSelectedDay(res.daily_metrics[res.daily_metrics.length - 1]);
      }
    } catch (error) {
      console.error('Failed to load token analytics', error);
    }
  };


  useEffect(() => {
    loadAnalytics();
  }, []);

  const metrics = data?.daily_metrics || [];
  const chartMetrics = metrics.slice(-chartRange);
  const maxTokens = Math.max(...chartMetrics.map((m) => m.total_tokens), 60_000);
  const avgTokens = chartMetrics.length > 0
    ? Math.round(chartMetrics.reduce((sum, m) => sum + m.total_tokens, 0) / chartMetrics.length)
    : 0;

  // Calendar Day Intensity Helpers
  const getIntensityColor = (tokens: number) => {
    if (tokens === 0) return { bg: 'rgba(255, 255, 255, 0.02)', border: 'rgba(255, 255, 255, 0.06)', text: 'var(--text-dim)' };
    if (tokens >= 55_000) return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', text: '#f87171' };
    if (tokens >= 38_000) return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: '#c084fc' };
    if (tokens >= 22_000) return { bg: 'rgba(56, 189, 248, 0.2)', border: 'rgba(56, 189, 248, 0.4)', text: '#38bdf8' };
    return { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', text: '#34d399' };
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* 5:00 AM Cron Job Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',

        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(16, 185, 129, 0.08) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <Clock size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                Daily 5:00 AM Automated Token Cron Job
              </h3>
              <div className="pulse-badge pulse-emerald" style={{ padding: '0.15rem 0.5rem', fontSize: '0.68rem' }}>
                <span className="pulse-dot pulse-emerald" />
                <span style={{ color: '#34d399', fontWeight: 700 }}>5:00 AM CRON ACTIVE</span>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Runs automatically every morning at 5:00 AM (<code style={{ color: '#38bdf8' }}>0 5 * * *</code>) to record day-wise token consumption analytics.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <div>
            Last run: <strong style={{ color: '#e2e8f0' }}>Today at 05:00 AM</strong>
          </div>
          <div style={{ padding: '0.35rem 0.75rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: '#38bdf8', fontWeight: 700 }}>
            30 Days Tracked
          </div>
        </div>
      </div>

      {/* Main Analytics Grid: Chart + Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>


        {/* Day-Wise Token Usage Chart Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} style={{ color: '#38bdf8' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>Day-Wise Token Consumption Chart</h4>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
              <button
                onClick={() => setChartRange(14)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: chartRange === 14 ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                  color: chartRange === 14 ? '#38bdf8' : 'var(--text-dim)'
                }}
              >
                14 Days
              </button>
              <button
                onClick={() => setChartRange(30)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: chartRange === 30 ? 'rgba(56, 189, 248, 0.3)' : 'transparent',
                  color: chartRange === 30 ? '#38bdf8' : 'var(--text-dim)'
                }}
              >
                30 Days
              </button>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div style={{
            height: '210px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: chartRange === 14 ? '0.5rem' : '0.25rem',
            paddingTop: '1.5rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid var(--border-glass)',
            position: 'relative'
          }}>
            {/* Reference Average Line */}
            <div style={{
              position: 'absolute',
              top: `${100 - (avgTokens / maxTokens) * 100}%`,
              left: 0,
              right: 0,
              borderTop: '1px dashed rgba(56, 189, 248, 0.4)',
              pointerEvents: 'none',
              zIndex: 1
            }}>
              <span style={{ fontSize: '0.62rem', color: '#38bdf8', position: 'absolute', right: 0, top: '-0.85rem', background: '#0f172a', padding: '0 0.3rem' }}>
                Avg: {(avgTokens / 1000).toFixed(1)}k
              </span>
            </div>

            {chartMetrics.map((metric) => {
              const heightPct = Math.max((metric.total_tokens / maxTokens) * 100, 6);
              const isSelected = selectedDay?.id === metric.id;
              const intensity = getIntensityColor(metric.total_tokens);

              return (
                <div
                  key={metric.id}
                  onClick={() => setSelectedDay(metric)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    cursor: 'pointer'
                  }}
                  title={`${metric.formatted_date}: ${metric.formatted_total} tokens`}
                >
                  {/* Bar pillar */}
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      borderRadius: '4px 4px 0 0',
                      background: isSelected
                        ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
                        : `linear-gradient(180deg, ${intensity.text} 0%, ${intensity.border} 100%)`,
                      boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.5)' : 'none',
                      transition: 'all 0.2s ease',
                      opacity: isSelected ? 1 : 0.8
                    }}
                  />
                  <span style={{ fontSize: '0.62rem', color: isSelected ? '#38bdf8' : 'var(--text-dim)', marginTop: '0.3rem', fontWeight: isSelected ? 700 : 500 }}>
                    {metric.day_name.slice(0, 1)}{metric.day_number}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected Day Stats Footer */}
          {selectedDay && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.78rem' }}>
              <div style={{ color: '#e2e8f0', fontWeight: 700 }}>
                {selectedDay.formatted_date} ({selectedDay.day_name})
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                <span style={{ color: '#38bdf8', fontWeight: 800 }}>{selectedDay.formatted_total} Tokens</span>
                <span style={{ color: 'var(--text-dim)' }}>{selectedDay.fetches_count} Fetches</span>
              </div>
            </div>
          )}
        </div>

        {/* Day-Wise Token Usage Calendar Grid Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={18} style={{ color: '#818cf8' }} />
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>Token Usage Calendar Grid</h4>
            </div>

            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              August 2026
            </div>
          </div>

          {/* Calendar Day Header Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem', textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)' }}>
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>

          {/* Calendar Grid Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem' }}>
            {metrics.slice(-28).map((metric) => {
              const isSelected = selectedDay?.id === metric.id;
              const style = getIntensityColor(metric.total_tokens);

              return (
                <div
                  key={metric.id}
                  onClick={() => setSelectedDay(metric)}
                  style={{
                    padding: '0.45rem 0.2rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.25)' : style.bg,
                    border: isSelected ? '1px solid #38bdf8' : `1px solid ${style.border}`,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none'
                  }}
                  title={`${metric.formatted_date}: ${metric.formatted_total} tokens`}
                >
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isSelected ? '#ffffff' : '#f8fafc' }}>
                    {metric.day_number}
                  </div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, color: isSelected ? '#38bdf8' : style.text, marginTop: '0.15rem' }}>
                    {metric.formatted_total}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Legend Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            <span>Consumption Intensity:</span>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#34d399' }} /> Light
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#38bdf8' }} /> Medium
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#c084fc' }} /> Heavy
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#f87171' }} /> Peak
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
