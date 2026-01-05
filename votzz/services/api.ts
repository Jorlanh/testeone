// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Votzz:token');
  const storedUser = localStorage.getItem('@Votzz:user');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      // CORREÇÃO: Tenta pegar o ID do tenant de qualquer lugar (raiz ou objeto interno)
      const tenantId = user.tenantId || (user.tenant && user.tenant.id);
      if (tenantId) {
        config.headers['X-Tenant-ID'] = tenantId;
      }
    } catch (e) {
      console.error("Erro ao parsear usuário do localStorage", e);
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.hash.includes('auth')) {
      localStorage.removeItem('@Votzz:token');
      localStorage.removeItem('@Votzz:user');
      window.location.href = '#/auth';
    }
    return Promise.reject(error);
  }
);

export default api;