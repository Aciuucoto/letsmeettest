import axios from 'axios';
import config from '../config';

const API_URL = config.apiUrl;

const userService = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/register`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/login`, credentials);
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.put(
        `${API_URL}/api/users/profile`,
        userData,
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default userService; 