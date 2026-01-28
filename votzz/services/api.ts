import axios from 'axios';

// Limpa a URL base e define o padrão
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
      // Busca o ID em ambas as estruturas possíveis no seu User objeto
      const tenantId = user.tenantId || (user.tenant && user.tenant.id);
      
      // BLOQUEIO RIGOROSO: Só envia o header se for um ID real
      // Impede o envio das strings literais "null", "undefined" ou "temp"
      if (tenantId && !['temp', 'null', 'undefined', ''].includes(String(tenantId))) {
        config.headers['X-Tenant-ID'] = String(tenantId);
      } else {
        // Se o contexto for inválido, removemos o header para evitar erro 400 no backend
        delete config.headers['X-Tenant-ID'];
      }
    } catch (e) {
      console.error("Erro ao parsear usuário para injeção de Tenant", e);
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Redireciona para login se o token for inválido (401) OU proibido (403)
    // 403 acontece quando o usuário existe mas mudou permissão/email e o token antigo não vale mais
    if ((error.response?.status === 401 || error.response?.status === 403) && !window.location.hash.includes('auth')) {
      console.warn("Sessão expirada ou credenciais alteradas. Redirecionando para login...");
      localStorage.removeItem('@Votzz:token');
      localStorage.removeItem('@Votzz:user');
      window.location.href = '#/auth/login';
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;