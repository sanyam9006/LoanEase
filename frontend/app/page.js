'use client';

import { useState } from 'react';
import api from '../lib/api';

export default function LoanApplicationPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    email: '',
    dob: '',
    city: '',
    pincode: '',
    loan_type: '',
    employment_type: '',
    monthly_income: '',
    loan_amount: '',
    property_value: '',
    consent: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [serverError, setServerError] = useState('');

  const validate = () => {
    const errs = {};

    if (!formData.full_name.trim() || formData.full_name.trim().length < 2)
      errs.full_name = 'Full name is required (min 2 characters)';

    if (!/^[6-9]\d{9}$/.test(formData.mobile))
      errs.mobile = 'Enter a valid 10-digit Indian mobile number';

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email))
      errs.email = 'Enter a valid email address';

    if (!formData.dob) {
      errs.dob = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      if (dobDate >= new Date()) errs.dob = 'Date of birth must be in the past';
    }

    if (!formData.city.trim()) errs.city = 'City is required';

    if (!/^\d{6}$/.test(formData.pincode))
      errs.pincode = 'Enter a valid 6-digit pincode';

    if (!formData.loan_type) errs.loan_type = 'Select a loan type';
    if (!formData.employment_type) errs.employment_type = 'Select employment type';

    if (!formData.monthly_income || Number(formData.monthly_income) <= 0)
      errs.monthly_income = 'Enter a valid monthly income';

    if (!formData.loan_amount || Number(formData.loan_amount) <= 0)
      errs.loan_amount = 'Enter a valid loan amount';

    if (!formData.property_value || Number(formData.property_value) <= 0)
      errs.property_value = 'Enter a valid property value';

    if (!formData.consent)
      errs.consent = 'You must agree to share information with lending partners';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setResult(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        monthly_income: parseFloat(formData.monthly_income),
        loan_amount: parseFloat(formData.loan_amount),
        property_value: parseFloat(formData.property_value),
      };
      const data = await api.createLead(payload);
      setResult(data);
    } catch (err) {
      setServerError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '', mobile: '', email: '', dob: '', city: '', pincode: '',
      loan_type: '', employment_type: '', monthly_income: '',
      loan_amount: '', property_value: '', consent: false,
    });
    setResult(null);
    setServerError('');
    setErrors({});
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // If we have a result, show it
  if (result) {
    const isEligible = result.bre_status === 'Eligible';
    return (
      <div className="loan-page">
        <div className="loan-header">
          <h1>Application Result</h1>
          <p>Your loan application has been processed</p>
        </div>
        <div className="loan-form-wrapper">
          <div className={`result-card ${isEligible ? 'eligible' : 'not-eligible'}`}>
            <div className={`result-icon ${isEligible ? 'success' : 'failure'}`}>
              {isEligible ? '✓' : '✕'}
            </div>
            <h2 className="result-title" style={{ color: isEligible ? 'var(--success)' : 'var(--danger)' }}>
              {isEligible ? 'Congratulations! You are Eligible' : 'Not Eligible'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              {isEligible
                ? 'Your loan application meets all eligibility criteria.'
                : 'Your application did not meet the eligibility criteria.'}
            </p>

            <div className="result-details">
              <div className="result-detail-row">
                <span className="result-detail-label">Lead ID</span>
                <span className="result-detail-value">#{result.lead_id}</span>
              </div>
              <div className="result-detail-row">
                <span className="result-detail-label">Credit Score</span>
                <span className="result-detail-value" style={{
                  color: result.credit_score >= 700 ? 'var(--success)' :
                    result.credit_score >= 500 ? 'var(--warning)' : 'var(--danger)'
                }}>
                  {result.credit_score || 'N/A'}
                </span>
              </div>
              <div className="result-detail-row">
                <span className="result-detail-label">BRE Status</span>
                <span className="result-detail-value">
                  <span className={`badge ${isEligible ? 'badge-success' : 'badge-danger'}`}>
                    {result.bre_status}
                  </span>
                </span>
              </div>
            </div>

            {result.rejection_reasons && result.rejection_reasons.length > 0 && (
              <div className="rejection-list">
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Reasons for Rejection:</h4>
                {result.rejection_reasons.map((reason, idx) => (
                  <div key={idx} className="rejection-item">
                    {reason}
                  </div>
                ))}
              </div>
            )}

            {result.message && (
              <p style={{ marginTop: '1rem', color: 'var(--warning)', fontSize: '0.8125rem' }}>
                ⚠ {result.message}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button className="btn btn-primary btn-lg" onClick={resetForm}>
              Submit Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="loan-page">
      <div className="loan-header">
        <h1>🏦 LoanEase</h1>
        <p>Apply for a Home Loan or Loan Against Property. Get instant eligibility results powered by our smart Business Rule Engine.</p>
      </div>

      <div className="loan-form-wrapper">
        {serverError && (
          <div className="toast toast-error" style={{ marginBottom: '1.5rem', animation: 'none' }}>
            ⚠ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Customer Details */}
          <div className="form-section">
            <h3 className="form-section-title">
              <span className="icon blue">👤</span>
              Customer Details
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="full_name">Full Name *</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  className={`form-input ${errors.full_name ? 'error' : ''}`}
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={handleChange}
                />
                {errors.full_name && <p className="form-error">{errors.full_name}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="mobile">Mobile Number *</label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  className={`form-input ${errors.mobile ? 'error' : ''}`}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={handleChange}
                />
                {errors.mobile && <p className="form-error">{errors.mobile}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email ID *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dob">Date of Birth *</label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  className={`form-input ${errors.dob ? 'error' : ''}`}
                  value={formData.dob}
                  onChange={handleChange}
                />
                {errors.dob && <p className="form-error">{errors.dob}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="city">City *</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className={`form-input ${errors.city ? 'error' : ''}`}
                  placeholder="Your city"
                  value={formData.city}
                  onChange={handleChange}
                />
                {errors.city && <p className="form-error">{errors.city}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="pincode">Pincode *</label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  className={`form-input ${errors.pincode ? 'error' : ''}`}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={handleChange}
                />
                {errors.pincode && <p className="form-error">{errors.pincode}</p>}
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="form-section">
            <h3 className="form-section-title">
              <span className="icon purple">💰</span>
              Loan Details
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="loan_type">Loan Type *</label>
                <select
                  id="loan_type"
                  name="loan_type"
                  className={`form-select ${errors.loan_type ? 'error' : ''}`}
                  value={formData.loan_type}
                  onChange={handleChange}
                >
                  <option value="">Select loan type</option>
                  <option value="Home Loan">Home Loan</option>
                  <option value="Loan Against Property">Loan Against Property</option>
                </select>
                {errors.loan_type && <p className="form-error">{errors.loan_type}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="employment_type">Employment Type *</label>
                <select
                  id="employment_type"
                  name="employment_type"
                  className={`form-select ${errors.employment_type ? 'error' : ''}`}
                  value={formData.employment_type}
                  onChange={handleChange}
                >
                  <option value="">Select employment type</option>
                  <option value="Salaried">Salaried</option>
                  <option value="Self Employed">Self Employed</option>
                </select>
                {errors.employment_type && <p className="form-error">{errors.employment_type}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="monthly_income">Monthly Income (₹) *</label>
              <input
                id="monthly_income"
                name="monthly_income"
                type="number"
                className={`form-input ${errors.monthly_income ? 'error' : ''}`}
                placeholder="e.g. 50000"
                value={formData.monthly_income}
                onChange={handleChange}
              />
              {errors.monthly_income && <p className="form-error">{errors.monthly_income}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="loan_amount">Loan Amount Required (₹) *</label>
                <input
                  id="loan_amount"
                  name="loan_amount"
                  type="number"
                  className={`form-input ${errors.loan_amount ? 'error' : ''}`}
                  placeholder="e.g. 5000000"
                  value={formData.loan_amount}
                  onChange={handleChange}
                />
                {errors.loan_amount && <p className="form-error">{errors.loan_amount}</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="property_value">Property Value (₹) *</label>
                <input
                  id="property_value"
                  name="property_value"
                  type="number"
                  className={`form-input ${errors.property_value ? 'error' : ''}`}
                  placeholder="e.g. 7000000"
                  value={formData.property_value}
                  onChange={handleChange}
                />
                {errors.property_value && <p className="form-error">{errors.property_value}</p>}
              </div>
            </div>
          </div>

          {/* Consent */}
          <div className="form-section">
            <h3 className="form-section-title">
              <span className="icon green">📋</span>
              Consent
            </h3>

            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
              />
              <span className="checkbox-label">
                I hereby authorize LoanEase and its lending partners to access my information, 
                including credit bureau data, for the purpose of processing my loan application. 
                I understand that my information will be shared with lending partners for loan processing.
              </span>
            </label>
            {errors.consent && <p className="form-error" style={{ marginTop: '0.5rem' }}>{errors.consent}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></span>
                Processing Application...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>

        <footer style={{ 
          textAlign: 'center', 
          marginTop: '3rem', 
          padding: '2rem 1rem 0', 
          borderTop: '1px solid var(--border)', 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)' 
        }}>
          <p>© {new Date().getFullYear()} LoanEase. All rights reserved. | <a href="/admin/login" style={{ color: 'var(--accent)', fontWeight: '600' }}>Admin Portal</a></p>
        </footer>
      </div>
    </div>
  );
}
