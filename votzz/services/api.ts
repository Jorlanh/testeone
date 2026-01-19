import axios from 'axios';

export const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api',
  // REMOVIDO: headers: { 'Content-Type': 'application/json' }
  // MOTIVO: O Axios define isso automaticamente. Se deixarmos fixo, quebra o upload de arquivos (PDF).
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
      // Garante que pega o ID do tenant independente da estrutura do objeto salvo
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
    // Redireciona para login se o token for inválido/expirado (Erro 401)
    if (error.response?.status === 401 && !window.location.hash.includes('auth')) {
      localStorage.removeItem('@Votzz:token');
      localStorage.removeItem('@Votzz:user');
      // Recarrega a página para limpar estados de memória
      window.location.href = '#/auth/login';
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;