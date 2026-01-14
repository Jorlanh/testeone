import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { LoginResponse, User, LoginCredentials } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
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

  const handleLoginSuccess = (data: LoginResponse) => {
      const userToSave: User = {
        id: data.id || 'temp',
        nome: data.nome || '',
        name: data.nome || '', 
        email: data.email || '',
        role: data.role as any,
        tenantId: data.tenantId,
        
        bloco: data.bloco,
        unidade: data.unidade,
        cpf: data.cpf,
        
        block: data.bloco,
        unit: data.unidade,
        whatsapp: '' 
      };

      setUser(userToSave);
      localStorage.setItem('@Votzz:user', JSON.stringify(userToSave));
      localStorage.setItem('@Votzz:token', data.token || '');
      
      api.defaults.headers.authorization = `Bearer ${data.token}`;

      if (data.role === 'ADMIN') navigate('/admin/dashboard');
      else if (data.role === 'AFILIADO') navigate('/affiliate/dashboard');
      else navigate('/dashboard');
  };

  const login = async ({ email, password }: LoginCredentials) => {
    try {
      // Tenta login. Se houver múltiplos, o backend retorna multipleProfiles: true
      const response = await api.post('/auth/login', { login: email, password });
      
      if (response.data.multipleProfiles) {
          // Salva as opções no state da navegação e vai para a tela de seleção
          navigate('/select-context', { state: { options: response.data.profiles } });
          return;
      }

      handleLoginSuccess(response.data);

    } catch (error) {
      throw error;
    }
  };

  const selectContext = async (userId: string) => {
      try {
          // Chama o endpoint específico ou o login com ID selecionado
          const response = await api.post('/auth/select-context', { userId });
          handleLoginSuccess(response.data);
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