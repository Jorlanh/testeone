import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { 
  Users, FileText, CheckCircle, AlertTriangle, Plus, Megaphone, TrendingUp, Clock, ArrowRight, ShieldAlert, Calendar, Wallet, Shield, Edit, Trash2, Settings, Upload, Download, FileCheck, Banknote
} from 'lucide-react';
import api from '../services/api'; 
import { Assembly, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { SubscriptionStatus } from '../components/SubscriptionStatus';

// Tipos auxiliares locais
interface AuditLog {
  id: string;
  action: string;
  user: string;
  details: string;
  timestamp: string;
}

interface FinancialReport {
  id: string;
  month: string; // Ex: "Janeiro"
  year: number;  // Ex: 2026
  fileName: string;
  url: string;
  createdAt: string;
}

interface BankInfo {
  bankName: string;
  agency: string;
  account: string;
  pixKey: string;
  asaasWalletId: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados de Dados
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [financial, setFinancial] = useState({ balance: 0, lastUpdate: '' });
  const [condoUsers, setCondoUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  
  // Estados de UI
  const [showUserList, setShowUserList] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // Estados de Formulários
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [bankForm, setBankForm] = useState<BankInfo>({ bankName: '', agency: '', account: '', pixKey: '', asaasWalletId: '' });
  const [userForm, setUserForm] = useState({ nome: '', email: '', cpf: '', whatsapp: '', unidade: '', bloco: '', role: 'MORADOR', password: '' });
  
  // Estado para Upload de Relatório
  const [reportForm, setReportForm] = useState({ month: new Date().toLocaleString('pt-BR', { month: 'long' }), year: new Date().getFullYear() });

  // Permissões
  const isManager = user?.role === 'MANAGER' || user?.role === 'SINDICO' || user?.role === 'ADM_CONDO';
  const displayName = user?.nome || user?.email?.split('@')[0] || 'Morador';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const results = await Promise.allSettled([
      api.get('/assemblies'),           
      api.get('/financial/balance'),    
      api.get('/users'),                
      api.get('/tenants/my-subscription'), 
      api.get('/tenants/audit-logs'),   
      api.get('/financial/reports'),    
      api.get('/tenants/bank-info')     
    ]);

    if (results[0].status === 'fulfilled') setAssemblies(results[0].value.data || []);
    if (results[1].status === 'fulfilled') setFinancial(results[1].value.data || { balance: 0, lastUpdate: 'N/A' });
    if (results[2].status === 'fulfilled') setCondoUsers(results[2].value.data || []);
    if (results[3].status === 'fulfilled' && results[3].value.data?.expirationDate) {
      setExpirationDate(results[3].value.data.expirationDate);
    }
    if (results[4].status === 'fulfilled') setAuditLogs(results[4].value.data || []);
    if (results[5].status === 'fulfilled') setReports(results[5].value.data || []);
    if (results[6].status === 'fulfilled') setBankForm(results[6].value.data || bankForm);
  };

  // --- CÁLCULOS DE DADOS REAIS ---
  const activeAssemblies = assemblies.filter(a => a.status === 'OPEN');
  const totalVotes = assemblies.reduce((acc, curr) => acc + (curr.votes?.length || 0), 0);
  
  const engagementRate = useMemo(() => {
    if (condoUsers.length === 0 || assemblies.length === 0) return 0;
    const avgVotes = totalVotes / assemblies.length;
    return Math.round((avgVotes / condoUsers.length) * 100);
  }, [totalVotes, assemblies.length, condoUsers.length]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(m => ({ name: m, votos: 0 }));
    
    assemblies.forEach(a => {
        const dateStr = a.startDate || a.dataInicio || new Date().toISOString();
        const date = new Date(dateStr); 
        if (!isNaN(date.getTime())) {
            const monthIdx = date.getMonth();
            const votes = a.votes?.length || 0;
            data[monthIdx].votos += votes;
        }
    });
    
    if (totalVotes === 0) {
        return [
            { name: 'Jan', votos: 0 }, { name: 'Fev', votos: 0 }, { name: 'Mar', votos: 0 },
            { name: 'Abr', votos: 0 }, { name: 'Mai', votos: 0 }, { name: 'Jun', votos: 0 },
        ];
    }
    return data;
  }, [assemblies, totalVotes]);

  const criticalAssemblies = activeAssemblies.filter(a => {
    if (!a.endDate) return false;
    const hoursLeft = (new Date(a.endDate).getTime() - Date.now()) / 36e5;
    return hoursLeft < 48 && hoursLeft > 0;
  });

  // --- AÇÕES ---

  const handleUpdateBalance = () => {
    const val = prompt("Informe o saldo atualizado (R$):", financial.balance.toString());
    if (val && !isNaN(parseFloat(val))) {
      api.post('/financial/update', { balance: parseFloat(val) })
         .then(() => loadData())
         .catch(() => alert("Erro ao atualizar saldo."));
    }
  };

  const handleSaveBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await api.post('/tenants/bank-info', bankForm);
        alert("Dados bancários salvos com sucesso!");
        setIsBankModalOpen(false);
    } catch (e) { alert("Erro ao salvar dados bancários."); }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (editingUser) {
            // Validação de Segurança no Frontend (embora o Backend deva ter a final)
            if (editingUser.role === 'ADMIN') {
                alert("Você não pode editar um Super Admin da Votzz.");
                return;
            }
            await api.put(`/users/${editingUser.id}`, userForm);
            alert("Usuário atualizado!");
        } else {
            await api.post('/users', userForm);
            alert("Usuário criado!");
        }
        setIsUserModalOpen(false);
        setEditingUser(null);
        loadData();
    } catch (e) { alert("Erro ao salvar usuário."); }
  };

  const openEditUser = (u: User) => {
    // Bloqueia edição de Admins da Votzz
    if (u.role === 'ADMIN') {
        alert("Ação não permitida: Este usuário é um Administrador da Votzz.");
        return;
    }

    setEditingUser(u);
    setUserForm({
        nome: u.nome || '',
        email: u.email || '',
        cpf: u.cpf || '',
        whatsapp: u.whatsapp || '',
        unidade: u.unidade || '',
        bloco: u.bloco || '',
        role: u.role || 'MORADOR',
        password: ''
    });
    setIsUserModalOpen(true);
  };

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({ nome: '', email: '', cpf: '', whatsapp: '', unidade: '', bloco: '', role: 'MORADOR', password: 'votzz' });
    setIsUserModalOpen(true);
  };

  const handleUploadReport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('month', reportForm.month);
    formData.append('year', reportForm.year.toString());
    
    try {
        await api.post('/financial/reports/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert("Relatório adicionado com sucesso!");
        loadData();
        e.target.value = ''; // Limpa o input
    } catch (error) { alert("Erro ao enviar relatório."); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* STATUS DE ASSINATURA */}
      {expirationDate && (
        <SubscriptionStatus 
            expirationDate={expirationDate} 
            userRole={user?.role || 'MORADOR'} 
            onRenewClick={() => navigate('/subscription/renew')}
        />
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Olá, {displayName.split(' ')[0]}</h1>
          <p className="text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
             Votzz OS 2.0
           </span>
        </div>
      </div>

      {/* SALDO E STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border-b-4 border-emerald-500 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Saldo Atual em Caixa</p>
                    <h2 className="text-4xl font-black mt-2">R$ {financial.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                </div>
                {isManager && (
                    <button onClick={() => setIsBankModalOpen(true)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors" title="Configurar Conta Bancária">
                        <Settings className="text-emerald-400 w-5 h-5" />
                    </button>
                )}
            </div>
            <p className="text-slate-400 text-xs mt-4 italic">Última atualização: {financial.lastUpdate || 'Hoje'}</p>
            {isManager && (
              <button 
                onClick={handleUpdateBalance}
                className="mt-6 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-bold text-[10px] uppercase transition-all shadow-lg"
              >
                <Edit size={14} /> Atualizar Manualmente
              </button>
            )}
          </div>
          <Wallet className="absolute right-[-10px] bottom-[-10px] text-white/5 w-40 h-40 group-hover:scale-110 transition-transform duration-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-center">
              <Users className="text-blue-500 mb-2" />
              <p className="text-3xl font-black text-slate-800">{condoUsers.length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase">Moradores</p>
           </div>
           <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-center">
              <CheckCircle className="text-emerald-500 mb-2" />
              <p className="text-3xl font-black text-slate-800">{totalVotes}</p>
              <p className="text-xs text-slate-500 font-bold uppercase">Votos (Ano)</p>
           </div>
        </div>
      </div>

      {/* AÇÕES (SÓ GESTORES) */}
      {isManager && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/create-assembly" className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl shadow-md transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center group">
            <div className="bg-white/20 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></div>
            <span className="font-bold text-sm">Nova Assembleia</span>
          </Link>
          <Link to="/governance" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-md transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center group">
            <div className="bg-white/20 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform"><Megaphone className="w-6 h-6" /></div>
            <span className="font-bold text-sm">Comunicado</span>
          </Link>
          <button onClick={() => setIsReportModalOpen(true)} className="bg-slate-700 hover:bg-slate-800 text-white p-4 rounded-xl shadow-md transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center group">
            <div className="bg-white/20 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6" /></div>
            <span className="font-bold text-sm">Relatórios</span>
          </button>
          <div onClick={() => setShowUserList(!showUserList)} className={`bg-white border p-4 rounded-xl shadow-sm transition-all flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 ${showUserList ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200 text-slate-600'}`}>
            <div className={`p-2 rounded-full mb-2 ${showUserList ? 'bg-emerald-100' : 'bg-slate-100'}`}><Users className={`w-6 h-6 ${showUserList ? 'text-emerald-600' : 'text-slate-500'}`} /></div>
            <span className={`text-sm ${showUserList ? 'font-bold text-emerald-700' : 'font-medium'}`}>{showUserList ? 'Fechar Gestão' : 'Gerenciar Usuários'}</span>
          </div>
        </div>
      )}

      {/* LISTA DE USUÁRIOS */}
      {showUserList && isManager && (
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Shield className="w-5 h-5 text-emerald-600" /> Membros do Condomínio</h3>
            <div className="flex gap-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold self-center">{condoUsers.length} total</span>
                <button onClick={openCreateUser} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-700"><Plus size={14}/> Adicionar Usuário</button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 uppercase text-[10px]">
                  <th className="pb-3 px-2">Morador</th>
                  <th className="pb-3 px-2">Contato</th>
                  <th className="pb-3 px-2">Unidade/Bloco</th>
                  <th className="pb-3 px-2">Cargo</th>
                  <th className="pb-3 px-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {condoUsers.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-4 text-slate-400">Nenhum usuário encontrado.</td></tr>
                ) : condoUsers.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-2 font-bold text-slate-700">{u.nome || u.name}</td>
                    <td className="py-4 px-2 text-slate-500 text-xs">{u.email}</td>
                    <td className="py-4 px-2 text-slate-600 font-mono">{u.unidade || '-'} / {u.bloco || '-'}</td>
                    <td className="py-4 px-2">
                         <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${u.role === 'SINDICO' ? 'bg-purple-100 text-purple-700' : u.role === 'ADM_CONDO' ? 'bg-blue-100 text-blue-700' : u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                             {u.role === 'ADM_CONDO' ? 'Admin Condo' : u.role === 'ADMIN' ? 'Votzz Admin' : u.role}
                         </span>
                    </td>
                    <td className="py-4 px-2 text-right">
                        {u.role !== 'ADMIN' && (
                            <button onClick={() => openEditUser(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Stats Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Assembleias Abertas', value: activeAssemblies.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
          { title: 'Engajamento Médio', value: `${engagementRate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
          { title: 'Atenção Necessária', value: criticalAssemblies.length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
          { title: 'Total Usuários', value: condoUsers.length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
             <div>
                <p className="text-slate-500 text-xs font-bold uppercase">{stat.title}</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h3>
             </div>
             <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
             </div>
          </div>
        ))}
      </div>

      {/* GRÁFICO E AUDITORIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Evolução de Participação</h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVotos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="votos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVotos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AUDITORIA (SÓ SINDICO) */}
          {isManager && (
            <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-700 uppercase flex items-center gap-2 mb-4">
                    <ShieldAlert size={16} className="text-purple-600"/> Auditoria & Segurança
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 max-h-60 overflow-y-auto space-y-3">
                    {auditLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center italic">Nenhuma atividade registrada.</p>
                    ) : auditLogs.map(log => (
                        <div key={log.id} className="flex gap-3 text-xs border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                            <span className="font-mono text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleDateString()}</span>
                            <div>
                                <p className="font-bold text-slate-700">{log.action} <span className="font-normal text-slate-500">por {log.user}</span></p>
                                <p className="text-slate-500">{log.details}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
           <button onClick={() => navigate('/tickets')} className="w-full block bg-blue-600 p-6 rounded-2xl text-white shadow-lg hover:bg-blue-700 transition-all group text-left">
             <h3 className="font-bold flex items-center justify-between">Abrir Chamado <ArrowRight className="group-hover:translate-x-1 transition-transform" /></h3>
             <p className="text-blue-100 text-xs mt-2">Relate problemas técnicos ou de convivência.</p>
           </button>

           {criticalAssemblies.length > 0 ? (
             <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
               <div className="flex items-center gap-2 mb-3">
                 <ShieldAlert className="w-5 h-5 text-orange-600" /><h3 className="font-bold text-orange-800">Atenção Necessária</h3>
               </div>
               <div className="space-y-3">
                 {criticalAssemblies.map(a => (
                   <div key={a.id} className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{a.title}</p>
                      <Link to={`/assembly/${a.id}`} className="text-xs font-bold text-slate-500 mt-2 block hover:text-orange-600">Verificar Quórum &rarr;</Link>
                   </div>
                 ))}
               </div>
             </div>
           ) : (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[150px] flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-8 h-8 text-emerald-200 mb-3" /><h3 className="font-bold text-slate-700">Tudo em dia!</h3>
             </div>
           )}
        </div>
      </div>

      {/* MODAL RELATÓRIOS (ATUALIZADO PARA MÚLTIPLOS UPLOADS) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between mb-6">
                    <h3 className="font-black text-xl flex items-center gap-2"><FileText className="text-blue-500"/> Relatórios Financeiros</h3>
                    <button onClick={() => setIsReportModalOpen(false)}><span className="text-2xl">&times;</span></button>
                </div>
                {isManager && (
                    <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        <p className="text-sm font-bold text-slate-600 mb-4 text-center">Adicionar Novo Relatório</p>
                        
                        <div className="flex gap-2 mb-4">
                            <select 
                                className="flex-1 p-2 border rounded-xl bg-white text-sm"
                                value={reportForm.month}
                                onChange={e => setReportForm({...reportForm, month: e.target.value})}
                            >
                                {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <select 
                                className="flex-1 p-2 border rounded-xl bg-white text-sm"
                                value={reportForm.year}
                                onChange={e => setReportForm({...reportForm, year: Number(e.target.value)})}
                            >
                                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative text-center">
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                onChange={handleUploadReport} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="bg-blue-100 text-blue-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                <Upload size={18}/> Selecionar PDF
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">Você pode enviar quantos arquivos quiser.</p>
                    </div>
                )}
                
                <div className="space-y-3 max-h-60 overflow-y-auto">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Histórico (Últimos 12 meses)</h4>
                    {reports.length === 0 && <p className="text-sm text-slate-500 italic text-center">Nenhum relatório disponível.</p>}
                    {reports.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <FileCheck className="text-emerald-500" size={20}/>
                                <div>
                                    <p className="font-bold text-sm text-slate-700">{r.month} {r.year}</p>
                                    <p className="text-[10px] text-slate-400">{r.fileName}</p>
                                </div>
                            </div>
                            <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1"><Download size={12}/> Baixar</a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* MODAL BANCO */}
      {isBankModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between mb-6">
                    <h3 className="font-black text-xl flex items-center gap-2"><Banknote className="text-emerald-500"/> Conta do Condomínio</h3>
                    <button onClick={() => setIsBankModalOpen(false)}><span className="text-2xl">&times;</span></button>
                </div>
                <p className="text-sm text-slate-500 mb-6">Configure a conta para recebimento de reservas e pagamentos.</p>
                <form onSubmit={handleSaveBankInfo} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 ml-1">Banco</label>
                            <input className="w-full p-3 border rounded-xl font-bold" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} placeholder="Ex: Nubank" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 ml-1">Chave Pix</label>
                            <input className="w-full p-3 border rounded-xl font-bold" value={bankForm.pixKey} onChange={e => setBankForm({...bankForm, pixKey: e.target.value})} placeholder="Chave Pix" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 ml-1">Agência</label>
                            <input className="w-full p-3 border rounded-xl font-bold" value={bankForm.agency} onChange={e => setBankForm({...bankForm, agency: e.target.value})} placeholder="0001" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 ml-1">Conta</label>
                            <input className="w-full p-3 border rounded-xl font-bold" value={bankForm.account} onChange={e => setBankForm({...bankForm, account: e.target.value})} placeholder="12345-6" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 ml-1">Asaas Wallet ID (Opcional)</label>
                        <input className="w-full p-3 border rounded-xl font-mono text-sm bg-slate-50" value={bankForm.asaasWalletId} onChange={e => setBankForm({...bankForm, asaasWalletId: e.target.value})} placeholder="wallet_..." />
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 text-white p-4 rounded-xl font-bold hover:bg-emerald-700">Salvar Dados</button>
                </form>
             </div>
        </div>
      )}

      {/* MODAL USUÁRIO (ATUALIZADO COM RESTRIÇÃO DE CPF E NOME) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between mb-6">
                    <h3 className="font-black text-xl">{editingUser ? 'Editar Morador' : 'Novo Usuário'}</h3>
                    <button onClick={() => setIsUserModalOpen(false)}><span className="text-2xl">&times;</span></button>
                </div>
                <form onSubmit={handleSaveUser} className="space-y-4">
                    {/* Nome e CPF desabilitados se for Edição */}
                    <input 
                        required 
                        className={`w-full p-3 border rounded-xl ${editingUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                        placeholder="Nome Completo" 
                        value={userForm.nome} 
                        onChange={e => setUserForm({...userForm, nome: e.target.value})} 
                        disabled={!!editingUser} // Desabilita se estiver editando
                        title={editingUser ? "Nome não pode ser alterado" : ""}
                    />
                    <input 
                        required 
                        type="email" 
                        className="w-full p-3 border rounded-xl" 
                        placeholder="E-mail" 
                        value={userForm.email} 
                        onChange={e => setUserForm({...userForm, email: e.target.value})} 
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            className={`w-full p-3 border rounded-xl ${editingUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                            placeholder="CPF" 
                            value={userForm.cpf} 
                            onChange={e => setUserForm({...userForm, cpf: e.target.value})} 
                            disabled={!!editingUser} // Desabilita se estiver editando
                            title={editingUser ? "CPF não pode ser alterado" : ""}
                        />
                        <input className="w-full p-3 border rounded-xl" placeholder="WhatsApp" value={userForm.whatsapp} onChange={e => setUserForm({...userForm, whatsapp: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input className="w-full p-3 border rounded-xl" placeholder="Unidade (Ex: 101)" value={userForm.unidade} onChange={e => setUserForm({...userForm, unidade: e.target.value})} />
                        <input className="w-full p-3 border rounded-xl" placeholder="Bloco (Ex: A)" value={userForm.bloco} onChange={e => setUserForm({...userForm, bloco: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 ml-1">Cargo</label>
                        <select className="w-full p-3 border rounded-xl bg-white" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                            <option value="MORADOR">Morador</option>
                            <option value="SINDICO">Síndico</option>
                            <option value="ADM_CONDO">Administrador</option>
                        </select>
                    </div>
                    {!editingUser && (
                        <input type="password" required className="w-full p-3 border rounded-xl" placeholder="Senha Inicial" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                    )}
                    <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700">{editingUser ? 'Salvar Alterações' : 'Criar Usuário'}</button>
                </form>
             </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;