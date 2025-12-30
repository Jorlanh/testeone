import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Users, FileText, CheckCircle, AlertTriangle, Plus, Megaphone, TrendingUp, Clock, ArrowRight, ShieldAlert, Calendar, Wallet, Shield
} from 'lucide-react';
import api from '../services/api'; 
import { Assembly, User } from '../types';
import { useAuth } from '../context/AuthContext'; // [CORREÇÃO] Importando useAuth
import { SubscriptionStatus } from '../components/SubscriptionStatus';

interface DashboardProps {
  user: User | null; // Mantido para compatibilidade, mas preferimos usar o contexto
}

const Dashboard: React.FC<DashboardProps> = ({ user: propUser }) => {
  const { user: contextUser } = useAuth(); // [CORREÇÃO] Pega usuário do contexto para ter dados atualizados
  const user = contextUser || propUser; // Prioriza contexto
  
  const navigate = useNavigate();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [financial, setFinancial] = useState({ balance: 0, lastUpdate: '' });
  const [condoUsers, setCondoUsers] = useState<User[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assData, finData, usersData, tenantData] = await Promise.all([
        api.get('/assemblies'),
        api.get('/financial/balance'),
        api.get('/users'),
        api.get('/tenants/my-subscription')
      ]);
      
      setAssemblies(assData.data || []);
      setFinancial(finData.data || { balance: 0, lastUpdate: 'N/A' });
      setCondoUsers(usersData.data || []);
      
      if (tenantData.data?.expirationDate) {
        setExpirationDate(tenantData.data.expirationDate);
      }
    } catch (e) {
      console.error("Erro ao carregar dados do backend");
    }
  };

  const handlePromoteUser = async (userId: string) => {
    if (window.confirm("Deseja dar cargo de Administrador a este usuário?")) {
      await api.patch(`/users/${userId}/role`, { role: 'MANAGER' });
      alert("Usuário promovido!");
      loadData();
    }
  };

  const handleRenew = () => {
    navigate('/subscription/renew');
  };

  const activeAssemblies = assemblies.filter(a => a.status === 'OPEN');
  const totalVotes = assemblies.reduce((acc, curr) => acc + (curr.votes?.length || 0), 0);

  const chartData = [
    { name: 'Jan', votos: 40 }, { name: 'Fev', votos: 30 }, { name: 'Mar', votos: 20 },
    { name: 'Abr', votos: 65 }, { name: 'Mai', votos: 45 }, { name: 'Jun', votos: 80 },
  ];

  const criticalAssemblies = activeAssemblies.filter(a => {
    const hoursLeft = (new Date(a.endDate).getTime() - Date.now()) / 36e5;
    return hoursLeft < 48 && hoursLeft > 0;
  });

  const isManager = user?.role === 'MANAGER' || user?.role === 'SINDICO' || user?.role === 'ADM_CONDO';

  // [CORREÇÃO] Nome de exibição robusto
  const displayName = user?.nome || user?.name || user?.email?.split('@')[0] || 'Morador';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {expirationDate && (
        <SubscriptionStatus 
            expirationDate={expirationDate} 
            userRole={user?.role || 'MORADOR'} 
            onRenewClick={handleRenew}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
             {/* [CORREÇÃO] Saudação usando o nome processado */}
             Olá, {displayName.split(' ')[0]}
          </h1>
          <p className="text-slate-500 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
             Sistema Operacional
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border-b-4 border-emerald-500 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Saldo Atual em Caixa</p>
            <h2 className="text-4xl font-black mt-2">R$ {financial.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            <p className="text-slate-400 text-xs mt-4 italic">Última atualização do ADM: {financial.lastUpdate}</p>
            
            {isManager && (
              <button 
                onClick={() => {
                  const val = prompt("Informe o saldo atualizado (R$):", financial.balance.toString());
                  if(val && !isNaN(parseFloat(val))) {
                    api.post('/financial/update', { balance: parseFloat(val) }).then(loadData);
                  }
                }}
                className="mt-6 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-bold text-[10px] uppercase transition-all shadow-lg"
              >
                <Plus size={14} /> Atualizar Saldo Agora
              </button>
            )}
          </div>
          <Wallet className="absolute right-[-10px] bottom-[-10px] text-white/5 w-40 h-40" />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-center">
              <Users className="text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-slate-800">{condoUsers.length}</p>
              <p className="text-xs text-slate-500 font-medium">Moradores Reais</p>
           </div>
           <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-center">
              <CheckCircle className="text-emerald-500 mb-2" />
              <p className="text-2xl font-bold text-slate-800">{totalVotes}</p>
              <p className="text-xs text-slate-500 font-medium">Votos Computados</p>
           </div>
        </div>
      </div>

      {isManager && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/create-assembly" className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl shadow-md transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center group">
            <div className="bg-white/20 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm">Nova Assembleia</span>
          </Link>
          
          <Link to="/governance" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-md transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center group">
            <div className="bg-white/20 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
              <Megaphone className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm">Novo Comunicado</span>
          </Link>

          <Link to="/reports" className="bg-slate-700 hover:bg-slate-800 text-white p-4 rounded-xl shadow-md transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center group">
            <div className="bg-white/20 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm">Relatórios</span>
          </Link>

          <div 
            onClick={() => setShowUserList(!showUserList)}
            className={`bg-white border p-4 rounded-xl shadow-sm transition-all flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 ${showUserList ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200 text-slate-600'}`}
          >
            <div className={`p-2 rounded-full mb-2 ${showUserList ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <Users className={`w-6 h-6 ${showUserList ? 'text-emerald-600' : 'text-slate-500'}`} />
            </div>
            <span className={`text-sm ${showUserList ? 'font-bold text-emerald-700' : 'font-medium'}`}>
              {showUserList ? 'Fechar Gestão' : 'Gerenciar Usuários'}
            </span>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Assembleias Abertas', value: activeAssemblies.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
          { title: 'Total de Votos (Ano)', value: totalVotes + 124, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { title: 'Engajamento Médio', value: '78%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
          { title: 'Atenção Necessária', value: criticalAssemblies.length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
             <div>
                <p className="text-slate-500 text-xs font-medium uppercase">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
             </div>
             <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
             </div>
          </div>
        ))}
      </div>

      {showUserList && isManager && (
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
              <Shield className="w-5 h-5 text-emerald-600" /> Membros Cadastrados
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-bold">
              {condoUsers.length} total
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-3 px-2 font-medium">Nome Completo</th>
                  <th className="pb-3 px-2 font-medium">Unidade</th>
                  <th className="pb-3 px-2 font-medium text-right">Ações de Cargo</th>
                </tr>
              </thead>
              <tbody>
                {condoUsers.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-2 font-bold text-slate-700">{u.nome || u.name}</td>
                    <td className="py-4 px-2 text-slate-600">{u.unidade || u.unit}</td>
                    <td className="py-4 px-2 text-right">
                      {u.role !== 'MANAGER' && u.role !== 'SINDICO' ? (
                        <button 
                          onClick={() => handlePromoteUser(u.id)}
                          className="text-xs font-black text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                        >
                          PROMOVER A ADM
                        </button>
                      ) : (
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          <Shield size={12} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">Administrador</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Evolução de Participação</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVotos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="votos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVotos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
            {/* [ATUALIZADO] Botão leva para a página de Chamados */}
            <button 
              onClick={() => navigate('/tickets')}
              className="w-full block bg-blue-600 p-6 rounded-2xl text-white shadow-lg hover:bg-blue-700 transition-all group text-left"
            >
              <h3 className="font-bold flex items-center justify-between">
                Abrir Chamado <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-blue-100 text-xs mt-2">Relate problemas técnicos ou de convivência à administração.</p>
            </button>

           {criticalAssemblies.length > 0 ? (
             <div className="bg-orange-50 p-5 rounded-xl border border-orange-100">
               <div className="flex items-center gap-2 mb-3">
                 <ShieldAlert className="w-5 h-5 text-orange-600" />
                 <h3 className="font-bold text-orange-800">Atenção Necessária</h3>
               </div>
               <div className="space-y-3">
                 {criticalAssemblies.map(a => (
                   <div key={a.id} className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                      <p className="text-sm font-bold text-slate-800 line-clamp-1">{a.title}</p>
                      <p className="text-xs text-orange-600 mt-1 flex items-center">
                        <Clock className="w-3 h-3 mr-1" /> Encerra em breve
                      </p>
                      <Link to={`/assembly/${a.id}`} className="text-xs font-bold text-slate-500 mt-2 block hover:text-orange-600">
                        Verificar Quórum &rarr;
                      </Link>
                   </div>
                 ))}
               </div>
             </div>
           ) : (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[150px] flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-8 h-8 text-emerald-200 mb-3" />
                <h3 className="font-bold text-slate-700">Tudo em dia!</h3>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;