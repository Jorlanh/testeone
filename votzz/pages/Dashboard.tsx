import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { 
  Users, FileText, CheckCircle, AlertTriangle, Plus, Megaphone, TrendingUp, Calendar, Wallet, Shield, Edit, Settings, Upload, Download, FileCheck, Banknote, ShieldAlert, ArrowRight, Building
} from 'lucide-react';
import api from '../services/api'; 
import { Assembly, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { SubscriptionStatus } from '../components/SubscriptionStatus';

// Interfaces
interface AuditLog {
  id: string;
  action: string;
  userName: string; 
  details: string;
  timestamp: string;
}

interface FinancialReport {
  id: string;
  month: string; 
  year: number;   
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

  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [financial, setFinancial] = useState({ balance: 0, lastUpdate: '' });
  const [condoUsers, setCondoUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  
  const [condoName, setCondoName] = useState<string>('Painel do Condomínio');

  const fixUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('storage.votzz.com')) {
        return url.replace('https://storage.votzz.com', 'https://votzz-files-prod.s3.sa-east-1.amazonaws.com');
    }
    return url;
  };

  useEffect(() => {
      const getCondoName = () => {
          if (user?.tenant?.nome) return user.tenant.nome;
          if ((user as any)?.tenantName) return (user as any).tenantName;
          
          const stored = localStorage.getItem('@Votzz:user');
          if (stored) {
              try {
                  const u = JSON.parse(stored);
                  if (u.tenant?.nome) return u.tenant.nome;
                  if (u.tenantName) return u.tenantName;
              } catch(e) {}
          }
          return 'Painel do Condomínio';
      };
      setCondoName(getCondoName());
  }, [user]);

  const [realStats, setRealStats] = useState({
    totalUsers: 0,
    activeAssemblies: 0,
    engagement: 0,
    yearlyVotes: 0,
    attentionRequired: 0
  });

  const [showUserList, setShowUserList] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [bankForm, setBankForm] = useState<BankInfo>({ bankName: '', agency: '', account: '', pixKey: '', asaasWalletId: '' });
  
  // CORREÇÃO: Inicializar valores para evitar 'null' no input
  const [userForm, setUserForm] = useState({ 
      nome: '', email: '', cpf: '', whatsapp: '', unidade: '', bloco: '', role: 'MORADOR', password: '' 
  });
  
  const [reportForm, setReportForm] = useState({ month: 'Janeiro', year: new Date().getFullYear() });

  const isManager = user?.role === 'MANAGER' || user?.role === 'SINDICO' || user?.role === 'ADM_CONDO';
  const displayName = user?.nome || user?.email?.split('@')[0] || 'Morador';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
        const promises: Promise<any>[] = [
          api.get('/assemblies'),             
          api.get('/financial/balance'),      
          api.get('/financial/reports'),      
          api.get('/condo/dashboard/stats').catch(() => ({ data: null }))
        ];

        const hasTenantContext = user?.tenantId || (user as any)?.tenant?.id;

        if (isManager && hasTenantContext) {
            promises.push(api.get('/users').catch(() => ({ data: [] })));
            promises.push(api.get('/tenants/audit-logs').catch(() => ({ data: [] })));
            promises.push(api.get('/tenants/bank-info').catch(() => ({ data: null })));
            promises.push(api.get('/tenants/my-subscription').catch(() => ({ data: null })));
        }

        const results = await Promise.allSettled(promises);

        if (results[0].status === 'fulfilled') {
            const data = Array.isArray(results[0].value.data) ? results[0].value.data : [];
            setAssemblies(data);
        }
        if (results[1].status === 'fulfilled') setFinancial(results[1].value.data || { balance: 0, lastUpdate: 'N/A' });
        if (results[2].status === 'fulfilled') setReports(results[2].value.data || []);
        
        if (results[3].status === 'fulfilled' && results[3].value.data) {
          setRealStats(results[3].value.data);
        }

        if (isManager && hasTenantContext) {
            if (results[4] && results[4].status === 'fulfilled') setCondoUsers(Array.isArray(results[4].value.data) ? results[4].value.data : []);
            if (results[5] && results[5].status === 'fulfilled') setAuditLogs(results[5].value.data || []);
            
            // CORREÇÃO: Tratar dados nulos do banco
            if (results[6] && results[6].status === 'fulfilled') {
                const data = results[6].value.data;
                if (data) {
                    setBankForm({
                        bankName: data.bankName || '',
                        agency: data.agency || '',
                        account: data.account || '',
                        pixKey: data.pixKey || '',
                        asaasWalletId: data.asaasWalletId || ''
                    });
                }
            }
            if (results[7] && results[7].status === 'fulfilled' && results[7].value?.data) {
                setExpirationDate(results[7].value.data.expirationDate);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
    }
  };

  // Memos de Cálculo (Mantidos)
  const activeAssembliesList = useMemo(() => {
    if (!Array.isArray(assemblies)) return [];
    return assemblies.filter(a => {
        const s = String(a.status || '').toUpperCase();
        return s !== 'ENCERRADA' && s !== 'CLOSED' && s !== '';
    });
  }, [assemblies]);

  const totalVotes = useMemo(() => {
    if (!Array.isArray(assemblies)) return 0;
    return assemblies.reduce((acc, curr) => acc + (curr.votes?.length || 0), 0);
  }, [assemblies]);
  
  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(m => ({ name: m, votos: 0 }));
    if (Array.isArray(assemblies)) {
        assemblies.forEach(a => {
            const dateStr = a.startDate || a.dataInicio || new Date().toISOString();
            const date = new Date(dateStr); 
            if (!isNaN(date.getTime())) {
                const monthIdx = date.getMonth();
                const votesCount = a.votes?.length || 0;
                data[monthIdx].votos += votesCount;
            }
        });
    }
    return data;
  }, [assemblies]);

  const criticalAssemblies = activeAssembliesList.filter(a => {
    const limitDate = a.endDate || a.dataFim;
    if (!limitDate) return false;
    const hoursLeft = (new Date(limitDate).getTime() - Date.now()) / 36e5;
    return hoursLeft < 48 && hoursLeft > 0;
  });

  // Handlers (Mantidos)
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
    if (u.role === 'ADMIN') {
        alert("Ação não permitida: Este usuário é um Administrador da Votzz.");
        return;
    }
    setEditingUser(u);
    // CORREÇÃO: Fallback para string vazia em todos os campos
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
        e.target.value = ''; 
    } catch (error: any) { 
        const msg = error.response?.data?.message || "Verifique o arquivo.";
        alert("Erro ao enviar relatório: " + msg);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {expirationDate && (
        <SubscriptionStatus 
            expirationDate={expirationDate} 
            userRole={user?.role || 'MORADOR'} 
            onRenewClick={() => navigate('/subscription/renew')}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Olá, {displayName.split(' ')[0]}</h1>
          <div className="flex items-center gap-2 text-emerald-600 font-bold mt-1">
            <Building size={18} />
            <span>{condoName}</span>
          </div>
          <p className="text-slate-500 flex items-center gap-2 mt-1 text-sm">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">Votzz OS 2.0</span>
        </div>
      </div>

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
              <p className="text-3xl font-black text-slate-800">{realStats.totalUsers || condoUsers.length}</p>
              <p className="text-xs text-slate-500 font-bold uppercase">Moradores</p>
           </div>
           <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-center">
              <CheckCircle className="text-emerald-500 mb-2" />
              <p className="text-3xl font-black text-slate-800">{realStats.yearlyVotes || totalVotes}</p>
              <p className="text-xs text-slate-500 font-bold uppercase">Votos (Ano)</p>
           </div>
        </div>
      </div>

      {isManager ? (
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
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <button onClick={() => setIsReportModalOpen(true)} className="bg-white border border-slate-200 hover:border-emerald-500 text-slate-600 p-4 rounded-xl shadow-sm transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center group">
                <div className="bg-emerald-50 p-2 rounded-full mb-2 group-hover:bg-emerald-100 transition-colors"><FileText className="w-6 h-6 text-emerald-600" /></div>
                <span className="font-bold text-sm">Relatórios Financeiros</span>
             </button>
        </div>
      )}

      {showUserList && isManager && (
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Shield className="w-5 h-5 text-emerald-600" /> Membros do Condomínio</h3>
            <div className="flex gap-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold self-center">{condoUsers.length} total</span>
                <button onClick={openCreateUser} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-700"><Plus size={14}/> Adicionar Usuário</button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar pr-2">
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

      {/* Chart Section - CORREÇÃO RECHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2 min-w-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Evolução de Participação</h2>
          </div>
          
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.length > 0 ? chartData : [{name: 'Jan', votos: 0}]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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

          {isManager && (
            <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-700 uppercase flex items-center gap-2 mb-4">
                    <ShieldAlert size={16} className="text-purple-600"/> Auditoria & Segurança
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 max-h-60 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {auditLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center italic">Nenhuma atividade registrada.</p>
                    ) : auditLogs.map(log => (
                        <div key={log.id} className="flex gap-3 text-xs border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                            <span className="font-mono text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleDateString()}</span>
                            <div>
                                <p className="font-bold text-slate-700">{log.action} <span className="font-normal text-slate-500">por {log.userName}</span></p>
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

           <div className="bg-white p-6 rounded-xl border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-emerald-500"/> Relatórios Recentes</h3>
             <div className="space-y-3">
               {reports.slice(0, 3).map(r => (
                 <div key={r.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                   <span className="text-slate-600 font-medium">{r.month} {r.year}</span>
                   <a href={fixUrl(r.url)} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold text-xs hover:underline uppercase tracking-tight">Ver PDF</a>
                 </div>
               ))}
               {reports.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum disponível.</p>}
               <button onClick={() => setIsReportModalOpen(true)} className="w-full text-center text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 hover:text-emerald-600 transition-colors">Ver histórico completo</button>
             </div>
           </div>

           {criticalAssemblies.length > 0 ? (
             <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
               <div className="flex items-center gap-2 mb-3">
                 <ShieldAlert className="w-5 h-5 text-orange-600" /><h3 className="font-bold text-orange-800">Atenção Necessária</h3>
               </div>
               <div className="space-y-3">
                 {criticalAssemblies.map(a => (
                   <div key={a.id} className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{a.titulo || a.title}</p>
                      <Link to={`/voting-room/${a.id}`} className="text-xs font-bold text-slate-500 mt-2 block hover:text-orange-600">Verificar Quórum &rarr;</Link>
                   </div>
                 ))}
               </div>
             </div>
           ) : (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[150px] flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-8 h-8 text-emerald-200 mb-3" /><h3 className="font-bold text-slate-700">Tudo em dia!</h3>
                <p className="text-xs text-slate-400 font-medium">Não há pendências críticas.</p>
             </div>
           )}
        </div>
      </div>

      {/* --- MODAL RELATÓRIOS --- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                <div className="flex justify-between mb-6">
                    <h3 className="font-black text-xl flex items-center gap-2 text-slate-800"><FileText className="text-blue-500"/> Relatórios Financeiros</h3>
                    <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-light">&times;</button>
                </div>
                {/* Apenas Gestores podem fazer upload */}
                {isManager && (
                    <div className="mb-8 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="text-xs font-black text-slate-500 mb-4 text-center uppercase tracking-widest">Adicionar Novo Relatório</p>
                        
                        <div className="flex gap-2 mb-4">
                            <select 
                                className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                value={reportForm.month}
                                onChange={e => setReportForm({...reportForm, month: e.target.value})}
                            >
                                {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <select 
                                className="flex-1 p-2.5 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                value={reportForm.year}
                                onChange={e => setReportForm({...reportForm, year: Number(e.target.value)})}
                            >
                                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative text-center group">
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                onChange={handleUploadReport} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                <Upload size={18}/> Selecionar PDF do Mês
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Lista de Relatórios - Visível para TODOS */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {reports.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">Nenhum arquivo encontrado.</p>}
                    {reports.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 p-2 rounded-lg"><FileCheck className="text-emerald-600" size={20}/></div>
                                <div>
                                    <p className="font-bold text-sm text-slate-700">{r.month} {r.year}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{r.fileName.substring(0, 20)}...</p>
                                </div>
                            </div>
                            <a href={fixUrl(r.url)} target="_blank" rel="noreferrer" className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Download size={16}/></a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL BANCO --- */}
      {isBankModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                <div className="flex justify-between mb-6">
                    <h3 className="font-black text-xl flex items-center gap-2 text-slate-800"><Banknote className="text-emerald-500"/> Dados de Recebimento</h3>
                    <button onClick={() => setIsBankModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-light">&times;</button>
                </div>
                <form onSubmit={handleSaveBankInfo} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Banco Institucional</label>
                            <input className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} placeholder="Ex: Itaú, Nubank..." required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Chave Pix Oficial</label>
                            <input className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" value={bankForm.pixKey} onChange={e => setBankForm({...bankForm, pixKey: e.target.value})} placeholder="CPF, E-mail ou Aleatória" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Agência</label>
                            <input className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" value={bankForm.agency} onChange={e => setBankForm({...bankForm, agency: e.target.value})} placeholder="0001" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Conta Corrente</label>
                            <input className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" value={bankForm.account} onChange={e => setBankForm({...bankForm, account: e.target.value})} placeholder="00000-0" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Integração Asaas (Wallet ID)</label>
                        <input className="w-full p-3 border border-slate-200 rounded-xl font-mono text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" value={bankForm.asaasWalletId} onChange={e => setBankForm({...bankForm, asaasWalletId: e.target.value})} placeholder="wallet_..." />
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold hover:bg-slate-800 shadow-xl transition-all">Salvar Configurações</button>
                </form>
             </div>
        </div>
      )}

      {/* --- MODAL USUÁRIO --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                <div className="flex justify-between mb-6">
                    <h3 className="font-black text-xl text-slate-800">{editingUser ? 'Editar Membro' : 'Novo Membro'}</h3>
                    <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-2xl font-light">&times;</button>
                </div>
                
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome do Morador</label>
                        <input 
                            required 
                            className={`w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 ${editingUser ? 'bg-slate-50' : 'bg-white'}`}
                            placeholder="Nome Completo" 
                            value={userForm.nome} 
                            onChange={e => setUserForm({...userForm, nome: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail de Login</label>
                        <input required type="email" className="w-full p-3 border border-slate-200 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" placeholder="exemplo@email.com" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nº Unidade</label>
                            <input className="w-full p-3 border border-slate-200 rounded-xl text-slate-700 outline-none" value={userForm.unidade} onChange={e => setUserForm({...userForm, unidade: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bloco/Torre</label>
                            <input className="w-full p-3 border border-slate-200 rounded-xl text-slate-700 outline-none" value={userForm.bloco} onChange={e => setUserForm({...userForm, bloco: e.target.value})} />
                        </div>
                    </div>
                    {/* CAMPO ADICIONADO: WhatsApp */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">WhatsApp / Telefone</label>
                        <input 
                            className="w-full p-3 border border-slate-200 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="(99) 99999-9999" 
                            value={userForm.whatsapp} 
                            onChange={e => setUserForm({...userForm, whatsapp: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nível de Acesso</label>
                        <select className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none bg-white" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                            <option value="MORADOR">MORADOR (Somente Voto)</option>
                            <option value="SINDICO">SÍNDICO (Gestor Geral)</option>
                            <option value="ADM_CONDO">ADMIN CONDO (Gestor Auxiliar)</option>
                        </select>
                    </div>
                    <div className="pt-2 border-t border-slate-100 mt-2">
                        <label className="text-[10px] font-black text-blue-600 uppercase ml-1 flex items-center gap-1"><Shield size={12}/> Redefinir Senha</label>
                        <input type="password" placeholder="Nova senha (opcional)" className="w-full p-3 border border-blue-100 rounded-xl bg-blue-50/30 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">Confirmar e Gravar</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>

    </div>
  );
};

export default Dashboard;