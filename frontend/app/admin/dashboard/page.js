'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <h3>Failed to load dashboard data</h3>
        <p>Make sure the backend server is running.</p>
        <button className="btn btn-primary" onClick={loadStats} style={{ marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const eligiblePct = stats.total_leads > 0
    ? ((stats.eligible_leads / stats.total_leads) * 100).toFixed(1)
    : 0;
  const rejectedPct = stats.total_leads > 0
    ? ((stats.rejected_leads / stats.total_leads) * 100).toFixed(1)
    : 0;

  return (
    <div>
      <div className="admin-header">
        <h1>📊 Dashboard</h1>
        <button className="btn btn-secondary btn-sm" onClick={loadStats}>
          ↻ Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div>
            <div className="stat-value">{stats.total_leads}</div>
            <div className="stat-label">Total Leads</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.eligible_leads}</div>
            <div className="stat-label">Eligible Leads</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">❌</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{stats.rejected_leads}</div>
            <div className="stat-label">Rejected Leads</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">📈</div>
          <div>
            <div className="stat-value">{stats.average_credit_score || 'N/A'}</div>
            <div className="stat-label">Avg Credit Score</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Eligibility Pie Chart (CSS-based) */}
        <div className="chart-card">
          <h3>Eligibility Distribution</h3>
          {stats.total_leads > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{
                width: '160px',
                height: '160px',
                borderRadius: '50%',
                background: `conic-gradient(
                  var(--success) 0% ${eligiblePct}%,
                  var(--danger) ${eligiblePct}% ${parseFloat(eligiblePct) + parseFloat(rejectedPct)}%,
                  var(--warning) ${parseFloat(eligiblePct) + parseFloat(rejectedPct)}% 100%
                )`,
                flexShrink: 0,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                }}>
                  {stats.total_leads}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--success)' }}></div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Eligible — {stats.eligible_leads} ({eligiblePct}%)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--danger)' }}></div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Rejected — {stats.rejected_leads} ({rejectedPct}%)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--warning)' }}></div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Pending — {stats.pending_leads}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No leads yet
            </p>
          )}
        </div>

        {/* Loan Type Bar Chart (CSS-based) */}
        <div className="chart-card">
          <h3>Loan Type Breakdown</h3>
          {Object.keys(stats.loan_type_breakdown).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {Object.entries(stats.loan_type_breakdown).map(([type, count]) => {
                const maxCount = Math.max(...Object.values(stats.loan_type_breakdown));
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <div key={type}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.375rem',
                      fontSize: '0.875rem',
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{type}</span>
                      <span style={{ fontWeight: '600' }}>{count}</span>
                    </div>
                    <div style={{
                      height: '24px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: type === 'Home Loan' ? 'var(--accent)' : 'var(--accent-secondary)',
                        borderRadius: 'var(--radius)',
                        transition: 'width 0.5s ease',
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No data yet
            </p>
          )}
        </div>
      </div>

      {/* Monthly Leads Chart */}
      {stats.monthly_leads.length > 0 && (
        <div className="chart-card" style={{ marginBottom: '2rem' }}>
          <h3>Monthly Lead Volume</h3>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '1rem',
            height: '200px',
            paddingTop: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border)',
          }}>
            {stats.monthly_leads.map((item, idx) => {
              const maxCount = Math.max(...stats.monthly_leads.map(m => m.count));
              const height = maxCount > 0 ? (item.count / maxCount) * 140 : 10;
              return (
                <div key={idx} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.count}</span>
                  <div style={{
                    width: '32px',
                    height: `${height}px`,
                    background: 'var(--accent)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: '4px',
                    transition: 'height 0.5s ease',
                  }}></div>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    marginTop: '0.25rem',
                  }}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
