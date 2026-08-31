import React, { useState, useEffect } from 'react';
import { Zap, RefreshCw, Cpu, Clock, CheckCircle2, History, ListChecks, User } from 'lucide-react';
import { TokenUsageResponse, TokenUsageLogItem } from '../types';
import { LogPlansModal } from './LogPlansModal';
import { TokenAnalyticsSection } from './TokenAnalyticsSection';
import * as api from '../services/api';



export const TokenUsagePage: React.FC = () => {
  const [data, setData] = useState<TokenUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [selectedLogForPlans, setSelectedLogForPlans] = useState<TokenUsageLogItem | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.fetchTokenUsage();
      setData(res);
      setSecondsRemaining(res.summary.seconds_to_reset || 0);
    } catch (error) {
      console.error('Failed to load token usage logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Live countdown timer for next Gemini reset
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const handleFetchDelta = async () => {
    try {
      setFetching(true);
      setMessage(null);
      const res = await api.fetchTokenUsageDelta();
      setData({ summary: res.summary, logs: res.logs });
      setSecondsRemaining(res.summary.seconds_to_reset || 0);
      setMessage('Successfully recorded new usage fetch log from last fetch to current time!');
    } catch (error: any) {
      alert(`Fetch failed: ${error.message || 'Failed to fetch usage delta.'}`);
    } finally {
      setFetching(false);
    }
  };

  const formatCountdown = (secs: number) => {
    if (secs <= 0) return '00h 00m 00s';
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const formatLocalResetTime = (isoString?: string, defaultFormatted?: string) => {
    if (!isoString) return defaultFormatted || 'Aug 30, 2026 11:59 PM UTC';
    try {
      const d = new Date(isoString);
      const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${datePart} ${timePart}`;
    } catch {
      return defaultFormatted || 'Aug 30, 2026 11:59 PM UTC';
    }
  };

  const summary = data?.summary;
  const logs = data?.logs || [];
  const pct = summary?.balance_percentage ?? 100;
  const isLow = pct < 25;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>

        {/* Balance Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining Token Quota</div>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <Zap size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isLow ? '#f87171' : '#34d399', marginBottom: '0.5rem' }}>
            {summary?.formatted_balance || '1.0M'} / {summary?.formatted_budget || '1.0M'}
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              borderRadius: '3px',
              background: isLow ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #38bdf8, #34d399)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Next Gemini Reset Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Next Gemini Quota Reset</div>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
            {formatCountdown(secondsRemaining)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            Reset at: <strong style={{ color: 'var(--text-muted)' }}>{formatLocalResetTime(summary?.next_gemini_reset_at, summary?.next_gemini_reset_formatted)}</strong>
          </div>
        </div>


        {/* Total Fetches Recorded */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
            <History size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fetch Calls Recorded</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{summary?.total_fetches || 0}</div>
          </div>
        </div>

        {/* Cumulative Consumed */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6' }}>
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cumulative Tokens Used</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>{summary?.formatted_cumulative || '0'}</div>
          </div>
        </div>
      </div>

      {/* 5 AM Daily Cron Job, Calendar & Day-Wise Analytics Section */}
      <TokenAnalyticsSection />


      {/* Header Bar & Fetch CTA Button */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.66rem' }}>
          <Zap size={22} style={{ color: '#38bdf8' }} />
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>Token Usage Fetch History</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Historical logs of every token usage fetch call from previous fetch to current time</p>
          </div>
        </div>

        <button
          onClick={handleFetchDelta}
          disabled={fetching}
          style={{
            padding: '0.65rem 1.35rem',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
          Fetch Current Usage (Last ➔ Now)
        </button>
      </div>

      {/* Banner Notification */}
      {message && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Fetch Logs Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading && logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading token usage logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <Zap size={40} style={{ color: 'var(--text-dim)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '0.5rem' }}>
              No token usage fetch records recorded yet.
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Click <strong>"Fetch Current Usage (Last ➔ Now)"</strong> above to calculate and record your first usage log entry.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Fetch Log #</th>
                  <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Triggered By</th>
                  <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Time Window (Start ➔ End)</th>
                  <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Interval Tokens</th>
                  <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Cumulative Tokens</th>
                  <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Quota Balance</th>
                  <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Breakdown (Output / Tool / Thinking)</th>

                  <th style={{ padding: '0.85rem 0.75rem', fontWeight: 700 }}>Session Plans</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Fetched At</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s ease' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                          #{logs.length - index}
                        </span>
                        <span>Fetch #{log.id}</span>
                      </div>
                    </td>

                    {/* Triggered By Badge (Cron Job vs Manual Fetch) */}
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      {log.triggered_by === 'cron_job' ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '20px',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          color: '#818cf8',
                          fontSize: '0.74rem',
                          fontWeight: 700
                        }}>
                          <Clock size={12} /> 10-Min Cron
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '20px',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#34d399',
                          fontSize: '0.74rem',
                          fontWeight: 700
                        }}>
                          <User size={12} /> Manual Fetch
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', color: '#e2e8f0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      {log.interval_formatted}
                    </td>


                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      {log.formatted_delta}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: 700, color: '#cbd5e1' }}>
                      {log.formatted_cumulative}
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 700, color: log.balance_percentage < 25 ? '#f87171' : '#34d399' }}>
                          {log.formatted_balance} ({log.balance_percentage}%)
                        </span>
                        <div style={{ width: '80px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${log.balance_percentage}%`,
                            background: log.balance_percentage < 25 ? '#ef4444' : '#34d399'
                          }} />
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      <span style={{ color: '#818cf8' }}>{log.content_tokens.toLocaleString()} Out</span> •{' '}
                      <span style={{ color: '#34d399' }}>{log.tool_tokens.toLocaleString()} Tool</span> •{' '}
                      <span style={{ color: '#fbbf24' }}>{log.thinking_tokens.toLocaleString()} Think</span>
                    </td>

                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <button
                        onClick={() => setSelectedLogForPlans(log)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.15) 100%)',
                          border: '1px solid rgba(129, 140, 248, 0.4)',
                          color: '#818cf8',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)'
                        }}
                      >
                        <ListChecks size={14} />
                        View Plans ({(log.plans || []).length})
                      </button>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} /> {log.fetched_at_formatted}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Plans Detail Modal */}
      <LogPlansModal
        isOpen={!!selectedLogForPlans}
        onClose={() => setSelectedLogForPlans(null)}
        logItem={selectedLogForPlans}
      />

    </div>
  );
};

