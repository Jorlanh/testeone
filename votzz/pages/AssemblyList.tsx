import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Users, Plus, AlertCircle, Archive, LayoutGrid, FileText, Download } from 'lucide-react';
import api from '../services/api';
import { Assembly } from '../types';
import { useAuth } from '../context/AuthContext';

const AssemblyList: React.FC = () => {
  const { user } = useAuth();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'ATV' | 'HIS'>('ATV');

  const isManager = user?.role === 'MANAGER' || user?.role === 'SINDICO' || user?.role === 'ADMIN' || user?.role === 'ADM_CONDO';

  useEffect(() => {
    loadAssemblies();
  }, []);

  const loadAssemblies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/assemblies');
      const data = Array.isArray(res.data) ? res.data : [];
      setAssemblies(data);
    } catch (err: any) {
      setError("Erro ao carregar a lista. Verifique seu vínculo com o condomínio.");
    } finally {
      setLoading(false);
    }
  };

  // LÓGICA DE FILTRAGEM CORRIGIDA: Inclui AGENDADA, ABERTA, OPEN, etc.
  const activeAssemblies = useMemo(() => 
    assemblies.filter(a => {
      const s = a.status?.toUpperCase() || '';
      return s !== 'ENCERRADA' && s !== 'CLOSED' && s !== '';
    }), [assemblies]);
  
  const historicalAssemblies = useMemo(() => 
    assemblies.filter(a => {
      const s = a.status?.toUpperCase() || '';
      return s === 'ENCERRADA' || s === 'CLOSED';
    }), [assemblies]);

  const displayedAssemblies = activeTab === 'ATV' ? activeAssemblies : historicalAssemblies;

  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase() || '';
    switch (s) {
      case 'ABERTA': 
      case 'OPEN': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'AGENDADA': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ENCERRADA': 
      case 'CLOSED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const handleExportDossier = (id: string) => {
    window.open(`http://localhost:8080/api/assemblies/${id}/dossier`, '_blank');
  };

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse font-bold">Carregando assembleias...</div>;

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
          const isClosed = historicalAssemblies.includes(assembly);
          
          return (
            <div key={assembly.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              {isClosed && <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rotate-45 translate-x-8 -translate-y-8 border-l border-slate-200" />}
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(assembly.status)}`}>
                      {assembly.status}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        {isClosed ? 'Arquivo Histórico' : 'Assembleia Digital'}
                    </span>
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${isClosed ? 'text-slate-500' : 'text-slate-800'}`}>
                    {assembly.titulo || assembly.title}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">{assembly.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-slate-500 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className={`h-4 w-4 ${isClosed ? 'text-slate-400' : 'text-emerald-500'}`} />
                      <span>{rawDate ? new Date(rawDate).toLocaleDateString('pt-BR') : 'Data a definir'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Users className={`h-4 w-4 ${isClosed ? 'text-slate-400' : 'text-blue-500'}`} />
                      <span>{assembly.votes?.length || 0} Votos</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-2">
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
                    {isClosed ? 'Ver Resultados' : (isManager ? 'Gerenciar' : 'Votar')}
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