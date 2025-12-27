// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, LoginResponse, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('votzz_token');
    const storedUser = localStorage.getItem('votzz_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (data: LoginResponse) => {
    // Mapeia os dados do Backend Java para a interface User completa
    const userData: User = {
      id: 'id-extracted-from-token', 
      nome: data.nome,
      name: data.nome, // Preenche ambos para compatibilidade
      email: data.email,
      role: data.role,
      tenantId: data.tenantId,
      cpf: '',
      whatsapp: '',
      unit: '',
      unidade: ''
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
    window.location.href = '#/login';
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