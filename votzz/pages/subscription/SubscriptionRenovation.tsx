import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Shield, ArrowLeft, Building, Crown } from 'lucide-react';
import api from '../../services/api';

const SubscriptionRenovation: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<number>(50); 
  const [cycle, setCycle] = useState<'TRIMESTRAL' | 'ANUAL'>('ANUAL');

  // --- CÁLCULO DE PREÇO (Sincronizado com Backend) ---
  const calculatePrice = (inputUnits: number, selectedCycle: 'TRIMESTRAL' | 'ANUAL') => {
    let planName = '';
    let finalPrice = 0;
    
    // Valores Fixos Base
    const baseTrimestral = 1047.00;
    const baseAnual = 3350.40;

    if (inputUnits <= 80) {
      planName = 'Business';
      // Preço fixo independente das unidades (até 80)
      if (selectedCycle === 'TRIMESTRAL') {
        finalPrice = baseTrimestral;
      } else {
        finalPrice = baseAnual;
      }
    } else {
      planName = 'Custom';
      // Lógica Custom: Preço Base + (1.50 * unidades)
      // O valor da unidade é somado ao pacote total
      const variablePart = 1.50 * inputUnits;

      if (selectedCycle === 'TRIMESTRAL') {
        finalPrice = baseTrimestral + variablePart;
      } else {
        finalPrice = baseAnual + variablePart;
      }
    }

    return { planName, finalPrice };
  };

  const activePlan = calculatePrice(units, cycle);

  const handlePayment = async () => {
    setLoading(true);
    try {
        const response = await api.post('/subscription/create-checkout', {
            planType: activePlan.planName.toUpperCase(),
            cycle: cycle,
            units: units
        });

        if (response.data) {
             // Lógica para tratar retorno do Asaas (QR Code ou Link)
             if (response.data.paymentUrl && response.data.paymentUrl.startsWith('http')) {
                  window.location.href = response.data.paymentUrl;
             } else if (response.data.payload) {
                  // Se retornou Payload PIX Copia e Cola
                  await navigator.clipboard.writeText(response.data.payload);
                  alert(`Código PIX Copiado! Valor: R$ ${response.data.value}`);
             } else {
                  alert("Pedido processado. Verifique seu e-mail.");
             }
        } else {
            alert("Erro ao gerar link de pagamento.");
        }
    } catch (error) {
        console.error("Erro no pagamento:", error);
        alert("Erro ao processar solicitação.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        <div className="bg-slate-900 p-8 text-center relative">
          <button onClick={() => navigate('/dashboard')} className="absolute left-6 top-6 text-slate-400 hover:text-white transition-colors">
             <ArrowLeft />
          </button>
          <Shield className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Renovação de Assinatura</h1>
          <p className="text-slate-400 mt-2">Plano {activePlan.planName}</p>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Total de Unidades</label>
                    <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-300">
                        <Building className="text-slate-400" />
                        <input 
                            type="number" 
                            min="1" 
                            value={units}
                            onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 0))}
                            className="bg-transparent outline-none w-full font-bold text-lg text-slate-800"
                        />
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Ciclo de Cobrança</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCycle('TRIMESTRAL')}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold border transition-all ${cycle === 'TRIMESTRAL' ? 'bg-white border-emerald-500 text-emerald-600 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-200'}`}
                        >
                            Trimestral
                        </button>
                        <button 
                            onClick={() => setCycle('ANUAL')}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold border transition-all ${cycle === 'ANUAL' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'border-transparent text-slate-500 hover:bg-slate-200'}`}
                        >
                            Anual (-20%)
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col justify-between h-full">
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 mb-6">
                    <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
                        {activePlan.planName === 'Custom' ? <Crown size={20} className="text-amber-500"/> : <CheckCircle size={20} />}
                        Resumo do Plano
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-600 mb-6">
                        <li className="flex justify-between"><span>Unidades:</span> <strong>{units}</strong></li>
                        <li className="flex justify-between"><span>Ciclo:</span> <strong>{cycle}</strong></li>
                        <li className="flex justify-between pt-3 border-t border-emerald-200 mt-2">
                            <span className="text-lg font-bold text-slate-800">Total a Pagar:</span>
                            <span className="text-2xl font-black text-emerald-600">
                                {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePlan.finalPrice)}
                            </span>
                        </li>
                    </ul>
                    {activePlan.planName === 'Custom' && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mt-2">
                           * Base do Plano Business + (R$ 1,50 x Unidades)
                        </p>
                    )}
                </div>
                
                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-70 transform hover:-translate-y-1"
                >
                    {loading ? 'Processando...' : <><CreditCard className="w-5 h-5" /> Pagar Agora</>}
                </button>
                <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                    <Shield size={10} /> Pagamento seguro via Asaas
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRenovation;