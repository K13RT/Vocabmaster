// Auth State Management
import { api } from './api.js';

export const auth = {
  user: null,
  isAuthenticated: false,

  async init() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Pre-check expiry and refresh if needed
    const exp = decodeTokenExp(token);
    const now = Math.floor(Date.now() / 1000);
    if (exp && exp - 60 < now) {
      const refreshed = await api.tryRefresh();
      if (!refreshed) {
        this.logout();
        return false;
      }
    }

    try {
      const data = await api.getMe();
      this.user = data.user;
      this.isAuthenticated = true;
      return true;
    } catch {
      this.logout();
      return false;
    }
  },

  async login(username, password) {
    const data = await api.login(username, password);
    this.user = data.user;
    this.isAuthenticated = true;
    return data;
  },

  async register(username, email, password) {
    const data = await api.register(username, email, password);
    this.user = data.user;
    this.isAuthenticated = true;
    return data;
  },

  logout() {
    api.logout();
    this.user = null;
    this.isAuthenticated = false;
    window.location.hash = '#/login';
  },

  isAdmin() {
    return this.user?.role === 'admin';
  }
};

function decodeTokenExp(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp;
  } catch (e) {
    return null;
  }
}
