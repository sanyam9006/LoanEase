'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await api.getAdmins();
      setAdmins(data.users);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setFormData({ username: '', email: '', password: '', full_name: '' });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all required fields (username, email, password)');
      return;
    }

    setSaving(true);
    try {
      await api.createAdmin(formData);
      setSuccessMsg(`Admin '${formData.username}' created successfully!`);
      closeModal();
      loadAdmins();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1>🔑 Admin Management</h1>
        <button className="btn btn-primary btn-sm" onClick={openModal}>
          + Add New Admin
        </button>
      </div>

      <p style={{
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        marginBottom: '1.5rem',
        lineHeight: '1.6',
      }}>
        Manage authorized administrator accounts. Active admins can log in, evaluate leads, export data, and manage BRE rules.
      </p>

      {successMsg && (
        <div className="toast toast-success" style={{ marginBottom: '1.5rem', animation: 'none' }}>
          ✓ {successMsg}
        </div>
      )}

      {loading ? (
        <div className="loading-page" style={{ minHeight: '30vh' }}>
          <div className="spinner"></div>
        </div>
      ) : admins.length === 0 ? (
        <div className="empty-state">
          <h3>No admin users found</h3>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '600', color: 'var(--accent)' }}>#{u.id}</td>
                  <td style={{ fontWeight: '600' }}>{u.username}</td>
                  <td>{u.full_name || 'N/A'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Admin Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">🔑 Add New Admin</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            {error && (
              <div className="toast toast-error" style={{ marginBottom: '1.25rem', animation: 'none' }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-username">Username *</label>
                <input
                  id="admin-username"
                  name="username"
                  type="text"
                  className="form-input"
                  placeholder="e.g. sanyam"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-email">Email Address *</label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. sanyam@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-password">Password *</label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-fullname">Full Name</label>
                <input
                  id="admin-fullname"
                  name="full_name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sanyam Admin"
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating Admin...' : 'Create Admin User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
