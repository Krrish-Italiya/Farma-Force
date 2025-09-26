const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Performance API functions
export const performanceAPI = {
  // Get performance data for charts and analytics
  getPerformanceData: async (company = 'FarmaForce', period = 'monthly') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trends/performance?company=${company}&period=${period}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch performance data');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching performance data:', error);
      throw error;
    }
  },

  // Get daily performance data for charts
  getDailyPerformanceData: async (company = 'FarmaForce') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/trends/performance?company=${company}&period=daily`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch daily performance data');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching daily performance data:', error);
      throw error;
    }
  }
};

// Reports API
/**
 * @typedef {Object} KPIEmailPayload
 * @property {string=} period
 * @property {string=} company
 * @property {string=} userName
 * @property {Array<object>=} alerts
 */
export const reportsAPI = {
  /**
   * @param {KPIEmailPayload} payload
   */
  emailKPIReport: async ({ period = 'weekly', company = 'FarmaForce', userName, alerts = /** @type {Array<object>} */ ([]) }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE_URL}/api/reports/kpi/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ period, company, userName, alerts })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to email report');
    return data;
  },
  downloadKPIReport: async ({ period = 'weekly', company = 'FarmaForce' }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const url = `${API_BASE_URL}/api/reports/kpi/download?period=${encodeURIComponent(period)}&company=${encodeURIComponent(company)}`;
    const response = await fetch(url, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    if (!response.ok) {
      let message = 'Failed to download report';
      try { const d = await response.json(); message = d.message || message; } catch {}
      throw new Error(message);
    }
    const blob = await response.blob();
    const fileUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = 'KPI_Report.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(fileUrl);
  }
};

// Alerts API functions
export const alertsAPI = {
  // Get all alerts
  getAlerts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch alerts');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  // Create a new alert
  createAlert: async (alertData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create alert');
      }
      
      return data;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  },

  // Update alert selection status
  updateAlert: async (id, isSelected) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSelected }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update alert');
      }
      
      return data;
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  },

  // Delete an alert
  deleteAlert: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete alert');
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  }
};

export const communicationAPI = {
  getHistory: async (page = 1, limit = 20) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE_URL}/api/communication/history?page=${page}&limit=${limit}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch history');
    return data;
  }
};

export const userAPI = {
  getProfile: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
    return data;
  },
  updateNotifications: async (payload) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE_URL}/api/user/update-notifications`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update notifications');
    return data;
  }
};

// Utility function to format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Utility function to format percentage
export const formatPercentage = (value) => {
  return `${Math.round(value)}%`;
};

// Utility function to calculate growth percentage
export const calculateGrowth = (current, previous) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};
