// Auth State Management
import { api } from './api.js';

export const auth = {
  user: null,
  isAuthenticated: false,

  async init() {
    try {
      const data = await api.getMe();
      if (data && data.user) {
        this.user = data.user;
        this.isAuthenticated = true;
        return true;
      }
    } catch (e) {
      // console.error('Auth init error:', e);
    }

    this.user = null;
    this.isAuthenticated = false;
    return false;
  },

  async login(username, password) {
    const data = await api.login(username, password);
    this.user = data.user;
    this.isAuthenticated = true;
    return true;
  },

  async register(username, email, password) {
    const data = await api.register(username, email, password);
    this.user = data.user;
    this.isAuthenticated = true;
    return true;
  },

  async logout() {
    await api.logout();
    this.user = null;
    this.isAuthenticated = false;
    window.location.hash = '#/login';
  },

  isAdmin() {
    return this.user?.role === 'admin';
  }
};
