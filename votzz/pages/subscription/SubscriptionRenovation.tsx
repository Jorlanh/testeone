import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Shield, ArrowLeft, Building, Crown } from 'lucide-react';
import api from '../../services/api';
// Removido o uso de user.tenant para evitar erro de TS, pois user não tem a propriedade completa 'tenant' na interface.
// import { useAuth } from '../../context/AuthContext'; 

const SubscriptionRenovation: React.FC = () => {
  const navigate = useNavigate();
  // const { user } = useAuth(); // Não estamos mais usando user.tenant para evitar o erro.
  
  const [loading, setLoading] = useState(false);
  // Inicia com 50 unidades padrão. O síndico deve ajustar para o número real.
  const [units, setUnits] = useState<number>(50); 
  const [cycle, setCycle] = useState<'TRIMESTRAL' | 'ANUAL'>('ANUAL');

  // --- CÁLCULO DE PREÇO (Espelho da Pricing Page) ---
  const calculatePrice = (inputUnits: number, selectedCycle: 'TRIMESTRAL' | 'ANUAL') => {
    let monthlyBase = 0;
    let planName = '';
    
    if (inputUnits <= 30) {
      planName = 'Essencial';
      monthlyBase = 190.00;
    } else if (inputUnits <= 80) {
      planName = 'Business';
      monthlyBase = 490.00;
    } else {
      planName = 'Custom';
      const extra = inputUnits - 80;
      monthlyBase = 490.00 + (extra * 1.50);
    }

    let finalPrice = 0;
    if (selectedCycle === 'TRIMESTRAL') {
      finalPrice = monthlyBase * 3;
    } else {
      finalPrice = (monthlyBase * 12) * 0.8;
    }

    return { planName, finalPrice, monthlyBase };
  };

  const activePlan = calculatePrice(units, cycle);

  const handlePayment = async () => {
    setLoading(true);

    // 1. Links FIXOS da Kiwify (Substitua pelos seus links reais)
    const kiwifyLinks: Record<string, Record<string, string>> = {
        'ESSENCIAL': {
            'TRIMESTRAL': 'https://pay.kiwify.com.br/LINK_ESSENCIAL_TRIM',
            'ANUAL': 'https://pay.kiwify.com.br/LINK_ESSENCIAL_ANUAL'
        },
        'BUSINESS': {
            'TRIMESTRAL': 'https://pay.kiwify.com.br/LINK_BUSINESS_TRIM',
            'ANUAL': 'https://pay.kiwify.com.br/LINK_BUSINESS_ANUAL'
        }
    };

    try {
        if (activePlan.planName === 'Custom') {
            // 2. Plano Custom: Gerar pagamento no Backend (Asaas)
            const response = await api.post('/subscription/create-checkout', {
                planType: 'CUSTOM',
                cycle: cycle,
                units: units
            });

            if (response.data && response.data.paymentUrl) {
                // Redireciona para o link de pagamento ou exibe QR Code se for implementação direta
                // Se for URL externa (Asaas invoice page):
                // window.location.href = response.data.paymentUrl;
                
                // Se for imagem Base64 do QR Code (como no backend sugerido):
                // Aqui você pode implementar um modal para mostrar o QR Code.
                // Para simplificar, vamos assumir que o backend retorna uma URL de fatura ou redirecionamos.
                // Se o backend retorna { paymentUrl: "imagem_base64" }, precisamos exibir.
                // Vou assumir redirecionamento para fatura web do Asaas se disponível, ou alerta.
                
                if(response.data.paymentUrl.startsWith('http')) {
                     window.location.href = response.data.paymentUrl;
                } else {
                     alert("Código PIX gerado! Verifique seu e-mail ou a área de faturas (Implementação visual pendente).");
                     console.log("Payload PIX:", response.data.payload);
                }

            } else {
                alert("Erro ao gerar link de pagamento. Tente novamente.");
            }
        } else {
            // 3. Planos Fixos: Redirecionamento direto
            const link = kiwifyLinks[activePlan.planName.toUpperCase()]?.[cycle];
            if (link && !link.includes('LINK_')) {
                window.location.href = link;
            } else {
                console.warn("Link Kiwify não configurado, tentando via API...");
                const response = await api.post('/subscription/create-checkout', {
                    planType: activePlan.planName.toUpperCase(),
                    cycle: cycle,
                    units: units
                });
                if (response.data?.paymentUrl) {
                     if(response.data.paymentUrl.startsWith('http')) window.location.href = response.data.paymentUrl;
                     else alert("Cobrança gerada com sucesso.");
                }
                else alert("Configuração de pagamento pendente. Contate o suporte.");
            }
        }
    } catch (error) {
        console.error("Erro no pagamento:", error);
        alert("Erro ao processar solicitação de pagamento.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative">
          <button onClick={() => navigate('/dashboard')} className="absolute left-6 top-6 text-slate-400 hover:text-white transition-colors">
             <ArrowLeft />
          </button>
          <Shield className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Renovação de Assinatura</h1>
          <p className="text-slate-400 mt-2">Mantenha seu condomínio conectado e seguro.</p>
        </div>

        {/* Body */}
        <div className="p-8 grid md:grid-cols-2 gap-8">
            
            {/* Coluna da Esquerda: Configuração */}
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Quantas unidades o condomínio possui?</label>
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
                    <p className="text-xs text-slate-500 mt-2">O plano é ajustado automaticamente baseado nas unidades.</p>
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

            {/* Coluna da Direita: Resumo e Pagamento */}
            <div className="flex flex-col justify-between h-full">
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 mb-6">
                    <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
                        {activePlan.planName === 'Custom' ? <Crown size={20} className="text-amber-500"/> : <CheckCircle size={20} />}
                        Plano {activePlan.planName}
                    </h3>
                    <ul className="space-y-3 text-sm text-slate-600 mb-6">
                        <li className="flex justify-between"><span>Unidades:</span> <strong>{units}</strong></li>
                        <li className="flex justify-between"><span>Ciclo:</span> <strong>{cycle}</strong></li>
                        <li className="flex justify-between pt-3 border-t border-emerald-200 mt-2">
                            <span className="text-lg font-bold text-slate-800">Total:</span>
                            <span className="text-2xl font-black text-emerald-600">
                                {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePlan.finalPrice)}
                            </span>
                        </li>
                    </ul>
                    
                    {activePlan.planName === 'Custom' && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-4">
                            * Cálculo customizado: Base Business + R$ 1,50 por unidade extra.
                        </p>
                    )}
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1"
                >
                    {loading ? 'Processando...' : (
                        <>
                            <CreditCard className="w-5 h-5" /> Pagar e Renovar
                        </>
                    )}
                </button>
                <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                    <Shield size={10} /> Pagamento seguro via {activePlan.planName === 'Custom' ? 'Asaas' : 'Kiwify'}
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRenovation;