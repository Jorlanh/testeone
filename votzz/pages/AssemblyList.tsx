import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Users, Plus, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Assembly } from '../types';
import { useAuth } from '../context/AuthContext';

const AssemblyList: React.FC = () => {
  const { user } = useAuth();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssemblies();
  }, []);

  const loadAssemblies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assemblies');
      setAssemblies(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar assembleias:", err);
      setError("Não foi possível carregar as assembleias.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABERTA': 
      case 'OPEN': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'AGENDADA': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ENCERRADA': 
      case 'CLOSED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Carregando assembleias...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assembleias e Votações</h1>
          <p className="text-slate-500">Participe das decisões reais do seu condomínio</p>
        </div>
        {(user?.role === 'MANAGER' || user?.role === 'SINDICO' || user?.role === 'ADM_CONDO') && (
          <Link 
            to="/create-assembly" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Assembleia</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {assemblies.map((assembly) => (
          <div key={assembly.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColor(assembly.status)}`}>
                    {assembly.status}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Decisão Coletiva</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{assembly.title || assembly.titulo}</h3>
                <p className="text-slate-600 text-sm line-clamp-2 mb-4">{assembly.description}</p>
                
                <div className="flex items-center space-x-6 text-sm text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">
                        {/* Correção do erro de Data */}
                        {assembly.startDate || assembly.dataInicio 
                            ? new Date(assembly.startDate || assembly.dataInicio!).toLocaleDateString() 
                            : 'Data a definir'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{assembly.votes?.length || 0} Votos</span>
                  </div>
                </div>
              </div>

              <div>
                <Link 
                  to={`/assembly/${assembly.id}`}
                  className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 shadow-sm text-sm font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 w-full md:w-auto transition-all hover:border-emerald-500 hover:text-emerald-600"
                >
                  {(user?.role === 'MANAGER' || user?.role === 'SINDICO') ? 'Gerenciar Sala' : 'Entrar na Sala'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {assemblies.length === 0 && !loading && !error && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500 font-medium">Nenhuma assembleia encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssemblyList;