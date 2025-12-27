// src/pages/Auth.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Home, User as UserIcon, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Auth: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('root@votzz.com');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [unidade, setUnidade] = useState('');
  const [secretKeyword, setSecretKeyword] = useState('');
  const [tenantId, setTenantId] = useState('d290f1ee-6c54-4b01-90e6-d701748f0851'); // ID do Solar Votzz do seu DML

  useEffect(() => {
    if (location.state?.isRegister) {
      setIsLogin(false);
    }
  }, [location.state]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        login(response.data);
        
        const role = response.data.role;
        if (role === 'ADMIN') navigate('/admin/dashboard');
        else if (role === 'AFILIADO') navigate('/affiliate/dashboard');
        else navigate('/dashboard');
      } else {
        await api.post('/users/register-resident', {
          nome, email, password, cpf, unidade, tenantId, secretKeyword
        });
        alert('Cadastro realizado com sucesso! Faça login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro na operação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 p-12 flex flex-col items-center border-b-4 border-emerald-500">
          <Link to="/"><Logo theme="light" size="lg" showSlogan={true} /></Link>
        </div>
        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-5">
            <h2 className="text-xl font-semibold text-slate-800 text-center">
              {isLogin ? 'Acessar Conta' : 'Novo Cadastro'}
            </h2>

            {!isLogin && (
              <input type="text" placeholder="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 border rounded-lg" required />
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 p-3 border rounded-lg" required />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input type="password" placeholder="Sua Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 p-3 border rounded-lg" required />
            </div>

            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="CPF" value={cpf} onChange={e => setCpf(e.target.value)} className="p-3 border rounded-lg" required />
                  <input type="text" placeholder="Unidade" value={unidade} onChange={e => setUnidade(e.target.value)} className="p-3 border rounded-lg" required />
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                   <label className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1"><ShieldCheck size={12}/> Palavra-Chave do Condomínio</label>
                   <input type="password" value={secretKeyword} onChange={e => setSecretKeyword(e.target.value)} className="w-full mt-1 p-2 border-emerald-200 rounded" required />
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-md">
              {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
            </button>

            <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-sm text-emerald-600 hover:underline">
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tenho conta. Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;