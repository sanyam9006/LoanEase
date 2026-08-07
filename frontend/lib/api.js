const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.removeToken();
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
        throw new Error('Unauthorized');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error.message === 'Unauthorized') throw error;
      if (error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Make sure the backend is running on port 8000.');
      }
      throw error;
    }
  }

  // Auth
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  logout() {
    this.removeToken();
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  async getAdmins() {
    return this.request('/api/auth/admins');
  }

  async createAdmin(adminData) {
    return this.request('/api/auth/create-admin', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
  }

  // Leads
  async createLead(leadData) {
    return this.request('/api/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async getLeads(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/leads?${query}`);
  }

  async getLead(id) {
    return this.request(`/api/leads/${id}`);
  }

  async exportLeads() {
    const url = `${this.baseUrl}/api/leads/export`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.getToken()}` },
    });
    if (!response.ok) throw new Error('Export failed');
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'leads_export.xlsx';
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
  }

  // BRE Rules
  async getRules() {
    return this.request('/api/bre/rules');
  }

  async createRule(ruleData) {
    return this.request('/api/bre/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  async updateRule(id, ruleData) {
    return this.request(`/api/bre/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    });
  }

  async deleteRule(id) {
    return this.request(`/api/bre/rules/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/api/dashboard/stats');
  }
}

const api = new ApiClient();
export default api;
