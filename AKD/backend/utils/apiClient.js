// API Client Utility Functions for Frontend

const API_BASE_URL = 'http://localhost:3000/api';

// Storage for JWT token
class AuthService {
  static getToken() {
    return localStorage.getItem('authToken');
  }

  static setToken(token) {
    localStorage.setItem('authToken', token);
  }

  static removeToken() {
    localStorage.removeItem('authToken');
  }

  static getAuthHeader() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  static isAuthenticated() {
    return !!this.getToken();
  }
}

// User API Functions
const UserAPI = {
  async register(email, password, firstName, lastName = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      AuthService.setToken(data.token);
      return data.user;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      AuthService.setToken(data.token);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout() {
    AuthService.removeToken();
  },

  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: { ...AuthService.getAuthHeader(), 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  async updateProfile(firstName, lastName) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: { ...AuthService.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
};

// Letter API Functions
const LetterAPI = {
  async createLetter(recipientName, recipientEmail, subject, content) {
    try {
      const response = await fetch(`${API_BASE_URL}/letters`, {
        method: 'POST',
        headers: { ...AuthService.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientName, recipientEmail, subject, content })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create letter');
      }

      return await response.json();
    } catch (error) {
      console.error('Create letter error:', error);
      throw error;
    }
  },

  async getLetters() {
    try {
      const response = await fetch(`${API_BASE_URL}/letters`, {
        headers: { ...AuthService.getAuthHeader(), 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch letters');
      }

      return await response.json();
    } catch (error) {
      console.error('Get letters error:', error);
      throw error;
    }
  },

  async getLetter(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/letters/${id}`, {
        headers: { ...AuthService.getAuthHeader(), 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch letter');
      }

      return await response.json();
    } catch (error) {
      console.error('Get letter error:', error);
      throw error;
    }
  },

  async updateLetter(id, recipientName, recipientEmail, subject, content, status = 'draft') {
    try {
      const response = await fetch(`${API_BASE_URL}/letters/${id}`, {
        method: 'PUT',
        headers: { ...AuthService.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientName, recipientEmail, subject, content, status })
      });

      if (!response.ok) {
        throw new Error('Failed to update letter');
      }

      return await response.json();
    } catch (error) {
      console.error('Update letter error:', error);
      throw error;
    }
  },

  async deleteLetter(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/letters/${id}`, {
        method: 'DELETE',
        headers: { ...AuthService.getAuthHeader(), 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to delete letter');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete letter error:', error);
      throw error;
    }
  },

  async generatePDF(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/letters/${id}/pdf`, {
        headers: { ...AuthService.getAuthHeader() }
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `letter-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Generate PDF error:', error);
      throw error;
    }
  },

  async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/letters/stats/dashboard`, {
        headers: { ...AuthService.getAuthHeader(), 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  }
};

// Export for use in HTML
window.AuthService = AuthService;
window.UserAPI = UserAPI;
window.LetterAPI = LetterAPI;
