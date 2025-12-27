import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AdminDashboardStats } from '../../types';
import { Users, Building, DollarSign, Activity } from 'lucide-react';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get<AdminDashboardStats>('/admin/dashboard-stats');
        setStats(response.data);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8 text-center">A carregar dados do Votzz...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Painel do Super Admin (God Mode)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<Building className="w-8 h-8 text-blue-600" />}
          title="Total Condomínios"
          value={stats?.totalTenants || 0}
        />
        <StatCard 
          icon={<Activity className="w-8 h-8 text-green-600" />}
          title="Condomínios Ativos"
          value={stats?.activeTenants || 0}
        />
        <StatCard 
          icon={<Users className="w-8 h-8 text-purple-600" />}
          title="Total Utilizadores"
          value={stats?.totalUsers || 0}
        />
        <StatCard 
          icon={<DollarSign className="w-8 h-8 text-yellow-600" />}
          title="MRR Estimado"
          value={`R$ ${stats?.mrr?.toFixed(2) || '0.00'}`}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Gestão Rápida de Condomínios</h2>
        <p className="text-gray-500">A tabela de gestão de tenants e reset de palavras-chave será implementada aqui.</p>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value }: { icon: any, title: string, value: string | number }) => (
  <div className="bg-white p-6 rounded-lg shadow flex items-center space-x-4">
    <div className="p-3 bg-gray-100 rounded-full">{icon}</div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default SuperAdminDashboard;