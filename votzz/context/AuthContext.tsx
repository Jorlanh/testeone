// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, LoginResponse, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Recupera sessão ao recarregar a página (F5)
  useEffect(() => {
    const storedToken = localStorage.getItem('votzz_token');
    const storedUser = localStorage.getItem('votzz_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erro ao recuperar usuário do storage", e);
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = (data: LoginResponse) => {
    // Mapeia os dados vindos do Backend Java para o objeto User do Frontend
    const userData: User = {
      id: data.id,            
      nome: data.nome,
      name: data.nome,        // Compatibilidade
      email: data.email,
      role: data.role,        
      tenantId: data.tenantId,
      
      // Inicializa campos vazios para evitar undefined
      cpf: '',
      whatsapp: '',
      unit: '',
      unidade: '',
      bloco: ''
    };
    
    setUser(userData);
    setToken(data.token);
    localStorage.setItem('votzz_token', data.token);
    localStorage.setItem('votzz_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
    window.location.href = '#/auth'; 
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};