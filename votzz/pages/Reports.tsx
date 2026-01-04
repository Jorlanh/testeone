import React, { useEffect, useState } from 'react';
import { Download, Search, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { AuditLog } from '../types';

const Reports: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CORREÇÃO: Usa a rota de tenant (filtrada) em vez de admin (global)
    // Isso evita o erro 403 Forbidden para síndicos
    api.get('/tenants/audit-logs')
       .then(res => {
           setLogs(res.data || []);
           setLoading(false);
       })
       .catch(err => {
           console.error("Erro ao carregar auditoria:", err);
           setLoading(false);
       });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Relatórios & Auditoria</h1>
          <p className="text-slate-500">Log imutável de ações para compliance</p>
        </div>
        <button className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Download className="h-4 w-4" />
          <span>Exportar PDF</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <ShieldAlert size={18} className="text-emerald-600"/> Registro de Atividades
          </h3>
          <div className="relative">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Buscar usuário ou ação..."
               className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none w-64"
             />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
              <tr>
                <th className="px-6 py-3">Data/Hora</th>
                <th className="px-6 py-3">Ação</th>
                <th className="px-6 py-3">Responsável</th>
                <th className="px-6 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 animate-pulse">Carregando registros...</td></tr>
              ) : logs.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">Nenhum registro encontrado.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 font-bold">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {log.userName || log.userId}
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-md truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;