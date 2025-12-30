import React, { useState } from 'react';
import { api } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { TrendingUp, User, Mail, Lock, Phone, CreditCard, DollarSign } from 'lucide-react';

export function AffiliateRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    chavePix: '' // Obrigatório para o afiliado receber
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }

    setLoading(true);
    try {
      // Endpoint criado no Backend para cadastro de afiliados
      await api.post('/auth/register-affiliate', formData);
      alert("Cadastro de parceiro realizado com sucesso! Faça login para acessar seu painel.");
      navigate('/login');
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data || "Erro ao realizar cadastro. Verifique os dados.";
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Link to="/"><Logo theme="dark" /></Link>
      </div>
      
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="text-emerald-500 w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white">Seja um Parceiro Votzz</h2>
          <p className="text-slate-400 mt-2">Ganhe comissões recorrentes indicando condomínios.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input required name="nome" placeholder="Seu nome" className="w-full bg-slate-900 text-white rounded-lg pl-10 p-3 border border-slate-700 focus:border-emerald-500 outline-none" onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">CPF</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                <input required name="cpf" placeholder="000.000.000-00" className="w-full bg-slate-900 text-white rounded-lg pl-10 p-3 border border-slate-700 focus:border-emerald-500 outline-none" onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                <input required name="whatsapp" placeholder="(00) 00000-0000" className="w-full bg-slate-900 text-white rounded-lg pl-10 p-3 border border-slate-700 focus:border-emerald-500 outline-none" onChange={handleChange} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input type="email" required name="email" placeholder="seu@email.com" className="w-full bg-slate-900 text-white rounded-lg pl-10 p-3 border border-slate-700 focus:border-emerald-500 outline-none" onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Chave PIX (Para receber)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
              <input required name="chavePix" placeholder="CPF, Email ou Aleatória" className="w-full bg-slate-900 text-white rounded-lg pl-10 p-3 border border-slate-700 focus:border-emerald-500 outline-none" onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                <input type="password" required name="password" className="w-full bg-slate-900 text-white rounded-lg pl-10 p-3 border border-slate-700 focus:border-emerald-500 outline-none" onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                <input type="password" required name="confirmPassword" className="w-full bg-slate-900 text-white rounded-lg pl-10 p-3 border border-slate-700 focus:border-emerald-500 outline-none" onChange={handleChange} />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-emerald-500/20 mt-4"
          >
            {loading ? 'Criando conta...' : 'Criar Conta de Parceiro'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/login" className="text-slate-400 hover:text-white text-sm">
            Já tem conta? Fazer Login
          </Link>
        </div>
      </div>
    </div>
  );
}