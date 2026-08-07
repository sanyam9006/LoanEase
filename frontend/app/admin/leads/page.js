'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '../../../lib/api';

export default function LeadManagementPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [search, setSearch] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, per_page: perPage };
      if (search) params.search = search;
      if (loanTypeFilter) params.loan_type = loanTypeFilter;
      if (statusFilter) params.bre_status = statusFilter;

      const data = await api.getLeads(params);
      setLeads(data.leads);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, loanTypeFilter, statusFilter]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.exportLeads();
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      let isoStr = dateStr;
      if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
        isoStr = dateStr + 'Z';
      }
      return new Date(isoStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div>
      <div className="admin-header">
        <h1>👥 Lead Management</h1>
        <button
          className="btn btn-success btn-sm"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? '⏳ Exporting...' : '📥 Export to Excel'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, mobile, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={loanTypeFilter}
          onChange={(e) => { setLoanTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Loan Types</option>
          <option value="Home Loan">Home Loan</option>
          <option value="Loan Against Property">LAP</option>
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="Eligible">Eligible</option>
          <option value="Not Eligible">Not Eligible</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Results count */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Showing {leads.length} of {total} leads
      </p>

      {/* Table */}
      {loading ? (
        <div className="loading-page" style={{ minHeight: '30vh' }}>
          <div className="spinner"></div>
        </div>
      ) : leads.length === 0 ? (
        <div className="empty-state">
          <h3>No leads found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Lead ID</th>
                  <th>Customer Name</th>
                  <th>Mobile</th>
                  <th>Loan Type</th>
                  <th>Loan Amount</th>
                  <th>Credit Score</th>
                  <th>BRE Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>
                      #{lead.id}
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{lead.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.email}</div>
                      </div>
                    </td>
                    <td>{lead.mobile}</td>
                    <td>
                      <span className="badge badge-info">{lead.loan_type}</span>
                    </td>
                    <td>{formatCurrency(lead.loan_amount)}</td>
                    <td>
                      <span style={{
                        fontWeight: '600',
                        color: lead.credit_score >= 700 ? 'var(--success)' :
                          lead.credit_score >= 500 ? 'var(--warning)' : 'var(--danger)',
                      }}>
                        {lead.credit_score || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${lead.bre_status === 'Eligible' ? 'badge-success' :
                        lead.bre_status === 'Not Eligible' ? 'badge-danger' : 'badge-warning'
                        }`}>
                        {lead.bre_status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {formatDate(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Prev
              </button>

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
