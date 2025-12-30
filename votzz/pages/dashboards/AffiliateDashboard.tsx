import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AffiliateDashboardDTO } from '../../types';
import { Wallet, Link as LinkIcon, TrendingUp, Settings, Save, Lock, DollarSign, Users } from 'lucide-react';

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('STATS'); // STATS, PROFILE

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Painel do Parceiro Votzz</h1>
      <p className="text-slate-500 mb-8">Acompanhe seus ganhos e gerencie sua conta.</p>
      
      {/* Menu de Abas */}
      <div className="flex gap-4 mb-8 border-b border-slate-200">
        <button onClick={() => setActiveTab('STATS')} className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'STATS' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500'}`}>
           Visão Geral
        </button>
        <button onClick={() => setActiveTab('PROFILE')} className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'PROFILE' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-slate-500'}`}>
           Meus Dados
        </button>
      </div>

      {activeTab === 'STATS' && <AffiliateStats user={user} />}
      {activeTab === 'PROFILE' && <AffiliateProfile />}
    </div>
  );
}

// --- SUB-COMPONENTE: Stats (Original) ---
function AffiliateStats({ user }: { user: any }) {
  const [data, setData] = useState<AffiliateDashboardDTO | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;
      try {
        const response = await api.get<AffiliateDashboardDTO>(`/afiliado/${user.id}/dashboard`);
        setData(response.data);
      } catch (error) {
        console.error('Erro ao carregar dashboard', error);
      }
    };
    fetchDashboard();
  }, [user]);

  if (!data) return <div>Carregando estatísticas...</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-emerald-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span>Saldo Disponível (Saque)</span>
            <Wallet />
          </div>
          <span className="text-4xl font-bold">R$ {data.saldoDisponivel.toFixed(2)}</span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4 text-slate-500">
            <span>Saldo Futuro (Bloqueado)</span>
            <TrendingUp />
          </div>
          <span className="text-4xl font-bold text-slate-800">R$ {data.saldoFuturo.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" /> O teu Link de Indicação
        </h3>
        <div className="flex gap-4">
          <input 
            readOnly 
            value={data.linkIndicacao}
            className="flex-1 p-3 bg-slate-100 rounded border border-slate-300 text-slate-600"
          />
          <button 
            onClick={() => navigator.clipboard.writeText(data.linkIndicacao)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded font-medium"
          >
            Copiar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE: Perfil (Novo) ---
function AffiliateProfile() {
  const [form, setForm] = useState({
    email: '',
    whatsapp: '',
    chavePix: '',
    password: '' 
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/afiliado/profile', form);
      alert('Dados atualizados com sucesso!');
      setForm({ ...form, password: '' }); 
    } catch (err: any) {
      alert(err.response?.data || 'Erro ao atualizar.');
    }
  };

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-2xl">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings size={20}/> Editar Perfil e Recebimento</h3>
      <form onSubmit={handleUpdate} className="space-y-5">
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">E-mail de Acesso</label>
          <input name="email" type="email" placeholder="Novo e-mail (opcional)" onChange={handleChange} className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white transition-colors" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp</label>
            <input name="whatsapp" placeholder="(00) 00000-0000" onChange={handleChange} className="w-full p-3 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-bold text-emerald-700 mb-1">Chave PIX (Recebimento)</label>
            <input name="chavePix" placeholder="CPF/Email/Aleatória" onChange={handleChange} className="w-full p-3 border-emerald-200 rounded-lg bg-emerald-50/50" />
          </div>
        </div>

        <hr className="border-slate-100 my-4"/>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2"><Lock size={14}/> Alterar Senha</label>
          <input name="password" type="password" placeholder="Digite nova senha apenas se quiser alterar" onChange={handleChange} className="w-full p-3 border rounded-lg" />
        </div>

        <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 flex items-center justify-center gap-2">
          <Save size={18}/> Salvar Alterações
        </button>
      </form>
    </div>
  );
}