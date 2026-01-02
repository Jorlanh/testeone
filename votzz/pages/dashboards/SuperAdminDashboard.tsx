import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { AdminDashboardStats, User } from '../../types';
import { 
  Users, Building, DollarSign, Tag, Plus, Save, 
  ShieldAlert, Zap, Search, Folder, Eye, EyeOff, Lock, UserPlus, Trash2, Activity, UserCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('STATS');
  const { user: currentUser } = useAuth();

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Painel Super Admin <span className="text-emerald-500">God Mode</span></h1>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px] mt-1">Controle de Infraestrutura Global Votzz</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Sistema Operacional</span>
        </div>
      </div>
      
      {/* Navegação Principal */}
      <div className="flex gap-2 mb-8 bg-white p-2 rounded-3xl shadow-sm border border-slate-100 overflow-x-auto scrollbar-hide">
        <TabBtn label="Dashboard" icon={<Zap size={18}/>} active={activeTab === 'STATS'} onClick={() => setActiveTab('STATS')} />
        <TabBtn label="Gestão de Pastas" icon={<Folder size={18}/>} active={activeTab === 'USERS'} onClick={() => setActiveTab('USERS')} />
        <TabBtn label="Gerador de Cupons" icon={<Tag size={18}/>} active={activeTab === 'COUPONS'} onClick={() => setActiveTab('COUPONS')} />
        <TabBtn label="Ativar Condomínio" icon={<Building size={18}/>} active={activeTab === 'MANUAL_CONDO'} onClick={() => setActiveTab('MANUAL_CONDO')} />
        <TabBtn label="Novo Admin Votzz" icon={<ShieldAlert size={18}/>} active={activeTab === 'NEW_ADMIN'} onClick={() => setActiveTab('NEW_ADMIN')} />
        <TabBtn label="Meu Perfil" icon={<UserCircle size={18}/>} active={activeTab === 'MY_PROFILE'} onClick={() => setActiveTab('MY_PROFILE')} />
      </div>

      <div className="transition-all duration-300">
        {activeTab === 'STATS' && <StatsView />}
        {activeTab === 'USERS' && <OrganizedUsersView />}
        {activeTab === 'COUPONS' && <CouponsManager />}
        {activeTab === 'MANUAL_CONDO' && <ManualCondoCreator />}
        {activeTab === 'NEW_ADMIN' && <CreateAdminForm />}
        {activeTab === 'MY_PROFILE' && <AdminProfileView user={currentUser} />}
      </div>
    </div>
  );
}

function TabBtn({ label, icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${active ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 hover:bg-slate-50'}`}>
      {icon} {label}
    </button>
  );
}

// --- 1. MÉTRICAS E LAG REAL ---
function StatsView() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [latency, setLatency] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const start = Date.now();
      try {
        const res = await api.get('/admin/dashboard-stats');
        setLatency(Date.now() - start);
        setStats(res.data);
      } catch (err) { console.error("Erro ao carregar stats:", err); }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest">Sincronizando Dados Mestres...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex items-center space-x-5 border-b-8 border-blue-500">
          <div className="p-4 bg-blue-500/20 rounded-3xl text-blue-400"><Activity size={40} /></div>
          <div>
            <p className="text-blue-200/50 text-[10px] font-black uppercase tracking-widest mb-1">Latência da Rede</p>
            <p className={`text-4xl font-black ${latency > 200 ? 'text-red-400' : 'text-emerald-400'}`}>{latency}ms</p>
          </div>
        </div>
        <StatCard icon={<Building size={28}/>} color="blue" title="Condomínios" value={stats?.totalTenants || 0} />
        <StatCard icon={<Users size={28}/>} color="purple" title="Usuários Totais" value={stats?.totalUsers || 0} />
        <StatCard icon={<DollarSign size={28}/>} color="emerald" title="MRR Estimado" value={`R$ ${stats?.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
      </div>
    </div>
  );
}

const StatCard = ({ icon, title, value, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center space-x-5 hover:shadow-xl transition-all group">
    <div className={`p-5 bg-${color}-50 text-${color}-600 rounded-3xl group-hover:scale-110 transition-transform`}>{icon}</div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

// --- 2. GESTÃO DE PASTAS ---
function OrganizedUsersView() {
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/organized-users').then(res => setData(res.data)).catch(console.error);
  }, []);

  if (!data) return <div className="p-20 text-center animate-pulse text-slate-400 font-black">Indexando pastas de usuários...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Search size={20} className="text-slate-300 ml-2" />
        <input className="w-full outline-none font-medium text-slate-600" placeholder="Pesquisar por nome, CPF ou pasta..." onChange={e => setSearch(e.target.value)} />
      </div>

      <details className="bg-indigo-900 text-white rounded-[2rem] border border-indigo-800 shadow-xl group overflow-hidden" open>
        <summary className="p-6 cursor-pointer flex justify-between items-center hover:bg-indigo-800/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl"><Users /></div>
            <div>
                <h3 className="font-black text-lg">Pasta: Parceiros Afiliados</h3>
                <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest">Usuários Globais de Venda</p>
            </div>
          </div>
          <Plus className="group-open:rotate-45 transition-transform" />
        </summary>
        <div className="p-6 bg-white text-slate-800">
          <UserTable users={data.afiliados} search={search} />
        </div>
      </details>

      <div className="grid grid-cols-1 gap-4">
        {Object.entries(data.pastas).map(([nomeCondo, moradores]: any) => (
          <details key={nomeCondo} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm group overflow-hidden">
            <summary className="p-6 cursor-pointer flex justify-between items-center hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Folder /></div>
                <div>
                    <h3 className="font-black text-slate-800">{nomeCondo}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{moradores.length} Membros Detectados</p>
                </div>
              </div>
              <Plus className="group-open:rotate-45 transition-transform text-slate-300" />
            </summary>
            <div className="p-6 border-t border-slate-50">
              <UserTable users={moradores} search={search} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

const UserTable = ({ users, search }: any) => {
  const filtered = users.filter((u: any) => 
    u.nome.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.cpf?.includes(search)
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-50">
            <th className="pb-4 px-2">Identificação</th>
            <th className="pb-4 px-2">Documento / Contato</th>
            <th className="pb-4 px-2">Nível</th>
            <th className="pb-4 px-2">Unidade</th>
            <th className="pb-4 px-2 text-center">Gestão</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {filtered.map((u: any) => (
            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="py-4 px-2">
                  <div className="font-black text-slate-800 text-sm">{u.nome}</div>
                  <div className="text-xs text-slate-400 font-medium">{u.email}</div>
              </td>
              <td className="py-4 px-2">
                  <div className="font-mono text-[10px] bg-slate-100 inline-block px-2 py-0.5 rounded text-slate-600 mb-1">{u.cpf || '---'}</div>
                  <div className="text-xs font-bold text-emerald-600">{u.whatsapp || 'Sem Tel'}</div>
              </td>
              <td className="py-4 px-2">
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-tighter uppercase ${u.role === 'SINDICO' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  {u.role}
                </span>
              </td>
              <td className="py-4 px-2 font-black text-slate-700 text-xs">{u.unidade ? `${u.bloco || ''} - ${u.unidade}` : 'ADM'}</td>
              <td className="py-4 px-2 text-center">
                <button className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- 3. CUPONS EM LOTE ---
function CouponsManager() {
  const [form, setForm] = useState({ code: '', discount: '', quantity: 1 });
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', form);
      alert(`${form.quantity} cupons gerados com sucesso!`);
    } catch (err) { alert('Erro ao gerar cupons.'); }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
         <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-emerald-600"><Tag size={28}/> Gerador de Lote</h3>
         <form onSubmit={handleCreate} className="space-y-6">
           <input required placeholder="CÓDIGO PREFIXO" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono text-xl tracking-[0.3em] focus:ring-2 focus:ring-emerald-500" />
           <div className="grid grid-cols-2 gap-4">
             <input required type="number" placeholder="% Desconto" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
             <input required type="number" placeholder="Quantidade" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold" />
           </div>
           <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">Criar Lote de Cupons</button>
         </form>
    </div>
  );
}

// --- 4. ATIVAÇÃO MANUAL (COM OLHINHO E CONFIRMAÇÃO) ---
function ManualCondoCreator() {
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ 
    condoName: '', cnpj: '', qtyUnits: 30, secretKeyword: '', 
    nameSyndic: '', emailSyndic: '', cpfSyndic: '', phoneSyndic: '', 
    passwordSyndic: '', confirm: '' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.passwordSyndic !== form.confirm) return alert("As senhas do síndico não coincidem!");
    try {
      await api.post('/admin/create-tenant-manual', {
          condoName: form.condoName,
          cnpj: form.cnpj,
          qtyUnits: form.qtyUnits,
          secretKeyword: form.secretKeyword,
          nameSyndic: form.nameSyndic,
          emailSyndic: form.emailSyndic,
          cpfSyndic: form.cpfSyndic,
          phoneSyndic: form.phoneSyndic, // Alinhado com o AdminService.java
          passwordSyndic: form.passwordSyndic
      });
      alert('Condomínio e Síndico ativados com sucesso!');
    } catch (err: any) { alert(err.response?.data || 'Erro na criação.'); }
  };

  const inputStyle = "w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700 outline-none";

  return (
    <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100">
      <h3 className="text-3xl font-black mb-10 flex items-center gap-4 text-slate-800"><Building className="text-blue-600" size={32} /> Ativação Manual de Conta</h3>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input required placeholder="Nome do Condomínio" value={form.condoName} onChange={e => setForm({...form, condoName: e.target.value})} className={inputStyle} />
          <input required placeholder="CNPJ" value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} className={inputStyle} />
          <input required type="number" placeholder="Limite de Unidades" value={form.qtyUnits} onChange={e => setForm({...form, qtyUnits: Number(e.target.value)})} className={inputStyle} />
          <input required placeholder="Palavra-Chave Secreta" value={form.secretKeyword} onChange={e => setForm({...form, secretKeyword: e.target.value})} className={inputStyle} />
        </div>
        
        <div className="bg-slate-50/50 p-10 rounded-[3rem] border-2 border-dashed border-slate-200 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-black">2</div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Dados do Síndico Responsável</p>
            </div>
            <input required placeholder="Nome Completo" value={form.nameSyndic} onChange={e => setForm({...form, nameSyndic: e.target.value})} className="w-full p-5 bg-white rounded-2xl border-none shadow-sm font-bold" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input required type="email" placeholder="E-mail" value={form.emailSyndic} onChange={e => setForm({...form, emailSyndic: e.target.value})} className="p-5 bg-white rounded-2xl border-none shadow-sm font-bold" />
                <input required placeholder="CPF" value={form.cpfSyndic} onChange={e => setForm({...form, cpfSyndic: e.target.value})} className="p-5 bg-white rounded-2xl border-none shadow-sm font-bold" />
                <input required placeholder="WhatsApp" value={form.phoneSyndic} onChange={e => setForm({...form, phoneSyndic: e.target.value})} className="p-5 bg-white rounded-2xl border-none shadow-sm font-bold" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <input required type={showPass ? "text" : "password"} placeholder="Criar Senha" value={form.passwordSyndic} onChange={e => setForm({...form, passwordSyndic: e.target.value})} className="w-full p-5 bg-white rounded-2xl border-none shadow-sm font-bold pr-14" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-5 text-slate-300 hover:text-blue-500 transition-colors">{showPass ? <EyeOff size={22}/> : <Eye size={22}/>}</button>
                </div>
                <input required type={showPass ? "text" : "password"} placeholder="Confirmar Senha" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} className="w-full p-5 bg-white rounded-2xl border-none shadow-sm font-bold" />
            </div>
        </div>
        <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl">
           <Save size={28}/> Ativar Condomínio Imediatamente
        </button>
      </form>
    </div>
  );
}

// --- 5. CRIAR ADMIN ---
function CreateAdminForm() {
    const [showPass, setShowPass] = useState(false);
    const [form, setForm] = useState({ nome: '', email: '', cpf: '', phone: '', password: '', confirm: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirm) return alert("As senhas não coincidem!");
        try {
            await api.post('/admin/create-admin', {
                nome: form.nome,
                email: form.email,
                cpf: form.cpf,
                whatsapp: form.phone, // Alinhado com o controller
                password: form.password
            });
            alert("Novo administrador Votzz criado com sucesso!");
            setForm({ nome: '', email: '', cpf: '', phone: '', password: '', confirm: '' });
        } catch (err: any) { alert(err.response?.data || "Erro de permissão."); }
    };

    return (
        <div className="max-w-xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border-t-[12px] border-red-500">
             <div className="text-center mb-10">
                <div className="bg-red-50 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner font-black text-3xl">V</div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Novo Poder Administrativo</h3>
                <p className="text-slate-400 text-xs font-bold uppercase mt-2 tracking-widest">Acesso total à infraestrutura</p>
             </div>
             <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="Nome Completo" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
                <input required type="email" placeholder="E-mail Corporativo" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="CPF" value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
                  <input required placeholder="WhatsApp" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
                </div>
                <div className="relative">
                    <input required type={showPass ? "text" : "password"} placeholder="Senha de Segurança" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold pr-14 outline-none" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-5 text-slate-300">{showPass ? <EyeOff size={22}/> : <Eye size={22}/>}</button>
                </div>
                <input required type={showPass ? "text" : "password"} placeholder="Confirmar" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold outline-none" />
                <button type="submit" className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-lg hover:bg-red-700 shadow-xl shadow-red-100 transition-all flex items-center justify-center gap-3 uppercase">
                   <UserPlus size={24}/> Gerar Acesso Master
                </button>
             </form>
        </div>
    );
}

// --- 6. MEU PERFIL ADMIN ---
function AdminProfileView({ user }: { user: User | null }) {
    return (
        <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
            <div className="text-center mb-8">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-500 shadow-lg text-emerald-600 font-black text-3xl">
                    {user?.nome?.charAt(0) || 'V'}
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{user?.nome}</h3>
                <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 inline-block">Sessão Autenticada Mestre</span>
            </div>
            <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Identificador Interno</span>
                    <span className="font-mono text-xs text-slate-600">{user?.id}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">E-mail Mestre</span>
                    <span className="font-bold text-slate-700">{user?.email}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Nível de Acesso</span>
                    <span className="font-bold text-red-600 uppercase tracking-tighter">Super Administrador</span>
                </div>
            </div>
        </div>
    );
}