import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Calculator, Building, Crown, Info, Smartphone, Gift, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout'; 

// IDs dos Planos
const PLAN_IDS = {
  ESSENCIAL: '11111111-1111-1111-1111-111111111111',
  BUSINESS: '22222222-2222-2222-2222-222222222222',
  CUSTOM: '33333333-3333-3333-3333-333333333333'
};

// Lista de Benefícios Padrão (Atualizada)
const COMMON_BENEFITS = [
  "Aplicativo Votzz (iOS/Android)", 
  "Votação em Tempo Real",
  "Assembleia Digital ao Vivo",
  "Ata Automática",
  "Auditoria Criptografada",
  "Lista de Presença Digital",
  "Convocações Digitais",
  "Votos e Pautas Ilimitados",
  "Acesso Moradores e Conselho",
  "Dashboard Completo"
];

export function Pricing() {
  const navigate = useNavigate();
  
  // Começa com 50 unidades (Plano Business)
  const [units, setUnits] = useState<number>(50); 
  const [cycle, setCycle] = useState<'TRIMESTRAL' | 'ANUAL'>('ANUAL');
  
  // --- LÓGICA DE CÁLCULO GERAL ---
  const calculatePrice = (inputUnits: number, selectedCycle: 'TRIMESTRAL' | 'ANUAL') => {
    let monthlyBase = 0;
    let planName = '';
    let planId = '';

    if (inputUnits <= 30) {
      planName = 'Essencial';
      monthlyBase = 190.00;
      planId = PLAN_IDS.ESSENCIAL;
    } else if (inputUnits <= 80) {
      planName = 'Business';
      monthlyBase = 490.00;
      planId = PLAN_IDS.BUSINESS;
    } else {
      planName = 'Custom';
      const extra = inputUnits - 80;
      // [ATUALIZADO] 1.50 por unidade extra conforme pedido
      monthlyBase = 490.00 + (extra * 1.50);
      planId = PLAN_IDS.CUSTOM;
    }

    let finalPrice = 0;
    if (selectedCycle === 'TRIMESTRAL') {
      finalPrice = monthlyBase * 3;
    } else {
      finalPrice = (monthlyBase * 12) * 0.8;
    }

    return { 
      planName, 
      finalPrice, 
      planId,
      monthlyEquivalent: finalPrice / (selectedCycle === 'TRIMESTRAL' ? 3 : 12)
    };
  };

  // --- LÓGICA PARA EXIBIR PREÇOS FIXOS NOS CARDS INATIVOS ---
  const getStaticPrice = (planType: 'Essencial' | 'Business') => {
    let base = 0;
    if (planType === 'Essencial') base = 190.00;
    if (planType === 'Business') base = 490.00;

    if (cycle === 'TRIMESTRAL') return base * 3;
    return (base * 12) * 0.8;
  };

  const activePlan = calculatePrice(units, cycle);

  // --- LÓGICA DE INSCRIÇÃO / PAGAMENTO ---
  const handleSubscribe = () => {
    const planType = activePlan.planName.toUpperCase();
    
    // Links Kiwify fornecidos para Essencial e Business
    const kiwifyLinks: Record<string, Record<string, string>> = {
        'ESSENCIAL': {
            'TRIMESTRAL': 'https://pay.kiwify.com.br/SEU_LINK_ESSENCIAL_TRIMESTRAL',
            'ANUAL': 'https://pay.kiwify.com.br/SEU_LINK_ESSENCIAL_ANUAL'
        },
        'BUSINESS': {
            'TRIMESTRAL': 'https://pay.kiwify.com.br/SEU_LINK_BUSINESS_TRIMESTRAL',
            'ANUAL': 'https://pay.kiwify.com.br/SEU_LINK_BUSINESS_ANUAL'
        }
    };

    if (planType === 'CUSTOM') {
      // Custom: fluxo interno via backend/Asaas (valor dinâmico)
      navigate('/register-condo', { 
        state: { 
          planId: activePlan.planId,
          planType: 'CUSTOM',
          preFilledUnits: units,
          preFilledCycle: cycle,
          isFreeTrial: false, // Custom geralmente já negocia pagando, ou pode ser trial
          customPrice: activePlan.finalPrice
        } 
      });
    } else {
      // Essencial/Business: Redireciona para o link fixo da Kiwify
      const link = kiwifyLinks[planType]?.[cycle];
      if (link) {
         // Agora, em vez de ir direto, vamos para o cadastro unificado
         // E passamos o link de pagamento como destino final
         navigate('/auth/condo-register', {
             state: {
                 planId: activePlan.planId,
                 preFilledUnits: units,
                 isTrial: false,
                 paymentLink: link // Link Kiwify
             }
         });
      } else {
         console.error("Link de pagamento não configurado");
      }
    }
  };

  // --- NOVA LÓGICA: TESTE GRÁTIS ---
  const handleFreeTrial = () => {
      // Redireciona para cadastro com flag de Trial
      // ATENÇÃO: Certifique-se que esta rota existe no App.tsx!
      navigate('/auth/condo-register', {
          state: {
              planId: activePlan.planId, // Salva o plano que ele "mirou", mas entra como trial
              isTrial: true,
              trialDays: 30,
              preFilledUnits: units
          }
      });
  };

  // Componente de Benefícios
  const BenefitsList = ({ isDark }: { isDark: boolean }) => (
    <ul className={`space-y-3 text-sm mb-8 flex-1 text-left ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
      
      <li className="flex gap-2 items-start font-bold">
        <Smartphone className="text-emerald-500 flex-shrink-0" size={18}/> 
        <span>Aplicativo Votzz (iOS/Android)</span>
      </li>

      {COMMON_BENEFITS.slice(1).map((benefit, index) => (
        <li key={index} className="flex gap-2 items-start">
          <Check className="text-emerald-500 flex-shrink-0" size={18}/> 
          <span>{benefit}</span>
        </li>
      ))}
    </ul>
  );

  const getCardClasses = (planName: string) => {
    const isActive = activePlan.planName === planName;
    if (isActive) {
      return "pricing-card active-card bg-slate-900 text-white border-emerald-500 ring-2 ring-emerald-500/50 shadow-2xl z-10 relative overflow-hidden";
    }
    return "pricing-card bg-white text-slate-800 border-slate-200 opacity-80 hover:opacity-100 z-0 relative overflow-hidden";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      <header className="bg-slate-900 py-6 text-center">
         <h1 className="text-3xl font-bold text-white">Planos Votzz</h1>
         <p className="text-slate-400">Transparência total para seu condomínio</p>
      </header>

      {/* Free Trial Banner */}
      <div className="bg-emerald-600 text-white text-center py-3 px-4 font-bold text-sm md:text-base shadow-md relative z-20">
          <Gift className="inline-block w-5 h-5 mr-2 mb-1" />
          Plano Free: Todos os planos começam com 30 dias grátis! A cobrança só inicia na renovação.
      </div>

      <section className="bg-slate-900 pb-20 pt-10 px-4 shadow-xl">
        <div className="max-w-4xl mx-auto bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Calculator className="text-emerald-500" />
              Simule o valor para renovação
            </h2>
            <p className="text-slate-400 text-sm mt-2">O plano é selecionado automaticamente baseado no número de unidades.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="w-full max-w-xs">
              <label className="block text-emerald-400 font-bold mb-2 flex items-center gap-2">
                <Building size={18} /> Quantas unidades (portas)?
              </label>
              <input 
                type="number" 
                min="1" 
                value={units}
                onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-900 text-white text-3xl font-bold p-4 rounded-xl border border-slate-600 focus:border-emerald-500 outline-none text-center"
              />
            </div>

            <div className="bg-slate-900 p-1 rounded-xl flex items-center border border-slate-700">
              <button onClick={() => setCycle('TRIMESTRAL')} className={`px-6 py-3 rounded-lg font-bold transition-all ${cycle === 'TRIMESTRAL' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Trimestral</button>
              <button onClick={() => setCycle('ANUAL')} className={`px-6 py-3 rounded-lg font-bold transition-all flex flex-col items-center ${cycle === 'ANUAL' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Anual <span className="text-[0.6rem] uppercase tracking-wider bg-emerald-800 px-1 rounded text-emerald-200">20% OFF</span></button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 -mt-10 relative z-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 items-start">

          {/* CARD 1: ESSENCIAL */}
          <div className={getCardClasses('Essencial')}>
            <h3 className="text-xl font-bold mb-2">Essencial</h3>
            <p className={`text-sm mb-4 ${activePlan.planName === 'Essencial' ? 'text-slate-400' : 'text-slate-500'}`}>Até 30 unidades</p>
            <div className="text-4xl font-extrabold mb-1">
              {activePlan.planName === 'Essencial' 
                ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePlan.finalPrice)
                : Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getStaticPrice('Essencial'))}
            </div>
            <p className={`text-xs mb-6 font-medium uppercase ${activePlan.planName === 'Essencial' ? 'text-slate-500' : 'text-slate-400'}`}>{cycle}</p>
            <BenefitsList isDark={activePlan.planName === 'Essencial'} />
            
            {/* Botões de Ação */}
            <div className="mt-auto space-y-3">
                <button onClick={handleFreeTrial} className="w-full py-3 rounded-lg font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg">
                    Começar 30 Dias Grátis
                </button>
                <button onClick={handleSubscribe} className="w-full py-2 rounded-lg text-sm font-medium border border-current opacity-70 hover:opacity-100">
                    Pagar Agora
                </button>
            </div>
          </div>

          {/* CARD 2: BUSINESS */}
          <div className={getCardClasses('Business')}>
            <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-tr-lg rounded-bl-lg absolute top-0 right-0">POPULAR</div>
            <h3 className="text-xl font-bold mb-2 mt-4">Business</h3>
            <p className={`text-sm mb-4 ${activePlan.planName === 'Business' ? 'text-slate-400' : 'text-slate-500'}`}>31 a 80 Unidades</p>
            <div className="text-4xl font-extrabold mb-1">
               {activePlan.planName === 'Business' 
                ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePlan.finalPrice)
                : Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getStaticPrice('Business'))}
            </div>
            <p className={`text-xs mb-6 font-medium uppercase ${activePlan.planName === 'Business' ? 'text-slate-500' : 'text-slate-400'}`}>{cycle}</p>
            <BenefitsList isDark={activePlan.planName === 'Business'} />
            
             {/* Botões de Ação */}
             <div className="mt-auto space-y-3">
                <button onClick={handleFreeTrial} className="w-full py-3 rounded-lg font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg">
                    Começar 30 Dias Grátis
                </button>
                <button onClick={handleSubscribe} className="w-full py-2 rounded-lg text-sm font-medium border border-current opacity-70 hover:opacity-100">
                    Pagar Agora
                </button>
            </div>
          </div>

          {/* CARD 3: CUSTOM */}
          <div className={getCardClasses('Custom')}>
             <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Crown size={20} className="text-amber-400"/> Custom</h3>
            <p className={`text-sm mb-4 ${activePlan.planName === 'Custom' ? 'text-slate-400' : 'text-slate-500'}`}>Acima de 80 unidades</p>
            <div className="text-4xl font-extrabold mb-1">
               {activePlan.planName === 'Custom' 
                ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePlan.finalPrice)
                : 'R$ ---'}
            </div>
            <p className={`text-xs mb-6 font-medium uppercase ${activePlan.planName === 'Custom' ? 'text-slate-500' : 'text-slate-400'}`}>{cycle}</p>
            
            {activePlan.planName === 'Custom' && (
              <div className="bg-slate-800 p-3 rounded-lg text-xs text-slate-300 mb-6 border border-slate-700">
                <p>Base Business (80 un): R$ 490,00</p>
                <p className="text-emerald-400">+ R$ 1,50 por unidade extra</p>
              </div>
            )}

            <BenefitsList isDark={activePlan.planName === 'Custom'} />
            
             {/* Botões de Ação */}
             <div className="mt-auto space-y-3">
                <button onClick={handleFreeTrial} className="w-full py-3 rounded-lg font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg">
                    Começar 30 Dias Grátis
                </button>
                <button onClick={handleSubscribe} className="w-full py-2 rounded-lg text-sm font-medium border border-current opacity-70 hover:opacity-100">
                    Contratar Custom
                </button>
            </div>
          </div>

        </div>

        {cycle === 'ANUAL' && (
          <div className="text-center mt-12 bg-emerald-100 max-w-lg mx-auto p-4 rounded-xl border border-emerald-200 text-emerald-800 font-medium shadow-sm">
             🎉 Você está economizando 20% escolhendo o plano anual!
             <br/>
             <span className="text-sm opacity-80">O valor equivalente mensal seria {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePlan.monthlyEquivalent)}/mês.</span>
          </div>
        )}
      </section>

      <style>{`
        .pricing-card {
          border-radius: 1.5rem;
          padding: 2rem;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          min-height: 800px; 
        }
        .btn-subscribe {
          width: 100%;
          padding: 1rem;
          border-radius: 0.75rem;
          font-weight: bold;
          text-align: center;
          transition: all 0.2s;
          margin-top: auto; 
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default Pricing;