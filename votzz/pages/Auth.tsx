
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { User, Lock, Mail, Home } from 'lucide-react';
import { MockService } from '../services/mockDataService';
import { Logo } from '../components/Logo';

interface AuthProps {
  onLogin: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  
  useEffect(() => {
    if (location.state?.isRegister) {
      setIsLogin(false);
    }
  }, [location.state]);

  const [step, setStep] = useState(1); // 1: Creds, 2: 2FA
  const [email, setEmail] = useState('admin@condo.com');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      setStep(2); // Move to 2FA
    }, 1000);
  };

  const verify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await MockService.login(email);
      setTimeout(() => {
        onLogin(user);
      }, 1000);
    } catch (err) {
      alert('Erro ao autenticar');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-12 flex flex-col items-center justify-center border-b-4 border-emerald-500">
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <Logo theme="light" size="lg" showSlogan={true} />
          </Link>
          <p className="text-slate-400 text-sm mt-6 font-medium tracking-wide uppercase">Plataforma de Decisão Condominial</p>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800">
                  {isLogin ? 'Acessar Conta' : 'Novo Cadastro'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {isLogin ? 'Entre com seus dados cadastrados.' : 'Validação de identidade obrigatória.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                    <div className="relative">
                      <Home className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                        placeholder="Apto 101 Bloco A"
                      />
                    </div>
                  </div>
                </>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar e Validar')}
              </button>

              <div className="text-center mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                >
                  {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tenho conta. Entrar'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={verify2FA} className="space-y-6">
               <div className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4 animate-pulse">
                  <Lock className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">Verificação de Segurança</h2>
                <p className="text-sm text-slate-500 mt-2">
                  Enviamos um código SMS para o número final **88.
                </p>
              </div>

              <div>
                <input 
                  type="text" 
                  className="w-full text-center text-3xl tracking-[0.5em] font-bold py-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                  placeholder="000000"
                  maxLength={6}
                  defaultValue="123456"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Confirmar Acesso'}
              </button>
              
               <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium"
                >
                  Voltar
                </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
