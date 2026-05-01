import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('msec_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(res => { setUser(res.data.user); setCollege(res.data.college); })
        .catch(() => { localStorage.removeItem('msec_token'); })
        .finally(() => setLoading(false));
    } else {
      // Still fetch college info for login page
      api.get('/admin/college').then(r => setCollege(r.data.college)).catch(() => {});
      setLoading(false);
    }
  }, []);

  function login(userData, token) {
    localStorage.setItem('msec_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('msec_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  }

  function refreshUser() {
    return api.get('/auth/me').then(res => { setUser(res.data.user); return res.data.user; });
  }

  const isAdmin     = user?.role === 'admin';
  const isCandidate = user?.role === 'candidate';
  const isVoter     = user?.role === 'voter';

  return (
    <AuthContext.Provider value={{ user, college, loading, login, logout, refreshUser, isAdmin, isCandidate, isVoter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
