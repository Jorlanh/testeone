import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Megaphone, 
  TrendingUp, 
  Clock,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Wallet,
  Shield
} from 'lucide-react';
import { MockService } from '../services/mockDataService';
import { api } from '../services/api'; // Adicionado para dados reais
import { Assembly, User } from '../types';

interface DashboardProps {
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  // --- NOVOS ESTADOS PARA DADOS REAIS ---
  const [financial, setFinancial] = useState({ balance: 0, lastUpdate: '' });
  const [condoUsers, setCondoUsers] = useState<User[]>([]);
  const [showUserList, setShowUserList] = useState(false); // Estado para controlar a exibição da lista

  useEffect(() => {
    // Mantendo sua lógica original e acrescentando a carga de dados reais
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Busca assembleias (Real), Saldo (Real) e Usuários (Real)
      const [assData, finData, usersData] = await Promise.all([
        api.get('/assemblies'),
        api.get('/financial/balance'),
        api.get('/users')
      ]);
      setAssemblies(assData || []);
      setFinancial(finData || { balance: 0, lastUpdate: 'N/A' });
      setCondoUsers(usersData || []);
    } catch (e) {
      console.error("Erro ao carregar dados do backend");
      // Fallback para não quebrar o visual caso o banco esteja vazio
      MockService.getAssemblies().then(setAssemblies);
    }
  };

  // --- NOVA FUNÇÃO: PROMOVER USUÁRIO ---
  const handlePromoteUser = async (userId: string) => {
    if (window.confirm("Deseja dar cargo de Administrador a este usuário?")) {
      await api.patch(`/users/${userId}/role`, { role: 'MANAGER' });
      alert("Usuário promovido!");
      loadData();
    }
  };

  const activeAssemblies = assemblies.filter(a => a.status === 'OPEN');
  const totalVotes = assemblies.reduce((acc, curr) => acc + (curr.votes?.length || 0), 0);

  // Mock Data for Charts (Mantidos para preservar o seu design)
  const chartData = [
    { name: 'Jan', votos: 40, participacao: 20 },
    { name: 'Fev', votos: 30, participacao: 25 },
    { name: 'Mar', votos: 20, participacao: 15 },
    { name: 'Abr', votos: 65, participacao: 55 },
    { name: 'Mai', votos: 45, participacao: 40 },
    { name: 'Jun', votos: 80, participacao: 70 },
  ];

  const engagementData = [
    { name: 'Votaram', value: 78, color: '#10b981' }, 
    { name: 'Pendentes', value: 22, color: '#e2e8f0' }
  ];

  const criticalAssemblies = activeAssemblies.filter(a => {
    const hoursLeft = (new Date(a.endDate).getTime() - Date.now()) / 36e5;
    return hoursLeft < 48 && hoursLeft > 0;
  });

  const isManager = user?.role === 'MANAGER';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isManager ? `Olá, Síndico ${user?.name.split(' ')[0]}` : `Olá, ${user?.name.split(' ')[0]}`}
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

      {/* --- ACRESCIMO: CARD DE SALDO REAL COM INSERÇÃO MANUAL --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl border-b-4 border-emerald-500 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Saldo Atual em Caixa</p>
            <h2 className="text-4xl font-black mt-2">R$ {financial.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            <p className="text-slate-400 text-xs mt-4 italic">Última atualização do ADM: {financial.lastUpdate}</p>
            
            {/* Permite ao Administrador atualizar a hora que quiser */}
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

      {/* Quick Actions (Manager Only) */}
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

          {/* AO CLICAR AQUI, ALTERNA A EXIBIÇÃO DA LISTA DE USUÁRIOS */}
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
          { title: 'Total de Votos (Ano)', value: totalVotes + 124, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' }, // Mock +124 historic
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

      {/* --- ACRESCIMO: LISTA DE USUÁRIOS REAIS (APARECE QUANDO CLICADO NO BOTÃO ACIMA) --- */}
      {showUserList && isManager && (
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
              <Shield className="w-5 h-5 text-emerald-600" /> Membros Cadastrados no Banco de Dados
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
                    <td className="py-4 px-2 font-bold text-slate-700">{u.name}</td>
                    <td className="py-4 px-2 text-slate-600">{u.unit}</td>
                    <td className="py-4 px-2 text-right">
                      {u.role !== 'MANAGER' ? (
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
        {/* Main Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Evolução de Participação</h2>
            <select className="text-sm border-none bg-slate-50 rounded-lg px-2 py-1 text-slate-600 focus:ring-0 cursor-pointer">
              <option>Últimos 6 meses</option>
              <option>Este Ano</option>
            </select>
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
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="votos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVotos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Quorum */}
        <div className="space-y-6">
            <Link to="/governance" className="block bg-blue-600 p-6 rounded-2xl text-white shadow-lg hover:bg-blue-700 transition-all group">
              <h3 className="font-bold flex items-center justify-between">
                Abrir Chamado <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </h3>
              <p className="text-blue-100 text-xs mt-2">Relate problemas técnicos ou de convivência à administração.</p>
            </Link>

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

           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-4 text-sm">Status Quórum (AGE Atual)</h3>
             <div className="h-40 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {engagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                   <span className="text-2xl font-bold text-slate-800">78%</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Atividades Recentes no Condomínio</h2>
          <Link to="/reports" className="text-sm text-emerald-600 font-medium hover:underline flex items-center">
            Ver tudo <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
           {[
             { user: 'Apto 302', action: 'Votou na Assembleia AGE Fachada', time: '10 min atrás', icon: CheckCircle, color: 'text-emerald-500' },
             { user: 'Síndico', action: 'Publicou novo comunicado: Elevador', time: '1 hora atrás', icon: Megaphone, color: 'text-blue-500' },
             { user: 'Apto 104', action: 'Comentou na pauta de Reforma', time: '3 horas atrás', icon: FileText, color: 'text-slate-400' },
             { user: 'Sistema', action: 'Backup diário realizado', time: '5 horas atrás', icon: ShieldAlert, color: 'text-slate-400' },
           ].map((item, idx) => (
             <div key={idx} className="p-4 flex items-center hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4`}>
                   <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                   <p className="text-sm font-medium text-slate-800">
                     <span className="font-bold">{item.user}</span> {item.action}
                   </p>
                   <p className="text-xs text-slate-500">{item.time}</p>
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                  <ArrowRight className="w-4 h-4" />
                </button>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;