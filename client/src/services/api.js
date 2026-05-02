import axios from 'axios';

// In development: Vite proxies /api → localhost:5000
// In production:  set VITE_API_URL=https://votesecure-6123.onrender.com in Vercel (no /api at the end)
const baseURL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') + '/api'
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('msec_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('msec_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;