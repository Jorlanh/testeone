import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Logo } from '../../components/Logo';
import { 
  Building, 
  User, 
  CreditCard, 
  ArrowRight, 
  ArrowLeft, 
  Lock,
  QrCode,
  AlertCircle,
  Tag // Ícone novo
} from 'lucide-react';

const PLAN_RULES = {
  '11111111-1111-1111-1111-111111111111': { name: 'Essencial', min: 1, max: 30 },
  '22222222-2222-2222-2222-222222222222': { name: 'Business', min: 31, max: 80 },
  '33333333-3333-3333-3333-333333333333': { name: 'Custom', min: 81, max: 99999 }
};

export default function CondoRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para Cupom
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const defaultPlanId = '11111111-1111-1111-1111-111111111111'; 
  const planIdFromState = location.state?.planId || defaultPlanId;
  const initialUnits = location.state?.preFilledUnits || '';

  const [formData, setFormData] = useState({
    planId: planIdFromState,
    condoName: '', cnpj: '', qtyUnits: initialUnits, qtyBlocks: '', secretKeyword: '',
    nameSyndic: '', emailSyndic: '', cpfSyndic: '', whatsappSyndic: '', passwordSyndic: '',
    paymentMethod: 'CREDIT_CARD',
    creditCard: { holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '' }
  });

  useEffect(() => {
    if (location.state?.preFilledUnits) setFormData(prev => ({ ...prev, qtyUnits: location.state.preFilledUnits }));
    if (location.state?.planId) setFormData(prev => ({ ...prev, planId: location.state.planId }));
  }, [location.state]);

  const handleChange = (e: any) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleCardChange = (e: any) => {
    setFormData(prev => ({ ...prev, creditCard: { ...prev.creditCard, [e.target.name]: e.target.value } }));
  };

  // Validar Cupom
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.get(`/auth/validate-coupon/${couponCode}`);
      setAppliedDiscount(res.data.discountPercent);
      alert(`Cupom Aplicado! ${res.data.discountPercent}% de desconto.`);
    } catch (err) {
      setAppliedDiscount(0);
      alert('Cupom inválido ou expirado.');
    }
  };

  const validateStep1 = () => {
    if (!formData.condoName || !formData.cnpj || !formData.qtyUnits || !formData.qtyBlocks || !formData.secretKeyword ||
        !formData.nameSyndic || !formData.emailSyndic || !formData.passwordSyndic || !formData.cpfSyndic) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return false;
    }
    const rules = PLAN_RULES[formData.planId as keyof typeof PLAN_RULES];
    const units = Number(formData.qtyUnits);
    if (rules && (units < rules.min || units > rules.max)) {
      setError(`Para o plano ${rules.name}, unidades devem ser entre ${rules.min} e ${rules.max}.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.paymentMethod === 'CREDIT_CARD') {
      const { holderName, number, expiryMonth, expiryYear, ccv } = formData.creditCard;
      if (!holderName || !number || !expiryMonth || !expiryYear || !ccv) {
        setError('Preencha todos os dados do cartão.');
        return;
      }
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        qtyUnits: Number(formData.qtyUnits),
        qtyBlocks: Number(formData.qtyBlocks),
        creditCard: formData.paymentMethod === 'CREDIT_CARD' ? formData.creditCard : null,
        couponCode: appliedDiscount > 0 ? couponCode : null // Envia o cupom se válido
      };
      await api.post('/auth/register-condo', payload);
      alert('Cadastro realizado com sucesso! Faça login para acessar o painel.');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data || 'Erro ao processar cadastro.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="mb-8"><Link to="/"><Logo theme="dark" /></Link></div>
      <div className="w-full max-w-3xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Progress Bar */}
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-500' : 'text-slate-500'}`}>
            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold">1</div>
            <span className="hidden sm:inline">Dados do Condomínio</span>
          </div>
          <div className="w-16 h-px bg-slate-700 self-center"></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-500' : 'text-slate-500'}`}>
            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold">2</div>
            <span className="hidden sm:inline">Pagamento</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-start gap-3 animate-pulse">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Building className="text-emerald-500" size={20} /> Informações do Condomínio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="label">Nome</label><input required name="condoName" className="input" onChange={handleChange} value={formData.condoName} /></div>
                  <div><label className="label">CNPJ</label><input required name="cnpj" className="input" onChange={handleChange} value={formData.cnpj} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="label">Unidades</label><input required type="number" name="qtyUnits" className="input" onChange={handleChange} value={formData.qtyUnits} /></div>
                    <div><label className="label">Blocos</label><input required type="number" name="qtyBlocks" className="input" onChange={handleChange} value={formData.qtyBlocks} /></div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label text-emerald-400 font-bold flex items-center gap-2"><Lock size={14} /> Palavra-Chave Secreta</label>
                    <input required name="secretKeyword" className="input border-emerald-500/50 focus:border-emerald-400" onChange={handleChange} value={formData.secretKeyword} />
                  </div>
                </div>
              </div>
              <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><User className="text-blue-500" size={20} /> Dados do Síndico</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="label">Nome Completo</label><input required name="nameSyndic" className="input" onChange={handleChange} value={formData.nameSyndic} /></div>
                  <div><label className="label">CPF</label><input required name="cpfSyndic" className="input" onChange={handleChange} value={formData.cpfSyndic} /></div>
                  <div><label className="label">WhatsApp</label><input required name="whatsappSyndic" className="input" onChange={handleChange} value={formData.whatsappSyndic} /></div>
                  <div className="md:col-span-2"><label className="label">E-mail</label><input required type="email" name="emailSyndic" className="input" onChange={handleChange} value={formData.emailSyndic} /></div>
                  <div className="md:col-span-2"><label className="label">Senha</label><input required type="password" name="passwordSyndic" className="input" onChange={handleChange} value={formData.passwordSyndic} /></div>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={() => { if(validateStep1()) { setStep(2); setError(''); } }} className="btn-primary flex items-center gap-2">Ir para Pagamento <ArrowRight size={18} /></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white">Pagamento</h3>
                <p className="text-slate-400 text-sm">Transação via Asaas</p>
              </div>

              {/* ÁREA DE CUPOM */}
              <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 flex gap-2 items-end">
                <div className="flex-1">
                    <label className="label text-emerald-400 flex items-center gap-2"><Tag size={14}/> Possui um Cupom?</label>
                    <input 
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Digite seu código"
                        className="input uppercase"
                    />
                </div>
                <button type="button" onClick={handleApplyCoupon} className="bg-emerald-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-emerald-500 h-[46px]">
                    Aplicar
                </button>
              </div>
              {appliedDiscount > 0 && (
                <div className="text-right text-emerald-400 font-bold bg-emerald-900/20 p-2 rounded border border-emerald-500/30">
                    Desconto de {appliedDiscount}% aplicado!
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
                <button type="button" onClick={() => setFormData({ ...formData, paymentMethod: 'CREDIT_CARD' })} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.paymentMethod === 'CREDIT_CARD' ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-slate-700 border-transparent text-slate-400 hover:bg-slate-700/80'}`}><CreditCard size={24} /><span className="font-bold">Cartão</span></button>
                <button type="button" onClick={() => setFormData({ ...formData, paymentMethod: 'PIX' })} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.paymentMethod === 'PIX' ? 'bg-emerald-600/20 border-emerald-500 text-white' : 'bg-slate-700 border-transparent text-slate-400 hover:bg-slate-700/80'}`}><QrCode size={24} /><span className="font-bold">PIX</span></button>
              </div>

              {formData.paymentMethod === 'CREDIT_CARD' ? (
                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600 space-y-4">
                  <div><label className="label">Nome no Cartão</label><input required name="holderName" className="input" onChange={handleCardChange} /></div>
                  <div><label className="label">Número</label><input required name="number" className="input" onChange={handleCardChange} /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="label">Mês</label><input required name="expiryMonth" className="input" maxLength={2} onChange={handleCardChange} /></div>
                    <div><label className="label">Ano</label><input required name="expiryYear" className="input" maxLength={4} onChange={handleCardChange} /></div>
                    <div><label className="label">CCV</label><input required name="ccv" className="input" maxLength={4} onChange={handleCardChange} /></div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-700/50 p-8 rounded-xl border border-slate-600 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><QrCode className="text-emerald-500" size={32} /></div>
                  <p className="text-white font-medium">O QR Code será gerado após clicar em Finalizar.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"><ArrowLeft className="inline mr-2" size={18}/> Voltar</button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary py-4 text-lg shadow-lg shadow-emerald-900/50">{loading ? 'Processando...' : 'Finalizar Assinatura'}</button>
              </div>
            </div>
          )}
        </form>
      </div>
      <style>{`
        .label { display: block; font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem; font-weight: 500; }
        .input { width: 100%; background-color: #1e293b; color: white; border: 1px solid #334155; border-radius: 0.5rem; padding: 0.75rem 1rem; outline: none; transition: all 0.2s; }
        .input:focus { border-color: #10b981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2); }
        .btn-primary { background-color: #10b981; color: white; font-weight: bold; border-radius: 0.5rem; padding: 0.75rem 1.5rem; transition: background-color 0.2s; }
        .btn-primary:hover { background-color: #059669; }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
    </div>
  );
}