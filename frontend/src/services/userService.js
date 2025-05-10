import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const userService = {
  // Register a new user
  register: async (userData) => {
    const response = await axios.post(`${API_URL}/users/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/users/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
  },

  // Get current user profile
  getProfile: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/users/profile`, userData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get user by ID
  getUser: async (userId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Get current user
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    if (token) {
      return JSON.parse(atob(token.split('.')[1]));
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  }
};

export default userService; 