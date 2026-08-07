'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';

export default function BREManagementPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [formData, setFormData] = useState({
    rule_name: '',
    field: '',
    operator: '',
    value: '',
    value_type: 'numeric',
    reference_field: '',
    is_active: true,
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRules();
      setRules(data.rules);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      field: '',
      operator: '',
      value: '',
      value_type: 'numeric',
      reference_field: '',
      is_active: true,
    });
    setEditingRule(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      field: rule.field,
      operator: rule.operator,
      value: rule.value.toString(),
      value_type: rule.value_type,
      reference_field: rule.reference_field || '',
      is_active: rule.is_active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.rule_name || !formData.field || !formData.operator || !formData.value) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
        reference_field: formData.reference_field || null,
      };

      if (editingRule) {
        await api.updateRule(editingRule.id, payload);
      } else {
        await api.createRule(payload);
      }

      closeModal();
      loadRules();
    } catch (err) {
      alert('Failed to save rule: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule) => {
    try {
      await api.deleteRule(rule.id);
      setDeleteConfirm(null);
      loadRules();
    } catch (err) {
      alert('Failed to delete rule: ' + err.message);
    }
  };

  const fieldOptions = [
    { value: 'age', label: 'Age' },
    { value: 'monthly_income', label: 'Monthly Income' },
    { value: 'credit_score', label: 'Credit Score' },
    { value: 'loan_amount', label: 'Loan Amount' },
    { value: 'property_value', label: 'Property Value' },
  ];

  const operatorOptions = ['>=', '<=', '>', '<', '==', '!='];

  const getFieldLabel = (field) => {
    const opt = fieldOptions.find((f) => f.value === field);
    return opt ? opt.label : field;
  };

  return (
    <div>
      <div className="admin-header">
        <h1>⚙️ BRE Rules Management</h1>
        <button className="btn btn-primary btn-sm" onClick={openAddModal}>
          + Add New Rule
        </button>
      </div>

      <p style={{
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        marginBottom: '1.5rem',
        lineHeight: '1.6',
      }}>
        Configure business rules for loan eligibility. Changes take effect immediately for all future applications. 
        No code changes required.
      </p>

      {loading ? (
        <div className="loading-page" style={{ minHeight: '30vh' }}>
          <div className="spinner"></div>
        </div>
      ) : rules.length === 0 ? (
        <div className="empty-state">
          <h3>No BRE Rules configured</h3>
          <p>Add your first business rule to start evaluating leads.</p>
          <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: '1rem' }}>
            + Add Rule
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Field</th>
                <th>Operator</th>
                <th>Value</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td style={{ fontWeight: '500' }}>{rule.rule_name}</td>
                  <td>
                    <span className="badge badge-info">{getFieldLabel(rule.field)}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: '700' }}>
                    {rule.operator}
                  </td>
                  <td style={{ fontWeight: '600' }}>
                    {rule.value_type === 'percentage'
                      ? `${rule.value}% of ${getFieldLabel(rule.reference_field || '')}`
                      : rule.value.toLocaleString('en-IN')
                    }
                  </td>
                  <td>
                    <span className={`badge ${rule.value_type === 'percentage' ? 'badge-warning' : 'badge-info'}`}>
                      {rule.value_type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${rule.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(rule)}
                      >
                        ✏️ Edit
                      </button>
                      {deleteConfirm === rule.id ? (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(rule)}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteConfirm(rule.id)}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRule ? '✏️ Edit Rule' : '➕ Add New Rule'}
              </h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Rule Name *</label>
                <input
                  name="rule_name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Minimum Age Requirement"
                  value={formData.rule_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Field *</label>
                  <select
                    name="field"
                    className="form-select"
                    value={formData.field}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select field</option>
                    {fieldOptions.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Operator *</label>
                  <select
                    name="operator"
                    className="form-select"
                    value={formData.operator}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select operator</option>
                    {operatorOptions.map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Value *</label>
                  <input
                    name="value"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 21"
                    value={formData.value}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Value Type</label>
                  <select
                    name="value_type"
                    className="form-select"
                    value={formData.value_type}
                    onChange={handleChange}
                  >
                    <option value="numeric">Numeric (direct comparison)</option>
                    <option value="percentage">Percentage (% of reference field)</option>
                  </select>
                </div>
              </div>

              {formData.value_type === 'percentage' && (
                <div className="form-group">
                  <label className="form-label">Reference Field (for percentage) *</label>
                  <select
                    name="reference_field"
                    className="form-select"
                    value={formData.reference_field}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select reference field</option>
                    {fieldOptions.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <span className="checkbox-label">Rule is active</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
