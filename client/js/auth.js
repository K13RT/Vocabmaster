// Auth State Management
import { api } from './api.js';
import { supabase } from './utils/supabase.js';

export const auth = {
  user: null,
  isAuthenticated: false,

  async init() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        this.user = {
          id: session.user.id,
          email: session.user.email,
          username: session.user.user_metadata?.username || session.user.email.split('@')[0],
          role: session.user.user_metadata?.role || 'user'
        };
        this.isAuthenticated = true;
        
        // Update API client with Supabase token
        api.setToken(session.access_token);
        return true;
      }
    } catch (e) {
      console.error('Auth init error:', e);
    }

    this.logout();
    return false;
  },

  async login(username, password) {
    // Deprecated: Login is now handled directly in Login.js via Supabase SDK
    // This method is kept for compatibility but should not be used
    console.warn('auth.login is deprecated. Use supabase.auth.signInWithPassword directly.');
    return this.init();
  },

  async register(username, email, password) {
    // Deprecated: Register is now handled directly in Register.js via Supabase SDK
    console.warn('auth.register is deprecated. Use supabase.auth.signUp directly.');
    return this.init();
  },

  async logout() {
    await supabase.auth.signOut();
    this.user = null;
    this.isAuthenticated = false;
    api.setToken(null);
    window.location.hash = '#/login';
  },

  isAdmin() {
    return this.user?.role === 'admin';
  }
};

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    auth.user = {
      id: session.user.id,
      email: session.user.email,
      username: session.user.user_metadata?.username || session.user.email.split('@')[0],
      role: session.user.user_metadata?.role || 'user'
    };
    auth.isAuthenticated = true;
    api.setToken(session.access_token);
  } else if (event === 'SIGNED_OUT') {
    auth.user = null;
    auth.isAuthenticated = false;
    api.setToken(null);
  }
});
