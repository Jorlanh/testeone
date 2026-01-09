import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Calculator, Building, Crown, Info, Smartphone } from 'lucide-react';
import Layout from '../components/Layout'; 

// IDs dos Planos
const PLAN_IDS = {
  ESSENCIAL: '11111111-1111-1111-1111-111111111111',
  BUSINESS: '22222222-2222-2222-2222-222222222222',
  CUSTOM: '33333333-3333-3333-3333-333333333333'
};

// Lista de Benefícios Padrão (Atualizada com App)
const COMMON_BENEFITS = [
  "Aplicativo Moradores (iOS/Android)", 
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
      monthlyBase = 490.00 + (extra * 2.50);
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

  // --- LÓGICA DE INSCRIÇÃO CORRIGIDA PARA MÓDULO HÍBRIDO ---
  const handleSubscribe = () => {
    const planType = activePlan.planName.toUpperCase();
    
    if (planType === 'CUSTOM') {
      // Custom: fluxo interno via backend/Asaas
      navigate('/register-condo', { 
        state: { 
          planId: activePlan.planId,
          planType: 'CUSTOM',
          preFilledUnits: units,
          preFilledCycle: cycle 
        } 
      });
    } else {
      // Essencial/Business: Redireciona para o link fixo da Kiwify
      const kiwifyLinks: Record<string, string> = {
        'ESSENCIAL': 'https://pay.kiwify.com.br/SEU_LINK_ESSENCIAL',
        'BUSINESS': 'https://pay.kiwify.com.br/SEU_LINK_BUSINESS'
      };
      window.location.href = kiwifyLinks[planType];
    }
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
      
      <li className="flex gap-2 items-start relative group cursor-help">
        <Check className="text-emerald-500 flex-shrink-0" size={18}/>
        <div>
          <span className="font-bold block">Reservas (PIX/Boleto)</span>
          <span className={`text-xs ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            {cycle === 'ANUAL' 
              ? 'Taxa Votzz ISENTA (Só tarifas bancárias)' 
              : 'Taxa Votzz R$ 5,00 + Tarifas bancárias'}
          </span>
        </div>
        <Info size={16} className="text-slate-400 mt-1 ml-1" />
        
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-slate-700">
          <p className="font-bold mb-1 text-emerald-400">Tarifas de Transação (Asaas):</p>
          <ul className="list-disc pl-3 space-y-1 text-slate-300">
            <li>PIX: R$ 1,99 (Recebe na hora)</li>
            <li>Boleto: R$ 1,99 (Compensa em D+1)</li>
          </ul>
          {cycle === 'TRIMESTRAL' && (
            <p className="mt-2 pt-2 border-t border-slate-600 text-amber-400">+ R$ 5,00 da Votzz por reserva realizada.</p>
          )}
        </div>
      </li>
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

      <section className="bg-slate-900 pb-20 pt-10 px-4 shadow-xl">
        <div className="max-w-4xl mx-auto bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Calculator className="text-emerald-500" />
              Simule o valor para seu condomínio
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
            <p className={`text-sm mb-4 ${activePlan.planName === 'Essencial' ? 'text-slate-400' : 'text-slate-500'}`}>Para condomínios pequenos</p>
            <div className="text-4xl font-extrabold mb-1">
              {activePlan.planName === 'Essencial' 
                ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePlan.finalPrice)
                : Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getStaticPrice('Essencial'))}
            </div>
            <p className={`text-xs mb-6 font-medium uppercase ${activePlan.planName === 'Essencial' ? 'text-slate-500' : 'text-slate-400'}`}>{cycle}</p>
            <BenefitsList isDark={activePlan.planName === 'Essencial'} />
            <button onClick={handleSubscribe} className="btn-subscribe text-slate-900 bg-white hover:bg-emerald-50">Contratar Essencial</button>
          </div>

          {/* CARD 2: BUSINESS */}
          <div className={getCardClasses('Business')}>
            <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-tr-lg rounded-bl-lg absolute top-0 right-0">POPULAR</div>
            <h3 className="text-xl font-bold mb-2 mt-4">Business</h3>
            <p className={`text-sm mb-4 ${activePlan.planName === 'Business' ? 'text-slate-400' : 'text-slate-500'}`}>O melhor custo-benefício</p>
            <div className="text-4xl font-extrabold mb-1">
               {activePlan.planName === 'Business' 
                ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePlan.finalPrice)
                : Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getStaticPrice('Business'))}
            </div>
            <p className={`text-xs mb-6 font-medium uppercase ${activePlan.planName === 'Business' ? 'text-slate-500' : 'text-slate-400'}`}>{cycle}</p>
            <BenefitsList isDark={activePlan.planName === 'Business'} />
            <button onClick={handleSubscribe} className="btn-subscribe text-slate-900 bg-white hover:bg-emerald-50">Contratar Business</button>
          </div>

          {/* CARD 3: CUSTOM */}
          <div className={getCardClasses('Custom')}>
             <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Crown size={20} className="text-amber-400"/> Custom</h3>
            <p className={`text-sm mb-4 ${activePlan.planName === 'Custom' ? 'text-slate-400' : 'text-slate-500'}`}>Para grandes empreendimentos</p>
            <div className="text-4xl font-extrabold mb-1">
               {activePlan.planName === 'Custom' 
                ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(activePlan.finalPrice)
                : 'R$ ---'}
            </div>
            <p className={`text-xs mb-6 font-medium uppercase ${activePlan.planName === 'Custom' ? 'text-slate-500' : 'text-slate-400'}`}>{cycle}</p>
            
            {activePlan.planName === 'Custom' && (
              <div className="bg-slate-800 p-3 rounded-lg text-xs text-slate-300 mb-6 border border-slate-700">
                <p>Base Business (80 un): R$ 490,00</p>
                <p className="text-emerald-400">+ R$ 2,50 por unidade extra</p>
              </div>
            )}

            <BenefitsList isDark={activePlan.planName === 'Custom'} />
            <button onClick={handleSubscribe} className="btn-subscribe text-slate-900 bg-white hover:bg-emerald-50">Contratar Custom</button>
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
          min-height: 750px; 
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