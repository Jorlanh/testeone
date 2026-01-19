import axios from 'axios';

// Garante uma URL limpa sem duplicidade de vírgulas
const getCleanBaseURL = () => {
  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.includes('http')) {
    return envUrl.split(',')[0].trim();
  }
  return 'http://localhost:8080/api';
};

export const api = axios.create({
  baseURL: getCleanBaseURL(),
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
      const tenantId = user.tenantId || (user.tenant && user.tenant.id);
      
      // BLOQUEIO DE IDs INVÁLIDOS: Evita erro 400 no backend
      if (tenantId && !['temp', 'null', 'undefined', ''].includes(String(tenantId))) {
        config.headers['X-Tenant-ID'] = tenantId;
      }
    } catch (e) {
      console.error("Erro ao parsear usuário", e);
    }
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.hash.includes('auth')) {
      localStorage.clear();
      window.location.href = '#/auth/login';
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;