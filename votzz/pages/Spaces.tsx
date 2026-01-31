import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, MapPin, Users, Clock, Plus, CheckCircle, XCircle, AlertCircle, Wallet, Edit, Save, Trash2, Search, User as UserIcon, Upload, ImageIcon, Shield, ArrowRight, FileText, Banknote, Copy, ExternalLink, ThumbsUp, ThumbsDown, CreditCard, Landmark, AlertTriangle, Timer
} from 'lucide-react';
import api from '../services/api'; 
import { CommonArea, Booking, User, BookingStatus } from '../types';
import { useAuth } from '../context/AuthContext';

// Interface para configuração de pagamentos do condomínio
interface CondoPaymentConfig {
  enableAsaas: boolean;      // O condomínio usa Asaas?
  enableManualPix: boolean;  // O condomínio aceita Pix na conta direta?
  
  // Dados para o Pix Manual
  bankName: string;
  agency: string;
  account: string;
  pixKey: string;
  instructions: string;
}

// Componente para contagem regressiva
const BookingTimer: React.FC<{ createdAt: string; onExpire: () => void }> = ({ createdAt, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const interval = setInterval(() => {
            const created = new Date(createdAt).getTime();
            const now = new Date().getTime();
            const deadline = created + (30 * 60 * 1000); // 30 minutos em milissegundos
            const distance = deadline - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft("Expirado");
                onExpire();
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [createdAt, onExpire]);

    return <span className="font-mono text-red-600 font-bold">{timeLeft}</span>;
};

const Spaces: React.FC = () => {
  const { user } = useAuth();
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]); 
  const [selectedArea, setSelectedArea] = useState<CommonArea | null>(null);
  const [activeTab, setActiveTab] = useState<'areas' | 'my-bookings' | 'manage'>('areas');
  
  // Estado de Configuração de Pagamento
  const [paymentConfig, setPaymentConfig] = useState<CondoPaymentConfig>({
    enableAsaas: false,
    enableManualPix: true, 
    bankName: '', agency: '', account: '', pixKey: '', instructions: ''
  });

  // Estado da escolha do usuário no momento da reserva (Híbrido)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'ASAAS' | 'MANUAL' | null>(null);

  // Estados do Formulário de Reserva
  const [bookingForm, setBookingForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    nome: '',
    cpf: '',
    bloco: '',
    unidade: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados de Upload
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- GESTÃO DE ÁREAS (ADM) ---
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaForm, setAreaForm] = useState<Partial<CommonArea>>({
    name: '', capacity: 0, price: 0, description: '', rules: '', openTime: '08:00', closeTime: '22:00', imageUrl: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (user && selectedArea) {
      setBookingForm(prev => ({
        ...prev,
        nome: user.nome || user.name || '',
        cpf: user.cpf || '',
        bloco: user.bloco || '',
        unidade: user.unidade || user.unit || ''
      }));
      // Reseta a escolha de pagamento ao abrir o modal
      setSelectedPaymentMethod(null);
    }
  }, [user, selectedArea]);

  const loadData = async () => {
    try {
      // Carrega dados essenciais primeiro
      const [areasData, bookingsData] = await Promise.all([
        api.get('/facilities/areas'),
        api.get('/facilities/bookings')
      ]);
      setAreas(areasData.data || areasData);
      setBookings(bookingsData.data || bookingsData);

      // Carrega config separadamente para não quebrar a tela se falhar
      try {
          const configRes = await api.get('/tenants/payment-config');
          if (configRes.data) {
              setPaymentConfig(configRes.data);
          }
      } catch (err) {
          console.warn("Configuração de pagamento não encontrada ou erro, usando padrão.", err);
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setErrorMsg("Não foi possível carregar os dados atualizados.");
    }
  };

  // --- LÓGICA DE VALIDAÇÃO (BLOQUEIO DE DATA - 30 MINUTOS) ---
  const isDateBlocked = (areaId: string, date: string) => {
    return bookings.some(b => {
        // Cast genérico para string para evitar erro de TS se o enum não estiver atualizado
        const status = b.status as string;

        // Se cancelado, rejeitado ou expirado -> Disponível
        if (['CANCELLED', 'REJECTED', 'EXPIRED'].includes(status)) return false;
        
        // Se confirmada ou em análise (pago/comprovante enviado) -> Bloqueado
        if (['APPROVED', 'CONFIRMED', 'UNDER_ANALYSIS', 'COMPLETED'].includes(status)) {
            return b.areaId === areaId && b.date === date;
        }

        // Se estiver PENDENTE, verifica o tempo de 30 minutos
        if (status === 'PENDING') {
            const created = new Date(b.createdAt).getTime();
            const now = new Date().getTime();
            const diffMinutes = (now - created) / 1000 / 60;
            
            // Se passou de 30 minutos e ainda tá pendente, libera a vaga (não bloqueia)
            // O backend roda um job para marcar como EXPIRED, mas o frontend já libera visualmente
            if (diffMinutes > 30) return false;
            
            // Se ainda está dentro dos 30 min, bloqueia
            return b.areaId === areaId && b.date === date;
        }

        return false;
    });
  };

  const validateBooking = () => {
    const { date, startTime, endTime } = bookingForm;
    const today = new Date().toISOString().split('T')[0];

    if (date < today) return "A reserva deve ser feita para uma data futura.";
    if (startTime < "08:00" || endTime > "22:00") return "O horário permitido é das 08:00 às 22:00.";
    if (startTime >= endTime) return "O horário de início deve ser anterior ao fim.";
    
    if (selectedArea && isDateBlocked(selectedArea.id, date)) {
      return "DATA INDISPONÍVEL: Já existe uma reserva ativa ou em processo de pagamento para este dia.";
    }

    return null;
  };

  // --- ACTIONS DE GESTÃO ---

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/facilities/areas/upload', formData);
      setAreaForm(prev => ({ ...prev, imageUrl: response.data.url }));
      setSuccessMsg("Imagem carregada com sucesso!");
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Erro ao fazer upload da imagem.";
      setErrorMsg(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAreaId) {
        await api.patch(`/facilities/areas/${editingAreaId}`, areaForm);
        setSuccessMsg("Área atualizada!");
      } else {
        await api.post('/facilities/areas', areaForm);
        setSuccessMsg("Nova área criada!");
      }
      setIsAddingArea(false);
      setEditingAreaId(null);
      setAreaForm({ name: '', capacity: 0, price: 0, description: '', rules: '', openTime: '08:00', closeTime: '22:00', imageUrl: '' });
      loadData();
    } catch (e) {
      setErrorMsg("Erro ao salvar área.");
    }
  };

  const handleDeleteArea = async (id: string) => {
    if (!window.confirm("Excluir área permanentemente?")) return;
    try {
      await api.delete(`/facilities/areas/${id}`);
      loadData();
    } catch (e) { setErrorMsg("Erro ao excluir."); }
  };

  // --- ACTIONS DE PAGAMENTO E RESERVA ---

  // Upload do Comprovante pelo Morador
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>, bookingId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBookingId(bookingId);
    const formData = new FormData();
    formData.append('file', file);

    try {
        await api.post(`/facilities/bookings/${bookingId}/receipt`, formData);
        alert("Comprovante enviado com sucesso! Aguarde a validação do síndico.");
        loadData(); 
    } catch (error: any) {
        alert("Erro ao enviar comprovante: " + (error.response?.data?.message || error.message));
    } finally {
        setUploadingBookingId(null);
    }
  };

  // Salvar Configurações de Pagamento (Síndico)
  const handleSaveConfig = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await api.post('/tenants/payment-config', paymentConfig);
          alert("Configurações de pagamento atualizadas!");
          loadData();
      } catch (e) {
          alert("Erro ao salvar configurações.");
      }
  };

  // Validar Reserva (Aprovar/Rejeitar Comprovante)
  const handleValidateReceipt = async (bookingId: string, isValid: boolean) => {
      const action = isValid ? "APROVAR" : "REJEITAR";
      if (!window.confirm(`Deseja realmente ${action} esta reserva/comprovante?`)) return;

      try {
          await api.patch(`/facilities/bookings/${bookingId}/validate`, { valid: isValid });
          alert(`Reserva ${isValid ? 'confirmada' : 'rejeitada'} com sucesso!`);
          loadData();
      } catch (e) {
          alert("Erro ao processar validação.");
      }
  };

  // Criar Reserva (Lógica Híbrida com Timeout)
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea || !user) return;
    setErrorMsg('');
    setSuccessMsg('');

    const validationError = validateBooking();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const price = selectedArea.price ?? 0;
    
    // --- LÓGICA DE SELEÇÃO DE PAGAMENTO ---
    let finalMethod = 'MANUAL'; // Default (se for grátis ou fallback)

    if (price > 0) {
        // Se ambos estiverem ativos e o usuário não escolheu
        if (paymentConfig.enableAsaas && paymentConfig.enableManualPix && !selectedPaymentMethod) {
            setErrorMsg("Por favor, selecione uma forma de pagamento.");
            return;
        }
        
        // Define o método final
        if (paymentConfig.enableAsaas && !paymentConfig.enableManualPix) {
             finalMethod = 'ASAAS';
        } else if (!paymentConfig.enableAsaas && paymentConfig.enableManualPix) {
             finalMethod = 'MANUAL';
        } else if (selectedPaymentMethod) {
             finalMethod = selectedPaymentMethod;
        }
    }

    // Texto de confirmação dinâmico
    let confirmMsg = `Confirmar Reserva: ${selectedArea.name}\nData: ${new Date(bookingForm.date).toLocaleDateString()}\n`;
    if (price > 0) {
        confirmMsg += `Valor: R$ ${price.toFixed(2)}\nPagamento via: ${finalMethod === 'ASAAS' ? 'Pix Automático (Asaas)' : 'Transferência/Pix Manual'}`;
        confirmMsg += `\n\nIMPORTANTE: Você terá 30 minutos para concluir o pagamento. Caso contrário, a reserva será cancelada automaticamente.`;
    }
    
    if(!window.confirm(confirmMsg)) return;

    try {
      await api.post('/facilities/bookings', {
        areaId: selectedArea.id,
        userId: user.id,
        ...bookingForm,
        billingType: price > 0 ? (finalMethod === 'ASAAS' ? 'ASAAS_PIX' : 'PIX_MANUAL') : 'FREE'
      });
      
      if (price > 0 && finalMethod === 'ASAAS') {
          setSuccessMsg("Reserva PENDENTE! Pague o Pix do Asaas em até 30min para confirmar.");
      } else if (price > 0 && finalMethod === 'MANUAL') {
          setSuccessMsg("Reserva PENDENTE! Faça o Pix e envie o comprovante em até 30min.");
      } else {
          setSuccessMsg("Reserva confirmada com sucesso!");
      }

      loadData(); 
      setSelectedArea(null);
      setActiveTab('my-bookings');
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || e.response?.data || "Erro ao processar reserva. Tente novamente.");
    }
  };

  // --- HELPERS ---
  const myBookings = bookings.filter(b => b.userId === user?.id);
  
  // Filtra reservas que precisam de atenção do síndico
  const pendingValidations = bookings.filter(b => {
      const status = b.status as string;
      return status === 'UNDER_ANALYSIS' || (status === 'PENDING' && (b as any).receiptUrl);
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': 
      case 'CONFIRMED': return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold border border-emerald-200 flex items-center gap-1"><CheckCircle size={12}/> Confirmado</span>;
      case 'PENDING': return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-bold border border-amber-200 flex items-center gap-1"><Clock size={12}/> Pendente (30m)</span>;
      case 'UNDER_ANALYSIS': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold border border-blue-200 flex items-center gap-1"><Shield size={12}/> Em Análise</span>;
      case 'REJECTED': 
      case 'CANCELLED': 
      case 'EXPIRED': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold border border-red-200 flex items-center gap-1"><XCircle size={12}/> {status === 'EXPIRED' ? 'Expirado' : 'Cancelado'}</span>;
      default: return <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-bold">{status}</span>;
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Chave copiada para a área de transferência!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Espaços e Reservas</h1>
          <p className="text-slate-500">Agende áreas comuns com segurança e flexibilidade.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
           <button onClick={() => setActiveTab('areas')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'areas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Reservar</button>
           <button onClick={() => setActiveTab('my-bookings')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'my-bookings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Minhas Reservas</button>
           {user?.role === 'MANAGER' || user?.role === 'SINDICO' ? (
             <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'manage' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                Gestão 
                {pendingValidations.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{pendingValidations.length}</span>
                )}
             </button>
           ) : null}
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center border border-red-200 animate-in slide-in-from-top-2"><XCircle className="w-5 h-5 mr-2" /> {errorMsg}</div>}
      {successMsg && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center border border-emerald-200 animate-in slide-in-from-top-2"><CheckCircle className="w-5 h-5 mr-2" /> {successMsg}</div>}

      {/* --- TAB: AREAS (RESERVAR) --- */}
      {activeTab === 'areas' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* LISTA DE ÁREAS */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
            {areas.map(area => (
              <div 
                key={area.id} 
                className={`bg-white rounded-xl border overflow-hidden transition-all cursor-pointer ${selectedArea?.id === area.id ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-lg scale-[1.02]' : 'border-slate-200 hover:shadow-lg'}`}
                onClick={() => { setSelectedArea(area); setSuccessMsg(''); setErrorMsg(''); }}
              >
                <div className="h-48 bg-slate-200 relative">
                  {area.imageUrl ? (
                    <img src={area.imageUrl} alt={area.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><CalendarDays size={48}/></div>
                  )}
                  <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                    {area.price && area.price > 0 ? `R$ ${Number(area.price).toFixed(2)}` : 'Grátis'}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg text-slate-900">{area.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{area.description}</p>
                  <div className="flex items-center text-xs font-medium text-emerald-700 mt-4 space-x-4 bg-emerald-50 p-2 rounded-lg">
                    <span className="flex items-center"><Users className="w-4 h-4 mr-1.5" /> Max {area.capacity}</span>
                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1.5" /> 08:00 - 22:00</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FORMULÁRIO DE RESERVA */}
          <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xl sticky top-6">
                {selectedArea ? (
                  <form onSubmit={handleCreateBooking}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Finalizar Reserva</h3>
                            <p className="text-sm text-slate-500">{selectedArea.name}</p>
                        </div>
                        <button type="button" onClick={() => setSelectedArea(null)}><XCircle className="text-slate-400 hover:text-slate-600"/></button>
                    </div>

                    <div className="space-y-4">
                        {/* SELETOR DE PAGAMENTO HÍBRIDO */}
                        {selectedArea.price > 0 && (
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                                    <Wallet size={14}/> Forma de Pagamento
                                </label>
                                
                                {paymentConfig.enableAsaas && paymentConfig.enableManualPix ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => setSelectedPaymentMethod('ASAAS')}
                                            className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-2 transition-all ${selectedPaymentMethod === 'ASAAS' ? 'border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            <CreditCard size={20}/> Pix Automático (Asaas)
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setSelectedPaymentMethod('MANUAL')}
                                            className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-2 transition-all ${selectedPaymentMethod === 'MANUAL' ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                        >
                                            <Landmark size={20}/> Conta do Condomínio
                                        </button>
                                    </div>
                                ) : paymentConfig.enableAsaas ? (
                                    <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 font-bold text-center border border-blue-100 flex items-center justify-center gap-2">
                                        <CreditCard size={16}/> Pagamento via Pix Automático (Asaas)
                                    </div>
                                ) : (
                                    <div className="bg-emerald-50 p-3 rounded text-xs text-emerald-800 font-bold text-center border border-emerald-100 flex items-center justify-center gap-2">
                                        <Landmark size={16}/> Pagamento na Conta do Condomínio
                                    </div>
                                )}

                                {/* Exibe dados se for Manual ou se for a única opção */}
                                {(selectedPaymentMethod === 'MANUAL' || (!paymentConfig.enableAsaas && paymentConfig.enableManualPix)) && (
                                    <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-600 animate-in fade-in slide-in-from-top-1">
                                        <p className="font-bold mb-1">Dados para Transferência:</p>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono bg-white px-2 py-0.5 rounded border select-all">{paymentConfig.pixKey || 'Chave não cadastrada'}</span>
                                            <button type="button" onClick={() => copyToClipboard(paymentConfig.pixKey)} className="text-blue-600 hover:text-blue-800"><Copy size={12}/></button>
                                        </div>
                                        <p>{paymentConfig.bankName} - Ag: {paymentConfig.agency} Cc: {paymentConfig.account}</p>
                                        <div className="mt-2 bg-yellow-50 p-2 rounded border border-yellow-200 text-yellow-800 flex items-start gap-2">
                                            <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                                            <span><strong>Atenção:</strong> Você tem 30 minutos para enviar o comprovante. Após esse tempo, a reserva será cancelada.</span>
                                        </div>
                                    </div>
                                )}

                                {/* Exibe aviso se for Asaas */}
                                {(selectedPaymentMethod === 'ASAAS' || (paymentConfig.enableAsaas && !paymentConfig.enableManualPix)) && (
                                    <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-600 animate-in fade-in slide-in-from-top-1">
                                        <div className="mt-2 bg-yellow-50 p-2 rounded border border-yellow-200 text-yellow-800 flex items-start gap-2">
                                            <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                                            <span><strong>Atenção:</strong> O pagamento deve ser confirmado em até 30 minutos para garantir a vaga.</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                          <label className="text-xs font-bold text-slate-700 uppercase">Data Desejada</label>
                          <input 
                            type="date" 
                            required 
                            min={new Date().toISOString().split('T')[0]} 
                            value={bookingForm.date} 
                            onChange={e => setBookingForm({...bookingForm, date: e.target.value})} 
                            className="w-full p-2.5 mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-xs font-bold text-slate-700 uppercase">Início</label>
                              <input type="time" required min="08:00" max="22:00" value={bookingForm.startTime} onChange={e => setBookingForm({...bookingForm, startTime: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-700 uppercase">Fim</label>
                              <input type="time" required min="08:00" max="22:00" value={bookingForm.endTime} onChange={e => setBookingForm({...bookingForm, endTime: e.target.value})} className="w-full p-2.5 mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Dados do Responsável</p>
                            <input type="text" placeholder="Nome Completo" required value={bookingForm.nome} onChange={e => setBookingForm({...bookingForm, nome: e.target.value})} className="w-full p-2.5 mb-2 border border-slate-300 rounded-lg text-sm" />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" placeholder="CPF" required value={bookingForm.cpf} onChange={e => setBookingForm({...bookingForm, cpf: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Bl" required value={bookingForm.bloco} onChange={e => setBookingForm({...bookingForm, bloco: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
                                    <input type="text" placeholder="Apt" required value={bookingForm.unidade} onChange={e => setBookingForm({...bookingForm, unidade: e.target.value})} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg mt-4">
                            <CheckCircle size={18}/> Confirmar Reserva
                        </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-20 text-slate-400">
                      <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20 text-slate-900" />
                      <p className="font-medium text-slate-600">Selecione um espaço ao lado</p>
                      <p className="text-sm">para ver disponibilidade e reservar.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* --- TAB: GESTÃO (SÍNDICO) --- */}
      {activeTab === 'manage' && (user?.role === 'MANAGER' || user?.role === 'SINDICO') && (
        <div className="space-y-8">
           
           {/* CONFIGURAÇÃO DE PAGAMENTO (HÍBRIDO + 2 ÁREAS SEPARADAS) */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><Banknote className="text-emerald-600"/> Configuração de Recebimento</h3>
               
               {/* ÁREA 1: ASAAS AUTOMÁTICO */}
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                   <div className="flex justify-between items-center mb-3">
                       <h4 className="font-bold text-blue-900 flex items-center gap-2"><CreditCard size={18}/> Gateway Automático (Asaas)</h4>
                       <label className="flex items-center gap-2 cursor-pointer">
                           <span className="text-xs font-bold text-blue-700 uppercase">Ativar</span>
                           <input type="checkbox" className="w-5 h-5 text-blue-600 rounded" checked={paymentConfig.enableAsaas} onChange={e => {
                               setPaymentConfig({...paymentConfig, enableAsaas: e.target.checked});
                               // Se ativar, chama save imediato para persistir
                               handleSaveConfig(e as any);
                           }} />
                       </label>
                   </div>
                   <p className="text-xs text-blue-700 mb-2">Permite que o morador pague via Pix Copia e Cola ou Boleto diretamente na plataforma. O sistema aprova a reserva automaticamente após a compensação.</p>
                   <div className="bg-white p-3 rounded border border-blue-200 flex items-start gap-2 text-xs text-slate-600">
                       <AlertCircle size={16} className="text-amber-500 shrink-0"/>
                       <span><strong>Atenção ao Custo:</strong> O Asaas cobra uma taxa administrativa por transação recebida (aprox. R$ 1,99 ou conforme seu plano). Este valor é descontado do total repassado ao condomínio.</span>
                   </div>
               </div>

               {/* ÁREA 2: PIX MANUAL DA CONTA */}
               <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                   <div className="flex justify-between items-center mb-3">
                       <h4 className="font-bold text-emerald-900 flex items-center gap-2"><Landmark size={18}/> Conta Bancária Direta (Pix Manual)</h4>
                       <label className="flex items-center gap-2 cursor-pointer">
                           <span className="text-xs font-bold text-emerald-700 uppercase">Ativar</span>
                           <input type="checkbox" className="w-5 h-5 text-emerald-600 rounded" checked={paymentConfig.enableManualPix} onChange={e => setPaymentConfig({...paymentConfig, enableManualPix: e.target.checked})} />
                       </label>
                   </div>
                   <p className="text-xs text-emerald-700 mb-4">O morador faz a transferência direta para a conta do condomínio e envia o comprovante. Requer aprovação manual do síndico. <strong>Custo Zero.</strong></p>
                   
                   {/* FORMULÁRIO DE DADOS BANCÁRIOS - CORRIGIDO (|| '') */}
                   {paymentConfig.enableManualPix && (
                       <form onSubmit={handleSaveConfig} className="grid md:grid-cols-2 gap-4 animate-in fade-in">
                           <input type="text" value={paymentConfig.bankName || ''} onChange={e => setPaymentConfig({...paymentConfig, bankName: e.target.value})} className="w-full p-2 border rounded bg-white" placeholder="Nome do Banco" />
                           <input type="text" value={paymentConfig.pixKey || ''} onChange={e => setPaymentConfig({...paymentConfig, pixKey: e.target.value})} className="w-full p-2 border rounded bg-white" placeholder="Chave Pix" />
                           <input type="text" value={paymentConfig.agency || ''} onChange={e => setPaymentConfig({...paymentConfig, agency: e.target.value})} className="w-full p-2 border rounded bg-white" placeholder="Agência" />
                           <input type="text" value={paymentConfig.account || ''} onChange={e => setPaymentConfig({...paymentConfig, account: e.target.value})} className="w-full p-2 border rounded bg-white" placeholder="Conta Corrente" />
                           <textarea value={paymentConfig.instructions || ''} onChange={e => setPaymentConfig({...paymentConfig, instructions: e.target.value})} className="w-full p-2 border rounded bg-white md:col-span-2" rows={2} placeholder="Instruções extras..." />
                           <div className="md:col-span-2 flex justify-end">
                               <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded font-bold hover:bg-emerald-700 transition-colors shadow-sm">Salvar Dados da Conta</button>
                           </div>
                       </form>
                   )}
               </div>
           </div>
           
           {/* VALIDAÇÃO DE COMPROVANTES */}
           <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-lg relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Shield className="text-blue-600"/> Validação de Comprovantes ({pendingValidations.length})</h3>
               
               {pendingValidations.length === 0 ? (
                   <p className="text-sm text-slate-400 italic">Nenhum comprovante pendente de análise.</p>
               ) : (
                   <div className="space-y-4">
                       {pendingValidations.map(booking => {
                           const areaName = areas.find(a => a.id === booking.areaId)?.name || 'Área';
                           return (
                               <div key={booking.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                                   <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-1">
                                           <span className="font-bold text-slate-800">{(booking as any).nome}</span>
                                           <span className="text-xs bg-white border px-2 py-0.5 rounded text-slate-500">Unid: {(booking as any).unidade}</span>
                                       </div>
                                       <p className="text-sm text-slate-600">{areaName} - {new Date(booking.date).toLocaleDateString()} ({booking.startTime})</p>
                                       <div className="mt-2">
                                           {(booking as any).receiptUrl ? (
                                               <a href={(booking as any).receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1">
                                                   <FileText size={12}/> Abrir Comprovante Anexado <ExternalLink size={10}/>
                                               </a>
                                           ) : (
                                               <span className="text-red-500 text-xs font-bold">Comprovante não enviado ainda.</span>
                                           )}
                                       </div>
                                   </div>
                                   <div className="flex gap-2">
                                       <button onClick={() => handleValidateReceipt(booking.id, true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                                           <ThumbsUp size={14}/> Aprovar
                                       </button>
                                       <button onClick={() => handleValidateReceipt(booking.id, false)} className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 border border-red-200">
                                           <ThumbsDown size={14}/> Rejeitar
                                       </button>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               )}
           </div>

           {/* CADASTRO DE ÁREAS */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Plus className="text-emerald-600"/> Cadastro de Áreas</h2>
                <button onClick={() => { setIsAddingArea(!isAddingArea); setEditingAreaId(null); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-slate-800">
                  {isAddingArea ? 'Cancelar' : 'Adicionar Nova Área'}
                </button>
              </div>

              {isAddingArea && (
                <form onSubmit={handleSaveArea} className="grid md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in slide-in-from-top-2">
                  <input type="text" placeholder="Nome da Área (Ex: Salão de Festas)" value={areaForm.name} onChange={e => setAreaForm({...areaForm, name: e.target.value})} className="p-3 border rounded-lg" required />
                  <input type="number" placeholder="Capacidade Máxima" value={areaForm.capacity || ''} onChange={e => setAreaForm({...areaForm, capacity: Number(e.target.value)})} className="p-3 border rounded-lg" required />
                  <input type="number" step="0.01" placeholder="Valor da Reserva (R$)" value={areaForm.price || ''} onChange={e => setAreaForm({...areaForm, price: Number(e.target.value)})} className="p-3 border rounded-lg" required />
                  
                  {/* SELEÇÃO DE IMAGEM */}
                  <div className="md:col-span-2 space-y-3 p-4 bg-white rounded-lg border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><ImageIcon size={14}/> Foto da Área</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs text-slate-400 mb-1 block">Opção A: Link Externo</label>
                              <input type="text" placeholder="https://..." value={areaForm.imageUrl} onChange={e => setAreaForm({...areaForm, imageUrl: e.target.value})} className="p-3 border rounded-lg w-full text-sm" />
                          </div>
                          
                          <div>
                              <label className="text-xs text-slate-400 mb-1 block">Opção B: Upload de Arquivo</label>
                              <div className="relative">
                                  <input type="file" onChange={handleImageUpload} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                  <div className={`p-3 border border-dashed rounded-lg w-full text-sm flex items-center justify-center gap-2 ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                                      {isUploading ? 'Enviando...' : <><Upload size={16}/> Escolher Arquivo</>}
                                  </div>
                              </div>
                          </div>
                      </div>
                      {areaForm.imageUrl && (
                          <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1">
                              <CheckCircle size={12}/> Imagem definida!
                          </div>
                      )}
                  </div>

                  <textarea placeholder="Descrição e Regras de Uso" rows={3} value={areaForm.description} onChange={e => setAreaForm({...areaForm, description: e.target.value})} className="p-3 border rounded-lg md:col-span-2" />
                  
                  <button type="submit" disabled={isUploading} className="bg-emerald-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 md:col-span-2 hover:bg-emerald-700 shadow disabled:opacity-50">
                    <Save size={18}/> Salvar Área
                  </button>
                </form>
              )}

              {/* LISTAGEM DAS ÁREAS */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {areas.map(area => (
                  <div key={area.id} className="p-4 border rounded-xl flex justify-between items-center bg-white hover:border-emerald-200 group">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                            {area.imageUrl && <img src={area.imageUrl} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{area.name}</p>
                            <p className="text-xs text-emerald-600 font-bold">R$ {Number(area.price).toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setAreaForm(area); setEditingAreaId(area.id); setIsAddingArea(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16}/></button>
                      <button onClick={() => handleDeleteArea(area.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {areas.length === 0 && <p className="text-slate-400 text-sm col-span-3 text-center py-4">Nenhuma área cadastrada.</p>}
              </div>
           </div>
        </div>
      )}

      {/* --- TAB: MINHAS RESERVAS (MORADOR) --- */}
      {activeTab === 'my-bookings' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
           <div className="p-6 border-b border-slate-100 bg-slate-50">
               <h3 className="font-bold text-slate-800">Minhas Reservas & Pagamentos</h3>
           </div>
           <table className="w-full text-sm text-left">
             <thead className="bg-white text-slate-500 border-b border-slate-200 uppercase text-xs">
               <tr><th className="px-6 py-4">Área</th><th className="px-6 py-4">Data</th><th className="px-6 py-4">Ação / Status</th></tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {myBookings.map(booking => (
                 <tr key={booking.id} className="hover:bg-slate-50">
                   <td className="px-6 py-4 font-bold text-slate-800">{areas.find(a => a.id === booking.areaId)?.name}</td>
                   <td className="px-6 py-4">
                       <p className="text-slate-800 font-medium">{new Date(booking.date).toLocaleDateString()}</p>
                       <p className="text-xs text-slate-500">{booking.startTime} - {booking.endTime}</p>
                   </td>
                   <td className="px-6 py-4">
                       <div className="flex items-center gap-4">
                           {getStatusBadge(booking.status as string)}
                           
                           {/* CRONÔMETRO SE PENDENTE */}
                           {booking.status === 'PENDING' && (
                               <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded border border-yellow-200">
                                   <Timer size={14} className="text-yellow-600"/>
                                   <BookingTimer createdAt={booking.createdAt} onExpire={loadData} />
                               </div>
                           )}

                           {/* AÇÃO: ENVIAR COMPROVANTE SE ESTIVER PENDENTE */}
                           {(booking.status === 'PENDING' || (booking.status as string) === 'UNDER_ANALYSIS') && (
                               <div className="relative group">
                                   <input 
                                       type="file" 
                                       id={`upload-${booking.id}`} 
                                       className="hidden" 
                                       onChange={(e) => handleReceiptUpload(e, booking.id)}
                                       disabled={uploadingBookingId === booking.id}
                                   />
                                   <label htmlFor={`upload-${booking.id}`} className={`cursor-pointer text-xs font-bold px-3 py-1.5 rounded border transition-all flex items-center gap-1 ${uploadingBookingId === booking.id ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
                                       {uploadingBookingId === booking.id ? 'Enviando...' : <><Upload size={12}/> {booking.status === 'PENDING' ? 'Enviar Comprovante' : 'Reenviar'}</>}
                                   </label>
                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded hidden group-hover:block text-center shadow-lg">
                                       Envie o comprovante para garantir a reserva.
                                   </div>
                               </div>
                           )}
                       </div>
                   </td>
                 </tr>
               ))}
               {myBookings.length === 0 && (
                   <tr><td colSpan={3} className="p-8 text-center text-slate-400">Você ainda não tem reservas.</td></tr>
               )}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default Spaces;