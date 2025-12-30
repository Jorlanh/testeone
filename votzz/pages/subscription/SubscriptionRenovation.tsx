import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Shield, Calendar, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

const SubscriptionRenovation: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRenovation = async () => {
    if(!window.confirm("Confirmar renovação por mais 12 meses?")) return;
    
    setLoading(true);
    try {
      // Chama o backend para somar 12 meses à data atual
      await api.post('/subscription/renew', { months: 12 });
      
      alert("Assinatura renovada com sucesso!");
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert("Erro ao processar renovação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative">
          <button onClick={() => navigate('/dashboard')} className="absolute left-6 top-6 text-slate-400 hover:text-white transition-colors">
             <ArrowLeft />
          </button>
          <Shield className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Renovação de Assinatura</h1>
          <p className="text-slate-400 mt-2">Garanta o acesso contínuo ao Votzz para seu condomínio.</p>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-emerald-800 text-lg mb-4">Resumo do Plano Anual</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-slate-700">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> Acesso total à Gestão Financeira
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> Assembleias Online Ilimitadas
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> Gestão de Reservas e Áreas Comuns
              </li>
              <li className="flex items-center gap-2 text-slate-700">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> App para Moradores Ilimitados
              </li>
            </ul>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-t border-b py-6 border-slate-100">
            <div>
               <p className="text-sm text-slate-500 font-medium uppercase">Valor da Renovação</p>
               <p className="text-3xl font-black text-slate-800">R$ 1.199,90 <span className="text-sm font-normal text-slate-400">/ ano</span></p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold">
               <Calendar className="w-4 h-4" /> +12 Meses de Validade
            </div>
          </div>

          <button
            onClick={handleRenovation}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : (
              <>
                <CreditCard className="w-6 h-6" /> Pagar e Renovar Agora
              </>
            )}
          </button>
          
          <p className="text-center text-xs text-slate-400 mt-4">
            Pagamento seguro via PIX ou Cartão de Crédito. A liberação é imediata.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRenovation;