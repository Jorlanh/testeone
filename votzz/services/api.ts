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
      // Garante que o ID do condomínio seja enviado para o backend identificar o banco de dados
      if (user.tenantId) {
        config.headers['X-Tenant-ID'] = user.tenantId;
      }
    } catch (e) {
      console.error("Erro ao recuperar dados do usuário", e);
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se o backend retornar 401 ou 403 e não estivermos na tela de login, desloga
    if ((error.response?.status === 401 || error.response?.status === 403) && 
        !window.location.href.includes('/auth')) {
      localStorage.removeItem('@Votzz:token');
      localStorage.removeItem('@Votzz:user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;