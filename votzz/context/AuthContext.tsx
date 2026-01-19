import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { LoginResponse, User } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  selectContext: (userId: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('@Votzz:user');
    const storedToken = localStorage.getItem('@Votzz:token');

    if (storedUser && storedToken) {
      api.defaults.headers.authorization = `Bearer ${storedToken}`;
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const processLoginData = (data: LoginResponse) => {
      // Pega o ID do Tenant de forma segura
      const tenantId = data.tenantId || (data as any).tenant?.id || null;
      
      // Tenta pegar o nome do Tenant/Condomínio da resposta
      const tenantData = (data as any).tenant || null;
      const tenantName = (data as any).tenantName || (tenantData ? tenantData.nome : null);

      const userToSave: User = {
        // CORREÇÃO: Removido o 'temp'. Se não houver ID, o backend deve tratar no login.
        id: data.id, 
        nome: data.nome || '',
        name: data.nome || '',
        email: data.email || '',
        role: data.role as any,
        tenantId: tenantId,
        
        // Salvamos o tenant unificado
        tenant: tenantData ? { ...tenantData, nome: tenantName } : (tenantName ? { id: tenantId!, nome: tenantName } : undefined),
        
        // @ts-ignore
        tenantName: tenantName,

        bloco: data.bloco,
        unidade: data.unidade,
        cpf: data.cpf,
        
        block: data.bloco,
        unit: data.unidade,
        whatsapp: (data as any).whatsapp || ''
      };

      setUser(userToSave);
      localStorage.setItem('@Votzz:user', JSON.stringify(userToSave));
      localStorage.setItem('@Votzz:token', data.token || '');
      
      api.defaults.headers.authorization = `Bearer ${data.token}`;

      // Redirecionamento inteligente baseado no papel
      if (data.role === 'ADMIN') navigate('/admin/dashboard');
      else if (data.role === 'AFILIADO') navigate('/affiliate/dashboard');
      else navigate('/dashboard');
  };

  const login = (data: LoginResponse) => {
      processLoginData(data);
  };

  const selectContext = async (userId: string) => {
      try {
          const response = await api.post('/auth/select-context', { userId });
          processLoginData(response.data);
      } catch (error) {
          console.error("Erro ao selecionar contexto", error);
          alert("Erro ao entrar no perfil selecionado.");
          navigate('/login');
      }
  };

  const signOut = () => {
    localStorage.removeItem('@Votzz:user');
    localStorage.removeItem('@Votzz:token');
    setUser(null);
    delete api.defaults.headers.authorization;
    navigate('/login');
  };

  const updateUser = (data: Partial<User>) => {
      if (user) {
          const updatedUser = { ...user, ...data };
          setUser(updatedUser);
          localStorage.setItem('@Votzz:user', JSON.stringify(updatedUser));
      }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, selectContext, signOut, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);