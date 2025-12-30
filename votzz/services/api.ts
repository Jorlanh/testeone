// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  // Dica: Em produção, use process.env.REACT_APP_API_URL
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('votzz_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Evita loop de redirecionamento se já estiver na tela de auth
    if (error.response?.status === 401 && !window.location.hash.includes('auth')) {
      localStorage.clear();
      window.location.href = '#/auth';
    }
    return Promise.reject(error);
  }
);

export default api;