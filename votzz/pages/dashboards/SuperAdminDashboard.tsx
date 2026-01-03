import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { AdminDashboardStats, User } from '../../types';
import { 
  Users, Building, DollarSign, Tag, Plus, Save, 
  ShieldAlert, LayoutDashboard, Search, Folder, UserPlus, Trash2, Activity, UserCircle, Edit, MapPin, X, CalendarClock, Mail, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('STATS');
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (window.location.hash.includes('profile')) {
        setActiveTab('MY_PROFILE');
    }
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Votzz <span className="text-emerald-500">God Mode</span></h1>
          <p className="text-slate-500 font-medium tracking-wide uppercase text-[10px] mt-1">Controle de Infraestrutura Global</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Sistema Operacional</span>
        </div>
      </div>
      
      <div className="flex gap-2 mb-8 bg-white p-2 rounded-3xl shadow-sm border border-slate-100 overflow-x-auto scrollbar-hide">
        <TabBtn label="Dashboard" icon={<LayoutDashboard size={18}/>} active={activeTab === 'STATS'} onClick={() => setActiveTab('STATS')} />
        <TabBtn label="Usuários" icon={<Folder size={18}/>} active={activeTab === 'USERS'} onClick={() => setActiveTab('USERS')} />
        <TabBtn label="Condomínios" icon={<Building size={18}/>} active={activeTab === 'TENANTS'} onClick={() => setActiveTab('TENANTS')} />
        <TabBtn label="Admins" icon={<ShieldAlert size={18}/>} active={activeTab === 'ADMINS'} onClick={() => setActiveTab('ADMINS')} />
        <TabBtn label="Cupons" icon={<Tag size={18}/>} active={activeTab === 'COUPONS'} onClick={() => setActiveTab('COUPONS')} />
        <TabBtn label="Novo Condo" icon={<Plus size={18}/>} active={activeTab === 'MANUAL_CONDO'} onClick={() => setActiveTab('MANUAL_CONDO')} />
        <TabBtn label="Novo Admin" icon={<UserPlus size={18}/>} active={activeTab === 'NEW_ADMIN'} onClick={() => setActiveTab('NEW_ADMIN')} />
        <TabBtn label="Meu Perfil" icon={<UserCircle size={18}/>} active={activeTab === 'MY_PROFILE'} onClick={() => setActiveTab('MY_PROFILE')} />
      </div>

      <div className="transition-all duration-300">
        {activeTab === 'STATS' && <StatsView />}
        {activeTab === 'USERS' && <OrganizedUsersView />}
        {activeTab === 'TENANTS' && <TenantsManager />}
        {activeTab === 'ADMINS' && <AdminsList currentUser={currentUser} />}
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
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${active ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
      {icon} {label}
    </button>
  );
}

// --- 1. ADMINS LIST ---
function AdminsList({ currentUser }: { currentUser: any }) {
    const [admins, setAdmins] = useState<any[]>([]);
    
    const load = () => api.get('/admin/admins').then(res => setAdmins(res.data)).catch(() => {});
    useEffect(() => { load(); }, []);

    const handleDelete = async (id: string) => {
        if(!confirm("Remover este admin?")) return;
        try { await api.delete(`/admin/users/${id}`); load(); } 
        catch(e: any) { alert(e.response?.data?.error || "Você não tem permissão para isso."); }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-black text-slate-700 ml-2 text-xl">Administradores do Sistema</h3>
            {admins.map(adm => (
                <div key={adm.id} className="bg-white p-6 rounded-[2rem] border shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-black text-lg">
                            {adm.nome?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 text-lg">{adm.nome}</h4>
                            <p className="text-xs text-slate-400 font-mono font-bold mt-1">
                                {adm.email} <span className="mx-2">•</span> {adm.whatsapp || 'Sem Zap'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold bg-red-50 text-red-600 px-4 py-2 rounded-xl uppercase tracking-wider border border-red-100">
                            {adm.id === '10000000-0000-0000-0000-000000000000' ? 'Super Admin' : 'Admin Votzz'}
                        </span>
                        {currentUser?.id === '10000000-0000-0000-0000-000000000000' && adm.id !== currentUser.id && (
                            <button onClick={() => handleDelete(adm.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                                <Trash2 size={16}/>
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- 2. TENANTS ---
function TenantsManager() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [editingTenant, setEditingTenant] = useState<any>(null);

    const load = () => api.get('/admin/tenants').then(res => setTenants(res.data)).catch(() => {});
    useEffect(() => { load(); }, []);

    const fetchCep = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setEditingTenant((prev: any) => ({ ...prev, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }));
            }
        } catch(e) {}
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put(`/admin/tenants/${editingTenant.id}`, editingTenant);
            alert("Atualizado!"); setEditingTenant(null); load();
        } catch (e) { alert("Erro ao atualizar."); }
    };

    const getDaysRemaining = (expireDate: string) => {
        if (!expireDate) return 'Vitalício';
        const diff = new Date(expireDate).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        return days > 0 ? `${days} dias` : 'Vencido';
    };

    return (
        <div className="space-y-4">
             {editingTenant && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-xl">Editar {editingTenant.nome}</h3>
                            <button onClick={() => setEditingTenant(null)}><X /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <input className="w-full p-3 border rounded-xl" value={editingTenant.nome} onChange={e => setEditingTenant({...editingTenant, nome: e.target.value})} placeholder="Nome"/>
                            <input className="w-full p-3 border rounded-xl" value={editingTenant.cnpj} onChange={e => setEditingTenant({...editingTenant, cnpj: e.target.value})} placeholder="CNPJ"/>
                            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase">Endereço</p>
                                <input className="w-full p-3 bg-white border rounded-xl" placeholder="CEP" value={editingTenant.cep || ''} onChange={e => { setEditingTenant({...editingTenant, cep: e.target.value}); fetchCep(e.target.value); }} />
                                <input className="w-full p-3 bg-white border rounded-xl" placeholder="Logradouro" value={editingTenant.logradouro || ''} onChange={e => setEditingTenant({...editingTenant, logradouro: e.target.value})} />
                                <div className="grid grid-cols-3 gap-2">
                                    <input className="p-3 bg-white border rounded-xl" placeholder="Nº" value={editingTenant.numero || ''} onChange={e => setEditingTenant({...editingTenant, numero: e.target.value})} />
                                    <input className="p-3 bg-white border rounded-xl" placeholder="Bairro" value={editingTenant.bairro || ''} onChange={e => setEditingTenant({...editingTenant, bairro: e.target.value})} />
                                    <input className="p-3 bg-white border rounded-xl" placeholder="Cidade" value={editingTenant.cidade || ''} onChange={e => setEditingTenant({...editingTenant, cidade: e.target.value})} />
                                </div>
                            </div>
                            <input className="w-full p-3 border rounded-xl" value={editingTenant.secretKeyword} onChange={e => setEditingTenant({...editingTenant, secretKeyword: e.target.value})} placeholder="Palavra-chave"/>
                            <button className="w-full bg-emerald-600 text-white p-3 rounded-xl font-bold">Salvar</button>
                        </form>
                    </div>
                </div>
             )}

            {tenants.map(t => (
                <div key={t.id} className="bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow gap-4">
                    <div>
                        <h4 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                            <Building size={20} className="text-blue-500"/> {t.nome} 
                            {t.ativo ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase font-bold">Ativo</span> : <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase font-bold">Inativo</span>}
                        </h4>
                        <div className="mt-2 ml-7 space-y-1">
                            <p className="text-xs text-slate-400 font-mono font-bold">CNPJ: {t.cnpj} | Key: {t.secretKeyword}</p>
                            <p className="text-xs text-slate-500 font-bold flex items-center gap-1"><CalendarClock size={12}/> Plano: {t.plano?.nome || 'Nenhum'} ({getDaysRemaining(t.dataExpiracaoPlano)})</p>
                            {t.cidade && <p className="text-xs text-slate-500 font-bold flex items-center gap-1"><MapPin size={12}/> {t.cidade}/{t.estado}</p>}
                        </div>
                    </div>
                    <button onClick={() => setEditingTenant(t)} className="flex items-center gap-2 text-slate-500 hover:text-white hover:bg-blue-600 font-bold text-xs bg-slate-100 px-5 py-3 rounded-xl transition-all self-start md:self-center">
                        <Edit size={16}/> Editar
                    </button>
                </div>
            ))}
        </div>
    );
}

// --- 3. CUPONS ---
function CouponsManager() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState({ code: '', discount: '', quantity: 1 });

  const load = () => api.get('/admin/coupons').then(res => setCoupons(res.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', { 
          code: form.code, 
          discountPercent: Number(form.discount), 
          quantity: Number(form.quantity) 
      });
      alert('Cupom criado!');
      setForm({ code: '', discount: '', quantity: 1 });
      load();
    } catch (err) { alert('Erro ao criar.'); }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Apagar?")) return;
      try { await api.delete(`/admin/coupons/${id}`); load(); } catch(e) { alert("Erro"); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 h-fit">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-emerald-600"><Tag size={28}/> Criar Novo Cupom</h3>
            <form onSubmit={handleCreate} className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Código</label>
                    <input required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full p-4 bg-slate-50 rounded-2xl font-mono text-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input required type="number" placeholder="% Desc" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl" />
                    <input required type="number" placeholder="Qtd" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-[2rem] font-black">Criar Cupom</button>
            </form>
        </div>
        <div className="space-y-4">
            {coupons.map(c => (
                <div key={c.id} className="bg-white p-5 rounded-[2rem] border shadow-sm flex justify-between items-center">
                    <div>
                        <p className="font-mono font-black text-xl text-slate-700">{c.code}</p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">{c.discountPercent}% OFF</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">Restam: {c.quantity}</span>
                        </div>
                    </div>
                    <button onClick={() => handleDelete(c.id)} className="p-3 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
                </div>
            ))}
        </div>
    </div>
  );
}

// --- 4. USUARIOS ---
function OrganizedUsersView() {
  const [data, setData] = useState<any>(null);
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ tenantId: '', nome: '', email: '', password: 'votzz', role: 'MORADOR', cpf: '', whatsapp: '', unidade: '', bloco: '' });

  const loadData = () => {
      api.get('/admin/organized-users').then(res => setData(res.data)).catch(() => {});
      api.get('/admin/tenants').then(res => setTenantsList(res.data)).catch(() => {});
  };
  useEffect(() => { loadData(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await api.post('/admin/create-user-linked', newUser);
          alert("Criado!"); setIsCreatingUser(false); loadData();
          setNewUser({ tenantId: '', nome: '', email: '', password: 'votzz', role: 'MORADOR', cpf: '', whatsapp: '', unidade: '', bloco: '' });
      } catch(e: any) { alert(e.response?.data?.message || "Erro"); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await api.put(`/admin/users/${editingUser.id}`, { dto: editingUser, newPassword: editingUser.newPassword });
        alert("Atualizado!"); setEditingUser(null); loadData();
    } catch (e) { alert("Erro."); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir?")) return;
    try { await api.delete(`/admin/users/${id}`); loadData(); } catch (e) { alert("Erro."); }
  };

  if (!data) return <div className="p-20 text-center animate-pulse font-black text-slate-400">CARREGANDO...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border flex items-center gap-3 flex-1">
            <Search size={20} className="text-slate-300 ml-2" />
            <input className="w-full outline-none font-medium text-slate-600" placeholder="Buscar usuário..." onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setIsCreatingUser(true)} className="bg-blue-600 text-white px-6 rounded-3xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
              <UserPlus size={20} /> Novo Morador
          </button>
      </div>

      {isCreatingUser && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full">
                  <div className="flex justify-between mb-6">
                      <h3 className="font-black text-xl">Novo Usuário</h3>
                      <button onClick={() => setIsCreatingUser(false)}><X /></button>
                  </div>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                      <select required className="w-full p-3 border rounded-xl" value={newUser.tenantId} onChange={e => setNewUser({...newUser, tenantId: e.target.value})}>
                          <option value="">Selecione o Condomínio</option>
                          {tenantsList.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                      </select>
                      <input required className="w-full p-3 border rounded-xl" placeholder="Nome" value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value})}/>
                      <input required className="w-full p-3 border rounded-xl" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}/>
                      <div className="grid grid-cols-2 gap-3">
                          <input className="p-3 border rounded-xl" placeholder="CPF" value={newUser.cpf} onChange={e => setNewUser({...newUser, cpf: e.target.value})}/>
                          <input className="p-3 border rounded-xl" placeholder="Zap" value={newUser.whatsapp} onChange={e => setNewUser({...newUser, whatsapp: e.target.value})}/>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                          <select className="p-3 border rounded-xl" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                              <option value="MORADOR">Morador</option>
                              <option value="SINDICO">Síndico</option>
                              <option value="PORTEIRO">Porteiro</option>
                          </select>
                          <input className="p-3 border rounded-xl" placeholder="Und" value={newUser.unidade} onChange={e => setNewUser({...newUser, unidade: e.target.value})}/>
                          <input className="p-3 border rounded-xl" placeholder="Bloco" value={newUser.bloco} onChange={e => setNewUser({...newUser, bloco: e.target.value})}/>
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Criar</button>
                  </form>
              </div>
          </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full">
                <h3 className="text-xl font-black mb-4">Editar Usuário</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <input className="w-full p-3 border rounded-xl" value={editingUser.nome} onChange={e => setEditingUser({...editingUser, nome: e.target.value})} />
                    <input className="w-full p-3 border rounded-xl" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input className="w-full p-3 border rounded-xl" placeholder="CPF" value={editingUser.cpf || ''} onChange={e => setEditingUser({...editingUser, cpf: e.target.value})} />
                        <input className="w-full p-3 border rounded-xl" placeholder="WhatsApp" value={editingUser.whatsapp || ''} onChange={e => setEditingUser({...editingUser, whatsapp: e.target.value})} />
                    </div>
                    <input className="w-full p-3 border border-yellow-300 bg-yellow-50 rounded-xl" type="password" placeholder="Nova Senha (opcional)" onChange={e => setEditingUser({...editingUser, newPassword: e.target.value})} />
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setEditingUser(null)} className="flex-1 p-3 bg-slate-200 rounded-xl font-bold">Cancelar</button>
                        <button type="submit" className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <details className="bg-indigo-900 text-white rounded-[2rem] border border-indigo-800 shadow-xl group overflow-hidden" open>
        <summary className="p-6 cursor-pointer font-black flex justify-between items-center"><div className="flex gap-4 items-center"><Users /> Afiliados</div><Plus /></summary>
        <div className="p-6 bg-white text-slate-800"><UserTable users={data.afiliados} search={search} onEdit={setEditingUser} onDelete={handleDelete} /></div>
      </details>
      {Object.entries(data.pastas).map(([nome, moradores]: any) => (
        <details key={nome} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden group">
          <summary className="p-6 cursor-pointer font-black flex justify-between items-center"><div className="flex gap-4 items-center"><Folder className="text-blue-500" /> {nome}</div><Plus /></summary>
          <div className="p-6 border-t"><UserTable users={moradores} search={search} onEdit={setEditingUser} onDelete={handleDelete} /></div>
        </details>
      ))}
    </div>
  );
}

const UserTable = ({ users, search, onEdit, onDelete }: any) => {
  const filtered = users.filter((u: any) => u.nome.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead><tr className="text-slate-400 text-[9px] font-black uppercase border-b"><th className="pb-4">Membro</th><th className="pb-4">Contato</th><th className="pb-4 text-center">Ações</th></tr></thead>
        <tbody>
          {filtered.map((u: any) => (
            <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
              <td className="py-4 font-black">{u.nome}<br/><span className="font-normal text-xs text-slate-400">{u.email}</span></td>
              <td>{u.cpf}<br/><span className="text-emerald-600 font-bold">{u.whatsapp}</span></td>
              <td className="text-center flex items-center justify-center gap-2 py-4">
                <button onClick={() => onEdit(u)} className="p-2 text-slate-300 hover:text-blue-500"><Edit size={16}/></button>
                <button onClick={() => onDelete(u.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- MANUAL CONDO ---
function ManualCondoCreator() {
  const [form, setForm] = useState<any>({ condoName: '', cnpj: '', qtyUnits: 30, secretKeyword: '', nameSyndic: '', emailSyndic: '', cpfSyndic: '', phoneSyndic: '', passwordSyndic: '', confirm: '', cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', pontoReferencia: '' });

  const fetchCep = async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, '');
      if(cleanCep.length !== 8) return;
      try {
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await res.json();
          if(!data.erro) {
              setForm((prev: any) => ({ ...prev, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }));
              document.getElementById('numeroInputManual')?.focus();
          }
      } catch(e) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(form.passwordSyndic !== form.confirm) return alert("Senhas não conferem");
    try {
        await api.post('/admin/create-tenant-manual', form);
        alert('Condomínio criado!');
    } catch(err: any) { alert(err.response?.data?.error || 'Erro.'); }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100">
      <h3 className="text-3xl font-black mb-10 flex items-center gap-4 text-slate-800"><Building className="text-blue-600" size={32} /> Ativação Manual</h3>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input required placeholder="Nome do Condomínio" value={form.condoName} onChange={e => setForm({...form, condoName: e.target.value})} className="p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 ring-blue-200 transition-all" />
          <input required placeholder="CNPJ" value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} className="p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 ring-blue-200 transition-all" />
          <input required type="number" placeholder="Limite de Unidades" value={form.qtyUnits} onChange={e => setForm({...form, qtyUnits: Number(e.target.value)})} className="p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 ring-blue-200 transition-all" />
          <input required placeholder="Palavra-Chave Secreta" value={form.secretKeyword} onChange={e => setForm({...form, secretKeyword: e.target.value})} className="p-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 ring-blue-200 transition-all" />
        </div>
        <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <input required placeholder="CEP" maxLength={9} value={form.cep} onChange={e => { setForm({...form, cep: e.target.value}); fetchCep(e.target.value); }} className="p-4 bg-white rounded-2xl font-bold" />
                <input required placeholder="Logradouro" value={form.logradouro} onChange={e => setForm({...form, logradouro: e.target.value})} className="p-4 bg-white rounded-2xl font-bold md:col-span-2" />
            </div>
            <div className="grid grid-cols-3 gap-4">
                <input required id="numeroInputManual" placeholder="Número" value={form.numero} onChange={e => setForm({...form, numero: e.target.value})} className="p-4 bg-white rounded-2xl font-bold" />
                <input required placeholder="Bairro" value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} className="p-4 bg-white rounded-2xl font-bold" />
                <input required placeholder="Cidade" value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} className="p-4 bg-white rounded-2xl font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input required placeholder="UF" maxLength={2} value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="p-4 bg-white rounded-2xl font-bold" />
                <input placeholder="Ponto de Referência" value={form.pontoReferencia} onChange={e => setForm({...form, pontoReferencia: e.target.value})} className="p-4 bg-white rounded-2xl font-bold" />
            </div>
        </div>
        <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-4">
            <input required placeholder="Nome Síndico" value={form.nameSyndic} onChange={e => setForm({...form, nameSyndic: e.target.value})} className="w-full p-4 bg-white rounded-2xl font-bold" />
            <div className="grid grid-cols-3 gap-4">
                <input required type="email" placeholder="Email" value={form.emailSyndic} onChange={e => setForm({...form, emailSyndic: e.target.value})} className="p-4 bg-white rounded-2xl font-bold" />
                <input required placeholder="CPF" value={form.cpfSyndic} onChange={e => setForm({...form, cpfSyndic: e.target.value})} className="p-4 bg-white rounded-2xl font-bold" />
                <input required placeholder="WhatsApp" value={form.phoneSyndic} onChange={e => setForm({...form, phoneSyndic: e.target.value})} className="p-4 bg-white rounded-2xl font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input required type="password" placeholder="Senha" value={form.passwordSyndic} onChange={e => setForm({...form, passwordSyndic: e.target.value})} className="p-4 bg-white rounded-2xl font-bold" />
                <input required type="password" placeholder="Confirmar" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} className="p-4 bg-white rounded-2xl font-bold" />
            </div>
        </div>
        <button type="submit" className="w-full py-6 bg-slate-900 hover:bg-black text-white rounded-[2.5rem] font-black text-xl transition-all">Criar Condomínio e Usuário</button>
      </form>
    </div>
  );
}

// --- CRIAR ADMIN ---
function CreateAdminForm() {
    const [form, setForm] = useState({ nome: '', email: '', cpf: '', phone: '', password: '', confirm: '' });
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirm) return alert("Senhas não coincidem!");
        try {
            await api.post('/admin/create-admin', { nome: form.nome, email: form.email, cpf: form.cpf, whatsapp: form.phone, password: form.password });
            alert("Admin Criado!"); setForm({ nome: '', email: '', cpf: '', phone: '', password: '', confirm: '' });
        } catch (err: any) { alert(err.response?.data?.error || "Erro."); }
    };
    return (
        <div className="max-w-xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border-t-[12px] border-red-500">
             <div className="text-center mb-10"><ShieldAlert className="text-red-500 mx-auto" size={48}/><h3 className="text-2xl font-black text-slate-800 uppercase">Novo Admin</h3></div>
             <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="Nome" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold" />
                <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold" />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="CPF" value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold" />
                  <input required placeholder="WhatsApp" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold" />
                </div>
                <input required type="password" placeholder="Senha" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold" />
                <input required type="password" placeholder="Confirmar" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} className="w-full p-5 bg-slate-50 rounded-2xl font-bold" />
                <button type="submit" className="w-full bg-red-600 text-white py-6 rounded-[2rem] font-black text-lg hover:bg-red-700 uppercase">Criar Admin</button>
             </form>
        </div>
    );
}

// --- STATS ---
function StatsView() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const start = Date.now();
      try {
        const res = await api.get('/admin/dashboard-stats');
        if (isMounted) { setLatency(Date.now() - start); setStats(res.data); }
      } catch (e) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const formatMoney = (val: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl border-b-8 border-blue-500">
        <Activity className="text-blue-400 mb-2" size={32} />
        <p className="text-blue-200/50 text-[10px] font-black uppercase mb-1">Latência</p>
        <p className={`text-4xl font-black ${latency > 250 ? 'text-red-400' : 'text-emerald-400'}`}>{latency}ms</p>
      </div>
      <StatCard icon={<Building />} color="blue" title="Condomínios" value={stats?.totalTenants || 0} />
      <StatCard icon={<Users />} color="purple" title="Usuários" value={stats?.totalUsers || 0} />
      <StatCard icon={<DollarSign />} color="emerald" title="MRR Estimado" value={formatMoney(stats?.mrr || 0)} />
    </div>
  );
}

const StatCard = ({ icon, title, value, color }: any) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center space-x-5">
    <div className={`p-5 bg-${color}-50 text-${color}-600 rounded-3xl`}>{icon}</div>
    <div><p className="text-slate-400 text-[10px] font-black uppercase mb-1">{title}</p><p className="text-3xl font-black text-slate-800">{value}</p></div>
  </div>
);

// --- PERFIL DO ADMIN (CORRIGIDO) ---
function AdminProfileView({ user }: { user: any }) {
    const [form, setForm] = useState({
        nome: user?.nome || '',
        email: user?.email || '',
        cpf: user?.cpf || '',
        whatsapp: user?.whatsapp || '',
        password: '',
        confirmPassword: ''
    });

    // Atualiza o form quando o user carrega
    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                nome: user.nome || '',
                email: user.email || '',
                cpf: user.cpf || '',
                whatsapp: user.whatsapp || ''
            }));
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validação de senha
        if (form.password && form.password !== form.confirmPassword) {
            return alert("As senhas não coincidem!");
        }

        try {
            // payload plano (sem 'dto')
            const payload: any = {
                nome: form.nome,
                email: form.email,
                cpf: form.cpf,
                whatsapp: form.whatsapp
            };

            // Só adiciona a senha se tiver sido alterada
            if (form.password) {
                payload.newPassword = form.password;
            }

            await api.put(`/admin/users/${user.id}`, payload);
            
            alert("Perfil atualizado com sucesso!");
            window.location.reload(); 
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || "Erro ao atualizar perfil.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
            <div className="text-center mb-8">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-500 shadow-lg text-emerald-600 font-black text-3xl">
                    {user?.nome?.charAt(0) || 'A'}
                </div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{user?.nome}</h3>
                <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 inline-block">
                    {user?.id === '10000000-0000-0000-0000-000000000000' ? 'Super Admin' : 'Admin da Votzz'}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Nome Completo</label>
                    <input 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 ring-emerald-200"
                        value={form.nome}
                        onChange={e => setForm({...form, nome: e.target.value})}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 ml-2 uppercase">E-mail de Acesso</label>
                    <input 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 ring-emerald-200"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 ml-2 uppercase">CPF</label>
                        <input 
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 ring-emerald-200"
                            value={form.cpf}
                            onChange={e => setForm({...form, cpf: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 ml-2 uppercase">WhatsApp</label>
                        <input 
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 ring-emerald-200"
                            value={form.whatsapp}
                            onChange={e => setForm({...form, whatsapp: e.target.value})}
                        />
                    </div>
                </div>

                <div className="border-t pt-4 mt-4 border-slate-100">
                    <p className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2"><Lock size={16}/> Alterar Senha (Opcional)</p>
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            type="password"
                            placeholder="Nova Senha"
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-200"
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                        />
                        <input 
                            type="password"
                            placeholder="Confirmar"
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 ring-emerald-200"
                            value={form.confirmPassword}
                            onChange={e => setForm({...form, confirmPassword: e.target.value})}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black text-lg transition-all shadow-lg shadow-emerald-200 mt-6"
                >
                    Salvar Alterações
                </button>
            </form>
        </div>
    );
}