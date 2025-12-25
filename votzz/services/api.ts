const API_BASE_URL = 'http://localhost:8080/api';

// IDs fixos para teste enquanto o login é simulado no front
const DEFAULT_TENANT = '4f0e695d-7973-4537-8e6d-74d306b3f71c'; 
const DEFAULT_USER = '1';

export const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'X-Tenant-ID': DEFAULT_TENANT,
        'X-Simulated-User': DEFAULT_USER,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Erro na busca de dados');
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-Tenant-ID': DEFAULT_TENANT,
        'X-Simulated-User': DEFAULT_USER,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao salvar dados');
    return response.json();
  },

  async patch(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'X-Tenant-ID': DEFAULT_TENANT,
        'X-Simulated-User': DEFAULT_USER,
        'Content-Type': 'application/json',
      },
      body: typeof data === 'string' ? data : JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao atualizar dados');
    return response.json();
  },

  // ADICIONADO: Método DELETE que estava faltando e causando erro
  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'X-Tenant-ID': DEFAULT_TENANT,
        'X-Simulated-User': DEFAULT_USER,
        'Content-Type': 'application/json',
      }
    });
    if (!response.ok) throw new Error('Erro ao excluir dados');
    return response.status === 204 ? null : response.json();
  }
};