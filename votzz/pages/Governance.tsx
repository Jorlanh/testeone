
import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  BarChart2, 
  CheckSquare, 
  Megaphone, 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  AlertCircle,
  FileText,
  UserCheck,
  Search,
  CheckCircle,
  ChevronRight,
  ShieldCheck,
  Bell,
  Target,
  Eye
} from 'lucide-react';
import { MockService } from '../services/mockDataService';
import { Poll, Announcement, User, GovernanceActivity } from '../types';

interface GovernanceProps {
  user: User | null;
}

const Governance: React.FC<GovernanceProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'polls' | 'comms' | 'calendar'>('dashboard');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activities, setActivities] = useState<GovernanceActivity[]>([]);
  
  // Create Poll State
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPollData, setNewPollData] = useState({ title: '', description: '', targetAudience: 'ALL', options: ['Sim', 'Não'] });

  // Create Announcement State
  const [showCreateAnn, setShowCreateAnn] = useState(false);
  const [newAnnData, setNewAnnData] = useState({ 
    title: '', 
    content: '', 
    priority: 'NORMAL', 
    targetType: 'ALL', 
    targetValue: '', 
    requiresConfirmation: false 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await MockService.getPolls();
    const a = await MockService.getAnnouncements();
    const act = await MockService.getGovernanceActivity();
    setPolls(p);
    setAnnouncements(a);
    setActivities(act);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    await MockService.createPoll({
       title: newPollData.title,
       description: newPollData.description,
       targetAudience: newPollData.targetAudience as any,
       options: newPollData.options.map((o, i) => ({ id: i.toString(), label: o })),
       endDate: new Date(Date.now() + 86400000 * 7).toISOString()
    });
    setShowCreatePoll(false);
    loadData();
  };

  const handleCreateAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    await MockService.createAnnouncement({
        title: newAnnData.title,
        content: newAnnData.content,
        priority: newAnnData.priority as any,
        targetType: newAnnData.targetType as any,
        targetValue: newAnnData.targetValue,
        requiresConfirmation: newAnnData.requiresConfirmation
    });
    setShowCreateAnn(false);
    loadData();
  }

  const handleVotePoll = async (pollId: string, optionId: string) => {
    if (!user) return;
    try {
        await MockService.votePoll(pollId, user.id, optionId);
        loadData();
    } catch (e: any) {
        alert(e.message);
    }
  }

  const handleReadAnnouncement = async (id: string) => {
      if(!user) return;
      await MockService.markAnnouncementRead(id, user.id);
      loadData();
  }

  const unreadCount = announcements.filter(a => user && !a.readBy.includes(user.id)).length;
  const activePolls = polls.filter(p => p.status === 'OPEN').length;

  return (
    <div className="space-y-8">
       {/* Header with Premium Badge */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-800">Governança Digital</h1>
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm flex items-center">
                    <StarIcon className="w-3 h-3 mr-1" /> Plano Anual
                </span>
            </div>
            <p className="text-slate-500">Gestão contínua, comunicados segmentados e micro-decisões.</p>
          </div>
          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
             <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={BarChart2} label="Visão Geral" />
             <TabButton active={activeTab === 'polls'} onClick={() => setActiveTab('polls')} icon={CheckSquare} label="Micro-decisões" />
             <TabButton active={activeTab === 'comms'} onClick={() => setActiveTab('comms')} icon={Megaphone} label="Comunicados" badge={unreadCount > 0 ? unreadCount : undefined} />
             <TabButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={CalendarIcon} label="Calendário" />
          </div>
       </div>

       {/* CONTENT: DASHBOARD */}
       {activeTab === 'dashboard' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
               {/* KPI Cards */}
               <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard title="Decisões Ativas" value={activePolls} icon={CheckSquare} color="text-blue-600" bg="bg-blue-100" />
                  <KpiCard title="Comunicados Não Lidos" value={unreadCount} icon={Bell} color="text-orange-600" bg="bg-orange-100" />
                  <KpiCard title="Participação Média" value="82%" icon={UserCheck} color="text-emerald-600" bg="bg-emerald-100" />
                  <KpiCard title="Ações no Período" value={activities.length} icon={FileText} color="text-purple-600" bg="bg-purple-100" />
               </div>

               {/* Activity Feed */}
               <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                       <Clock className="w-5 h-5 mr-2 text-slate-400" />
                       Linha do Tempo de Governança
                   </h3>
                   <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                       {activities.slice(0, 5).map((act, idx) => (
                           <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                               <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                   {act.type === 'VOTE' && <CheckSquare className="w-5 h-5" />}
                                   {act.type === 'POLL' && <BarChart2 className="w-5 h-5" />}
                                   {act.type === 'COMMUNICATION' && <Megaphone className="w-5 h-5" />}
                                   {act.type === 'BOOKING' && <CalendarIcon className="w-5 h-5" />}
                               </div>
                               <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
                                   <div className="flex items-center justify-between space-x-2 mb-1">
                                       <div className="font-bold text-slate-900 text-sm">{act.description}</div>
                                       <time className="font-mono text-xs text-slate-500">{new Date(act.date).toLocaleDateString()}</time>
                                   </div>
                                   <div className="text-xs text-slate-500">
                                       Responsável: <span className="font-medium text-slate-700">{act.user}</span>
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>

               {/* Quick Actions / Council Status */}
               <div className="space-y-6">
                   <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-10">
                           <ShieldCheck className="w-32 h-32" />
                       </div>
                       <h3 className="font-bold text-lg mb-2 relative z-10">Conselho Consultivo</h3>
                       <p className="text-slate-400 text-sm mb-6 relative z-10">Acesso exclusivo para membros do conselho realizarem pré-aprovações.</p>
                       <div className="space-y-3 relative z-10">
                           <div className="flex items-center justify-between text-sm bg-white/10 p-3 rounded-lg">
                               <span>Membros Ativos</span>
                               <span className="font-bold">5</span>
                           </div>
                           <div className="flex items-center justify-between text-sm bg-white/10 p-3 rounded-lg">
                               <span>Aprovações Pendentes</span>
                               <span className="font-bold text-amber-400">1</span>
                           </div>
                       </div>
                       <button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-sm transition-colors relative z-10">
                           Área do Conselho
                       </button>
                   </div>
                   
                   <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                       <h3 className="font-bold text-slate-800 mb-4">Relatórios Rápidos</h3>
                       <button className="w-full flex items-center justify-between p-3 text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg mb-2 transition-colors">
                           <span>Relatório Mensal de Governança</span>
                           <ChevronRight className="w-4 h-4" />
                       </button>
                       <button className="w-full flex items-center justify-between p-3 text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                           <span>Logs de Auditoria Completo</span>
                           <ChevronRight className="w-4 h-4" />
                       </button>
                   </div>
               </div>
           </div>
       )}

       {/* CONTENT: POLLS */}
       {activeTab === 'polls' && (
           <div className="space-y-6 animate-in fade-in">
               <div className="flex justify-between items-center">
                   <div>
                       <h2 className="text-xl font-bold text-slate-800">Micro-decisões e Enquetes</h2>
                       <p className="text-slate-500">Aprovações rápidas sem necessidade de assembleia formal.</p>
                   </div>
                   {user?.role === 'MANAGER' && (
                       <button onClick={() => setShowCreatePoll(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-emerald-700 transition-colors">
                           <Plus className="w-4 h-4 mr-2" /> Criar Enquete
                       </button>
                   )}
               </div>

               {showCreatePoll && (
                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-4">
                       <h3 className="font-bold mb-4">Nova Enquete Rápida</h3>
                       <form onSubmit={handleCreatePoll} className="space-y-4">
                           <input 
                               type="text" placeholder="Título da Decisão" required
                               className="w-full p-2 border rounded"
                               value={newPollData.title} onChange={e => setNewPollData({...newPollData, title: e.target.value})}
                           />
                           <textarea 
                               placeholder="Descrição..." required
                               className="w-full p-2 border rounded"
                               value={newPollData.description} onChange={e => setNewPollData({...newPollData, description: e.target.value})}
                           />
                           <select 
                               className="w-full p-2 border rounded"
                               value={newPollData.targetAudience} onChange={e => setNewPollData({...newPollData, targetAudience: e.target.value})}
                           >
                               <option value="ALL">Todos os Moradores</option>
                               <option value="COUNCIL">Apenas Conselho Fiscal</option>
                           </select>
                           <div className="flex justify-end gap-2">
                               <button type="button" onClick={() => setShowCreatePoll(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                               <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Publicar</button>
                           </div>
                       </form>
                   </div>
               )}

               <div className="grid md:grid-cols-2 gap-6">
                   {polls.map(poll => {
                       const userVoted = poll.votes.find(v => v.userId === user?.id);
                       const isVisible = poll.targetAudience === 'ALL' || (poll.targetAudience === 'COUNCIL' && (user?.role === 'MANAGER' || user?.email.includes('maria'))); // Mock logic for council check

                       if (!isVisible) return null;

                       return (
                           <div key={poll.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                               <div className="flex justify-between items-start mb-4">
                                   <div>
                                       {poll.targetAudience === 'COUNCIL' && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold mb-2 inline-block">Conselho</span>}
                                       <h3 className="font-bold text-slate-900 text-lg">{poll.title}</h3>
                                       <p className="text-slate-500 text-sm mt-1">{poll.description}</p>
                                   </div>
                                   <div className={`px-2 py-1 rounded text-xs font-bold ${poll.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                                       {poll.status === 'OPEN' ? 'ABERTA' : 'ENCERRADA'}
                                   </div>
                               </div>
                               
                               <div className="space-y-2">
                                   {poll.options.map(opt => {
                                       const voteCount = poll.votes.filter(v => v.optionId === opt.id).length;
                                       const total = poll.votes.length || 1;
                                       const percent = Math.round((voteCount / total) * 100);
                                       const isSelected = userVoted?.optionId === opt.id;

                                       return (
                                           <button 
                                               key={opt.id}
                                               disabled={!!userVoted || poll.status === 'CLOSED'}
                                               onClick={() => handleVotePoll(poll.id, opt.id)}
                                               className={`w-full relative overflow-hidden border rounded-lg p-3 text-left transition-all ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200 hover:bg-slate-50'}`}
                                           >
                                               <div className="absolute top-0 left-0 bottom-0 bg-slate-100 transition-all duration-500" style={{ width: userVoted ? `${percent}%` : '0%' }}></div>
                                               <div className="relative z-10 flex justify-between">
                                                   <span className={`font-medium ${isSelected ? 'text-emerald-700' : 'text-slate-700'}`}>{opt.label}</span>
                                                   {userVoted && <span className="text-slate-500 text-sm">{percent}% ({voteCount})</span>}
                                               </div>
                                           </button>
                                       );
                                   })}
                               </div>
                               {userVoted && <p className="text-center text-xs text-slate-400 mt-4">Voto registrado em {new Date().toLocaleDateString()}</p>}
                           </div>
                       );
                   })}
               </div>
           </div>
       )}

       {/* CONTENT: COMMUNICATIONS */}
       {activeTab === 'comms' && (
            <div className="space-y-6 animate-in fade-in">
                 <div className="flex justify-between items-center">
                   <div>
                       <h2 className="text-xl font-bold text-slate-800">Mural Oficial</h2>
                       <p className="text-slate-500">Comunicados e avisos com confirmação de leitura.</p>
                   </div>
                   {user?.role === 'MANAGER' && (
                       <button onClick={() => setShowCreateAnn(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center hover:bg-emerald-700 transition-colors">
                           <Plus className="w-4 h-4 mr-2" /> Novo Comunicado
                       </button>
                   )}
               </div>

                {showCreateAnn && (
                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in slide-in-from-top-4">
                       <h3 className="font-bold mb-4">Novo Comunicado Oficial</h3>
                       <form onSubmit={handleCreateAnn} className="space-y-4">
                           <input 
                               type="text" placeholder="Título" required
                               className="w-full p-2 border rounded"
                               value={newAnnData.title} onChange={e => setNewAnnData({...newAnnData, title: e.target.value})}
                           />
                           <textarea 
                               placeholder="Conteúdo do aviso..." required
                               className="w-full p-2 border rounded"
                               value={newAnnData.content} onChange={e => setNewAnnData({...newAnnData, content: e.target.value})}
                           />
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Prioridade</label>
                                <select 
                                    className="w-full p-2 border rounded"
                                    value={newAnnData.priority} onChange={e => setNewAnnData({...newAnnData, priority: e.target.value})}
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">Alta Prioridade</option>
                                    <option value="LOW">Baixa Prioridade</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Destinatário (Segmentação)</label>
                                <select 
                                    className="w-full p-2 border rounded"
                                    value={newAnnData.targetType} onChange={e => setNewAnnData({...newAnnData, targetType: e.target.value})}
                                >
                                    <option value="ALL">Todos os Moradores</option>
                                    <option value="BLOCK">Bloco Específico</option>
                                    <option value="UNIT">Unidade Específica</option>
                                </select>
                              </div>
                           </div>
                           {(newAnnData.targetType === 'BLOCK' || newAnnData.targetType === 'UNIT') && (
                              <input 
                                 type="text" placeholder={newAnnData.targetType === 'BLOCK' ? 'Ex: Bloco A' : 'Ex: 101-A'}
                                 className="w-full p-2 border rounded"
                                 value={newAnnData.targetValue} onChange={e => setNewAnnData({...newAnnData, targetValue: e.target.value})}
                              />
                           )}
                           
                           <div className="flex items-center gap-2 bg-slate-50 p-3 rounded">
                              <input 
                                type="checkbox" 
                                id="reqConf"
                                checked={newAnnData.requiresConfirmation}
                                onChange={e => setNewAnnData({...newAnnData, requiresConfirmation: e.target.checked})}
                              />
                              <label htmlFor="reqConf" className="text-sm text-slate-700">Exigir confirmação de leitura</label>
                           </div>

                           <div className="flex justify-end gap-2">
                               <button type="button" onClick={() => setShowCreateAnn(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                               <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">Publicar</button>
                           </div>
                       </form>
                   </div>
               )}

               <div className="space-y-4">
                  {announcements.map(ann => {
                      const isRead = user && ann.readBy.includes(user.id);
                      return (
                          <div key={ann.id} className={`p-6 rounded-xl border transition-all ${!isRead ? 'bg-white border-l-4 border-l-orange-500 border-y-slate-200 border-r-slate-200 shadow-md' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
                              <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                      {ann.priority === 'HIGH' && <AlertCircle className="w-5 h-5 text-red-500" />}
                                      <h3 className="font-bold text-lg text-slate-900">{ann.title}</h3>
                                      {!isRead && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-bold">Novo</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {ann.targetType !== 'ALL' && (
                                      <span className="flex items-center text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">
                                        <Target className="w-3 h-3 mr-1" /> {ann.targetType}: {ann.targetValue}
                                      </span>
                                    )}
                                    <span className="text-xs text-slate-500">{new Date(ann.date).toLocaleDateString()}</span>
                                  </div>
                              </div>
                              <p className="text-slate-600 mb-4">{ann.content}</p>
                              
                              <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                                  <div className="flex items-center gap-4">
                                    <div className="text-xs text-slate-400 flex items-center">
                                        <Eye className="w-3 h-3 mr-1" /> {ann.readBy.length} visualizações
                                    </div>
                                    {ann.requiresConfirmation && (
                                       <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">Leitura Obrigatória</span>
                                    )}
                                  </div>
                                  {!isRead ? (
                                      <button onClick={() => handleReadAnnouncement(ann.id)} className="text-sm font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded transition-colors">
                                          Confirmar Leitura
                                      </button>
                                  ) : (
                                      <div className="flex items-center text-emerald-600 text-sm font-medium">
                                          <CheckCircle className="w-4 h-4 mr-1" /> Lido
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
               </div>
            </div>
       )}

       {/* CONTENT: CALENDAR (Simplified) */}
       {activeTab === 'calendar' && (
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center animate-in fade-in">
               <CalendarIcon className="w-16 h-16 text-slate-200 mb-4" />
               <h3 className="text-xl font-bold text-slate-800">Calendário de Governança</h3>
               <p className="text-slate-500 max-w-md mx-auto mb-6">Visualize todas as datas importantes, vencimentos de enquetes e manutenções programadas em um único lugar.</p>
               <div className="grid gap-4 w-full max-w-2xl text-left">
                   <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex gap-4 items-center">
                       <div className="bg-white p-2 rounded border border-slate-200 text-center w-16">
                           <span className="block text-xs text-slate-500 uppercase">Jun</span>
                           <span className="block text-xl font-bold text-slate-900">15</span>
                       </div>
                       <div>
                           <h4 className="font-bold text-slate-800">Festa Junina (Previsão)</h4>
                           <p className="text-sm text-slate-500">Evento Social</p>
                       </div>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex gap-4 items-center">
                       <div className="bg-white p-2 rounded border border-slate-200 text-center w-16">
                           <span className="block text-xs text-slate-500 uppercase">Jun</span>
                           <span className="block text-xl font-bold text-slate-900">20</span>
                       </div>
                       <div>
                           <h4 className="font-bold text-slate-800">Fim da Enquete: Espreguiçadeiras</h4>
                           <p className="text-sm text-slate-500">Governança</p>
                       </div>
                   </div>
               </div>
           </div>
       )}

    </div>
  );
};

// UI Helpers
const TabButton = ({ active, onClick, icon: Icon, label, badge }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-all ${active ? 'bg-white shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
    >
        <Icon className="w-4 h-4 mr-2" />
        {label}
        {badge && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{badge}</span>}
    </button>
);

const KpiCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`${bg} p-2 rounded-lg`}>
            <Icon className={`w-5 h-5 ${color}`} />
        </div>
    </div>
);

const StarIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
);

export default Governance;
