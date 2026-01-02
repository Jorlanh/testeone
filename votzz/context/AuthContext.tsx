import React, { createContext, useState, useEffect, useContext } from 'react';
import { LoginResponse, User } from '../types';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ao carregar a página, recupera o usuário salvo com as chaves corretas
    const storedUser = localStorage.getItem('@Votzz:user');
    const storedToken = localStorage.getItem('@Votzz:token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (data: LoginResponse) => {
    const userToSave: User = {
        id: data.id,
        nome: data.nome,
        name: data.nome, 
        email: data.email,
        role: data.role,
        tenantId: data.tenantId,
        
        // Dados adicionais
        bloco: data.bloco,
        unidade: data.unidade,
        cpf: data.cpf,
        
        block: data.bloco,
        unit: data.unidade,
        whatsapp: '' 
    };

    setUser(userToSave);

    localStorage.setItem('@Votzz:user', JSON.stringify(userToSave));
    localStorage.setItem('@Votzz:token', data.token);
  };

  const signOut = () => {
    localStorage.removeItem('@Votzz:user');
    localStorage.removeItem('@Votzz:token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);