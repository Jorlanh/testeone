import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AffiliateDashboardDTO } from '../../types';
import { Wallet, Link as LinkIcon, TrendingUp } from 'lucide-react';

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AffiliateDashboardDTO | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;
      try {
        const response = await api.get<AffiliateDashboardDTO>(`/afiliado/${user.id}/dashboard`);
        setData(response.data);
      } catch (error) {
        console.error('Erro ao carregar dashboard de afiliado', error);
      }
    };
    fetchDashboard();
  }, [user]);

  if (!data) return <div className="p-8">A carregar os teus ganhos...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel do Parceiro Votzz</h1>
      <p className="text-gray-600 mb-8">Acompanha as tuas comissões e indicações.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span>Saldo Disponível (Saque)</span>
            <Wallet />
          </div>
          <span className="text-4xl font-bold">R$ {data.saldoDisponivel.toFixed(2)}</span>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4 text-gray-500">
            <span>Saldo Futuro (Bloqueado)</span>
            <TrendingUp />
          </div>
          <span className="text-4xl font-bold text-gray-800">R$ {data.saldoFuturo.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" /> O teu Link de Indicação
        </h3>
        <div className="flex gap-4">
          <input 
            readOnly 
            value={data.linkIndicacao}
            className="flex-1 p-3 bg-gray-100 rounded border border-gray-300 text-gray-600"
          />
          <button 
            onClick={() => navigator.clipboard.writeText(data.linkIndicacao)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded font-medium"
          >
            Copiar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;