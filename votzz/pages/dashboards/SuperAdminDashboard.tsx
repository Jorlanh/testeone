import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { AdminDashboardStats } from '../../types';
import { Users, Building, DollarSign, Activity, Tag, Plus, Save, ShieldAlert, Zap, Search } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('STATS'); // STATS, COUPONS, MANUAL_CONDO, NEW_ADMIN, USERS

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Painel do Super Admin (God Mode)</h1>
      
      {/* Menu de Navegação */}
      <div className="flex gap-4 mb-8 border-b border-gray-200 pb-1 overflow-x-auto">
        <TabButton label="Visão Geral" active={activeTab === 'STATS'} onClick={() => setActiveTab('STATS')} />
        <TabButton label="Usuários & Acessos" active={activeTab === 'USERS'} onClick={() => setActiveTab('USERS')} />
        <TabButton label="Gerenciar Cupons" active={activeTab === 'COUPONS'} onClick={() => setActiveTab('COUPONS')} />
        <TabButton label="Criar Condomínio" active={activeTab === 'MANUAL_CONDO'} onClick={() => setActiveTab('MANUAL_CONDO')} />
        <TabButton label="Novo Admin Votzz" active={activeTab === 'NEW_ADMIN'} onClick={() => setActiveTab('NEW_ADMIN')} />
      </div>

      {activeTab === 'STATS' && <StatsView />}
      {activeTab === 'USERS' && <UsersManager />}
      {activeTab === 'COUPONS' && <CouponsManager />}
      {activeTab === 'MANUAL_CONDO' && <ManualCondoCreator />}
      {activeTab === 'NEW_ADMIN' && <CreateAdminForm />}
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${active ? 'border-b-2 border-emerald-500 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
    >
      {label}
    </button>
  );
}

// --- 1. VIEW: STATS (Com Monitoramento em Tempo Real) ---
function StatsView() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = () => {
      api.get<AdminDashboardStats>('/admin/dashboard-stats')
         .then(res => setStats(res.data))
         .catch(console.error)
         .finally(() => setLoading(false));
    };

    loadStats();
    // Auto-refresh a cada 30 segundos para monitoramento
    const interval = setInterval(loadStats, 30000); 
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando painel...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* CARD ONLINE MEMBERS */}
      <div className="bg-slate-900 text-white p-6 rounded-lg shadow-lg flex items-center space-x-4 border border-emerald-500 relative overflow-hidden">
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Ao Vivo</span>
        </div>
        <div className="p-3 bg-white/10 rounded-full"><Zap className="w-8 h-8 text-emerald-400" /></div>
        <div>
          <p className="text-emerald-200 text-sm font-medium">Membros Online</p>
          <p className="text-4xl font-bold">{stats?.onlineUsers || 0}</p>
        </div>
      </div>

      <StatCard icon={<Building className="w-8 h-8 text-blue-600" />} title="Total Condomínios" value={stats?.totalTenants || 0} />
      <StatCard icon={<Activity className="w-8 h-8 text-green-600" />} title="Condomínios Ativos" value={stats?.activeTenants || 0} />
      <StatCard icon={<Users className="w-8 h-8 text-purple-600" />} title="Total Cadastrados" value={stats?.totalUsers || 0} />
      <StatCard icon={<DollarSign className="w-8 h-8 text-yellow-600" />} title="MRR Estimado" value={`R$ ${stats?.mrr?.toFixed(2) || '0.00'}`} />
    </div>
  );
}

const StatCard = ({ icon, title, value }: any) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className="p-3 bg-gray-50 rounded-full">{icon}</div>
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// --- 2. VIEW: USERS MANAGER (Listar e Resetar Senha) ---
function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users').then(res => setUsers(res.data));
  }, []);

  const handleResetPassword = async (userId: string) => {
    const newPass = prompt("Digite a nova senha para este usuário:");
    if (!newPass) return;
    
    try {
      await api.patch(`/admin/users/${userId}/force-reset-password`, { newPassword: newPass });
      alert("Senha alterada com sucesso!");
    } catch (err) {
      alert("Erro ao alterar senha.");
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2"><Users size={20}/> Gerenciar Usuários</h3>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input 
            placeholder="Buscar nome ou email..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 p-2 border rounded-lg w-64 bg-gray-50 focus:bg-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Email</th>
              <th className="p-3">Função</th>
              <th className="p-3">Condomínio</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 font-medium text-gray-800">{u.nome}</td>
                <td className="p-3 text-gray-600">{u.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-gray-500">{u.condominio}</td>
                <td className="p-3 text-center">
                  <button 
                    onClick={() => handleResetPassword(u.id)}
                    className="text-emerald-600 hover:text-emerald-800 hover:underline font-medium"
                  >
                    Resetar Senha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- 3. VIEW: COUPONS ---
function CouponsManager() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCode, setNewCode] = useState('');
  const [discount, setDiscount] = useState('');

  const loadCoupons = () => api.get('/admin/coupons').then(res => setCoupons(res.data));

  useEffect(() => { loadCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', { code: newCode, discountPercent: Number(discount) });
      alert('Cupom criado!');
      setNewCode('');
      setDiscount('');
      loadCoupons();
    } catch (err) {
      alert('Erro ao criar cupom.');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Novo Cupom</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Código</label>
            <input required value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} className="w-full p-2 border rounded mt-1 uppercase" placeholder="Ex: PROMO2025" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Desconto (%)</label>
            <input required type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="Ex: 20" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 font-bold">Salvar Cupom</button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Tag size={18}/> Cupons Ativos</h3>
        <ul className="space-y-2">
          {coupons.map(c => (
            <li key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
              <span className="font-mono font-bold text-emerald-700 tracking-wider">{c.code}</span>
              <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm font-bold">{c.discountPercent}% OFF</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// --- 4. VIEW: MANUAL CONDO ---
function ManualCondoCreator() {
  const [form, setForm] = useState({
    condoName: '', cnpj: '', qtyUnits: 30, secretKeyword: '',
    nameSyndic: '', emailSyndic: '', cpfSyndic: '', passwordSyndic: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/create-tenant-manual', form);
      alert('Condomínio e Síndico criados com sucesso!');
      setForm({ ...form, condoName: '', emailSyndic: '' });
    } catch (err: any) {
      alert(err.response?.data || 'Erro ao criar.');
    }
  };

  const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-3xl mx-auto">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800"><Save size={20}/> Cadastro Manual (Acesso Imediato)</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input required name="condoName" placeholder="Nome do Condomínio" onChange={handleChange} className="p-3 border rounded w-full" />
          <input required name="cnpj" placeholder="CNPJ" onChange={handleChange} className="p-3 border rounded w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <input required name="qtyUnits" type="number" placeholder="Qtd Unidades" onChange={handleChange} className="p-3 border rounded w-full" />
            <input required name="secretKeyword" placeholder="Palavra-Chave Secreta" onChange={handleChange} className="p-3 border rounded w-full" />
        </div>
        <div className="border-t border-gray-200 my-4 pt-4 bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Dados do Síndico</p>
            <input required name="nameSyndic" placeholder="Nome Completo" onChange={handleChange} className="p-3 border rounded w-full mb-3 bg-white" />
            <div className="grid grid-cols-2 gap-4">
                <input required name="emailSyndic" type="email" placeholder="E-mail de Login" onChange={handleChange} className="p-3 border rounded w-full bg-white" />
                <input required name="cpfSyndic" placeholder="CPF" onChange={handleChange} className="p-3 border rounded w-full bg-white" />
            </div>
            <input required name="passwordSyndic" type="text" placeholder="Senha Provisória" onChange={handleChange} className="p-3 border rounded w-full mt-3 bg-yellow-50 font-mono text-yellow-800 border-yellow-200 placeholder:text-yellow-600/50" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold shadow-md transition-all">Criar Acesso</button>
      </form>
    </div>
  );
}

// --- 5. VIEW: NEW ADMIN ---
function CreateAdminForm() {
  const [form, setForm] = useState({ nome: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/create-admin', form);
      alert('Novo Administrador Votzz criado com sucesso!');
      setForm({ nome: '', email: '', password: '' });
    } catch (err: any) {
      alert(err.response?.data || 'Erro ao criar admin.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-red-100 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6 text-red-700 bg-red-50 p-4 rounded-lg">
        <ShieldAlert size={28}/> 
        <div>
          <h3 className="text-lg font-bold">Criar Novo Super Admin</h3>
          <p className="text-xs opacity-80">Acesso irrestrito ao sistema.</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input required placeholder="Nome Completo" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-3 border rounded-lg" />
        <input required type="email" placeholder="E-mail Corporativo" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-3 border rounded-lg" />
        <input required type="password" placeholder="Senha Forte" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-3 border rounded-lg" />
        <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-200 transition-all">Criar Acesso Admin</button>
      </form>
    </div>
  );
}