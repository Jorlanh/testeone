import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Users, Plus, AlertCircle, Archive, LayoutGrid, Download, Trash2, Edit } from 'lucide-react';
import api from '../services/api';
import { Assembly } from '../types';
import { useAuth } from '../context/AuthContext';

const AssemblyList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ATV' | 'HIS'>('ATV');

  const isManager = user?.role === 'MANAGER' || user?.role === 'SINDICO' || user?.role === 'ADMIN' || user?.role === 'ADM_CONDO';

  useEffect(() => {
    if (user || localStorage.getItem('token')) { 
      loadAssemblies();
    }
  }, [user]);

  const loadAssemblies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/assemblies');
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setAssemblies(data);
    } catch (err: any) {
      console.error("Erro ao carregar lista:", err);
      setError("Não foi possível carregar as assembleias.");
    } finally {
      setLoading(false);
    }
  };

  // --- AÇÕES DO SÍNDICO ---
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Evita entrar na sala
    if (window.confirm("Tem certeza que deseja EXCLUIR esta assembleia? Todos os votos e chat serão perdidos.")) {
        try {
            await api.delete(`/assemblies/${id}`);
            setAssemblies(prev => prev.filter(a => a.id !== id));
            alert("Assembleia excluída.");
        } catch (error) {
            alert("Erro ao excluir.");
        }
    }
  };

  const handleEdit = (assembly: Assembly, e: React.MouseEvent) => {
    e.preventDefault(); // Evita entrar na sala
    // Envia os dados da assembleia para a tela de criação para serem editados
    navigate('/create-assembly', { state: { assemblyData: assembly } });
  };

  // --- FILTROS ---
  const activeAssemblies = useMemo(() => {
    return assemblies.filter(a => {
      const s = (a.status || '').toString().toUpperCase().trim();
      return ['AGENDADA', 'SCHEDULED', 'ABERTA', 'OPEN', 'EM_ANDAMENTO', 'IN_PROGRESS', 'ACTIVE', 'ATV'].includes(s);
    });
  }, [assemblies]);
  
  const historicalAssemblies = useMemo(() => 
    assemblies.filter(a => {
      const s = (a.status || '').toString().toUpperCase().trim();
      return ['ENCERRADA', 'CLOSED', 'FINALIZADA', 'COMPLETED', 'HISTORICO'].includes(s);
    }), [assemblies]);

  const displayedAssemblies = activeTab === 'ATV' ? activeAssemblies : historicalAssemblies;

  const getStatusColor = (status: string) => {
    const s = (status || '').toUpperCase().trim();
    if (['ABERTA', 'OPEN', 'EM_ANDAMENTO'].includes(s)) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (['AGENDADA', 'SCHEDULED'].includes(s)) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (['ENCERRADA', 'CLOSED'].includes(s)) return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  const handleExportDossier = (id: string) => {
    // URL direta para backend
    const apiUrl = (import.meta as any).env.VITE_API_URL || 'https://votzz.com.br/api';
    window.open(`${apiUrl}/assemblies/${id}/dossier`, '_blank');
  };

  if (loading) return (
    <div className="p-20 text-center text-slate-500 animate-pulse font-bold flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      Carregando...
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assembleias e Votações</h1>
          <p className="text-slate-500 text-sm">Gerencie e participe das decisões do condomínio</p>
        </div>
        
        {isManager && (
          <Link 
            to="/create-assembly" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Assembleia</span>
          </Link>
        )}
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
        <button 
          onClick={() => setActiveTab('ATV')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ATV' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <LayoutGrid size={16} />
          Em Andamento ({activeAssemblies.length})
        </button>
        <button 
          onClick={() => setActiveTab('HIS')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'HIS' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Archive size={16} />
          Realizadas ({historicalAssemblies.length})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid gap-4">
        {displayedAssemblies.length > 0 ? displayedAssemblies.map((assembly) => {
          const rawDate = assembly.dataInicio || assembly.startDate;
          const displayDate = rawDate ? new Date(rawDate).toLocaleDateString('pt-BR') : 'Data a definir';
          const title = assembly.titulo || assembly.title || 'Sem título';
          const isClosed = historicalAssemblies.includes(assembly);
          
          return (
            <div key={assembly.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              {isClosed && <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rotate-45 translate-x-8 -translate-y-8 border-l border-slate-200" />}
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Link to={`/voting-room/${assembly.id}`} className="flex-1 cursor-pointer">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(assembly.status as string)}`}>
                        {assembly.status}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                          {isClosed ? 'Arquivo Histórico' : 'Assembleia Digital'}
                      </span>
                    </div>
                    <h3 className={`text-lg font-bold mb-1 ${isClosed ? 'text-slate-500' : 'text-slate-800'}`}>
                      {title}
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">{assembly.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-slate-500 font-medium">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className={`h-4 w-4 ${isClosed ? 'text-slate-400' : 'text-emerald-500'}`} />
                        <span>{displayDate}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Users className={`h-4 w-4 ${isClosed ? 'text-slate-400' : 'text-blue-500'}`} />
                        <span>{assembly.votes?.length || 0} Votos</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="flex flex-col md:flex-row items-center gap-2">
                  {/* Ações do Síndico */}
                  {isManager && !isClosed && (
                      <>
                        <button 
                            onClick={(e) => handleEdit(assembly, e)}
                            className="p-3 text-amber-500 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-all"
                            title="Editar Assembleia"
                        >
                            <Edit size={18} />
                        </button>
                        <button 
                            onClick={(e) => handleDelete(assembly.id, e)}
                            className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all"
                            title="Excluir Assembleia"
                        >
                            <Trash2 size={18} />
                        </button>
                      </>
                  )}

                  {isClosed && isManager && (
                    <button 
                      onClick={() => handleExportDossier(assembly.id)}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all w-full md:w-auto border border-blue-100"
                    >
                      <Download size={16} /> Dossiê
                    </button>
                  )}
                  
                  <Link 
                    to={`/voting-room/${assembly.id}`}
                    className={`inline-flex items-center justify-center px-6 py-3 border shadow-sm text-sm font-bold rounded-xl w-full md:w-auto transition-all ${
                        isClosed 
                        ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' 
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500 hover:text-emerald-600'
                    }`}
                  >
                    {isClosed ? 'Ver Resultados' : 'Entrar na Sala'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 font-medium">
            Nenhuma assembleia encontrada nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssemblyList;