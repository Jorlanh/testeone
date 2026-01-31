import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  MapPin, 
  Users, 
  Clock, 
  Plus, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Wallet, 
  Edit, 
  Save, 
  Trash2, 
  Search, 
  User as UserIcon, 
  Upload, 
  ImageIcon, 
  Shield, 
  ArrowRight, 
  FileText, 
  Banknote, 
  Copy, 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown, 
  CreditCard, 
  Landmark, 
  AlertTriangle, 
  Timer, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  Info,
  CalendarCheck,
  DollarSign,
  QrCode,
  Image as ImageIcon2
} from 'lucide-react';
import api from '../services/api'; 
import { CommonArea, Booking, User, BookingStatus } from '../types';
import { useAuth } from '../context/AuthContext';

// ============================================================================
//  SEÇÃO 1: INTERFACES E TIPOS DE DADOS DO SISTEMA
// ============================================================================

/**
 * Interface que define a estrutura de configuração de pagamentos do condomínio.
 * Estes dados são geridos pelo Síndico/Admin e afetam como os moradores pagam.
 * * @property enableAsaas - Define se o pagamento via Asaas (Pix Automático) está ativo.
 * @property enableManualPix - Define se o pagamento via Pix Manual (Conta Direta) está ativo.
 * @property bankName - Nome do banco para depósito manual.
 * @property agency - Agência bancária.
 * @property account - Conta corrente/poupança.
 * @property pixKey - Chave Pix do condomínio.
 * @property instructions - Instruções adicionais para o morador (ex: enviar comprovante no WhatsApp).
 * @property asaasAccessToken - Chave de API do Asaas (Token de Produção - $aact...). 
 * Essencial para que o pagamento caia na conta correta do condomínio.
 * @property asaasWalletId - ID da Carteira Asaas (Wallet ID) - Novo campo solicitado.
 */
interface CondoPaymentConfig {
  enableAsaas: boolean;
  enableManualPix: boolean;
  
  // Dados bancários para o Pix Manual
  bankName: string;
  agency: string;
  account: string;
  pixKey: string;
  instructions: string;

  // Configurações do Asaas
  asaasAccessToken?: string; 
  asaasWalletId?: string; // Novo campo para Wallet ID
}

/**
 * Interface auxiliar para controlar o estado do formulário de reserva
 * Mantém os dados temporários enquanto o usuário preenche.
 */
interface BookingFormData {
  date: string;
  startTime: string;
  endTime: string;
  nome: string;
  cpf: string;
  bloco: string;
  unidade: string;
}

/**
 * Interface para os dados de pagamento retornados após a criação da reserva.
 */
interface PaymentResponseData {
  bookingId: string;
  billingType: string;
  pixCopyPaste?: string; // Código Pix Copia e Cola
  invoiceUrl?: string;   // Link do Boleto/Fatura
  qrCodeImage?: string;  // Base64 ou URL do QR Code (Imagem)
  value: number;
}

// ============================================================================
//  SEÇÃO 2: COMPONENTES AUXILIARES E MODAIS
// ============================================================================

/**
 * Componente BookingTimer:
 * Exibe um contador regressivo para o tempo limite de pagamento da reserva.
 * * Regra de Negócio: 
 * O sistema concede uma janela de 30 minutos para o pagamento ou envio do comprovante.
 * Se o tempo expirar, a reserva é cancelada e o horário volta a ficar livre para outros moradores.
 * * @param createdAt Data de criação da reserva (string ISO)
 * @param onExpire Callback executado quando o tempo expira (para recarregar a lista)
 */
const BookingTimer: React.FC<{ createdAt: string; onExpire: () => void }> = ({ createdAt, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const interval = setInterval(() => {
            const created = new Date(createdAt).getTime();
            const now = new Date().getTime();
            // Regra: 30 minutos em milissegundos para expiração
            const deadline = created + (30 * 60 * 1000); 
            const distance = deadline - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft("Expirado");
                // Notifica o componente pai para atualizar a UI imediatamente (recarregar dados)
                onExpire(); 
            } else {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
                // Formatação para sempre mostrar 2 dígitos (09:05)
                const m = minutes < 10 ? `0${minutes}` : minutes;
                const s = seconds < 10 ? `0${seconds}` : seconds;
                
                setTimeLeft(`${m}m ${s}s`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [createdAt, onExpire]);

    return (
        <span className="font-mono text-red-600 font-bold text-xs bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center gap-1 animate-pulse">
            <Timer size={10} />
            {timeLeft}
        </span>
    );
};

/**
 * Componente PaymentModal:
 * Exibe as instruções de pagamento APÓS a reserva ser criada com sucesso.
 * Simula a "abertura da área do Asaas" ou Pix Manual.
 * Agora suporta a exibição da imagem do QR Code se o backend retornar.
 */
const PaymentModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    data: PaymentResponseData | null;
    method: 'ASAAS' | 'MANUAL' | 'FREE' | null;
    config: CondoPaymentConfig;
}> = ({ isOpen, onClose, data, method, config }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header do Modal */}
                <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Banknote className="text-emerald-400"/> Pagamento Pendente
                        </h3>
                        <p className="text-slate-400 text-xs mt-1">Sua reserva foi pré-agendada! Finalize agora.</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-white/10 p-2 rounded-full">
                        <XCircle size={20} />
                    </button>
                </div>

                {/* Conteúdo do Modal */}
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    {/* Alerta de Tempo */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3 animate-pulse">
                        <Timer className="text-amber-600 shrink-0 mt-0.5" size={20}/>
                        <div>
                            <p className="text-sm font-bold text-amber-800">Você tem 30 minutos!</p>
                            <p className="text-xs text-amber-700">O não pagamento/envio resultará no cancelamento automático.</p>
                        </div>
                    </div>

                    {/* Conteúdo Específico por Método: ASAAS */}
                    {method === 'ASAAS' && data && (
                        <div className="space-y-5">
                            <div className="text-center">
                                <p className="text-sm text-slate-500 mb-3 font-medium">Escaneie o QR Code para pagar:</p>
                                
                                {/* Exibição do QR Code (Imagem real ou Placeholder) */}
                                <div className="w-56 h-56 bg-white mx-auto rounded-xl border-2 border-slate-200 shadow-inner flex items-center justify-center mb-2 overflow-hidden relative">
                                    {data.qrCodeImage ? (
                                        <img 
                                            src={`data:image/png;base64,${data.qrCodeImage}`} 
                                            alt="QR Code Pix" 
                                            className="w-full h-full object-contain p-2"
                                        />
                                    ) : (
                                        <div className="text-center text-slate-400">
                                            <QrCode size={64} className="mx-auto mb-2 opacity-20"/>
                                            <p className="text-xs px-4">QR Code não gerado visualmente. Use o código abaixo.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Pix Copia e Cola</label>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly 
                                        value={data.pixCopyPaste || "Código Pix indisponível no momento."} 
                                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 truncate focus:ring-2 focus:ring-emerald-500 outline-none"
                                        onClick={(e) => e.currentTarget.select()}
                                    />
                                    <button 
                                        onClick={() => { navigator.clipboard.writeText(data.pixCopyPaste || ""); alert("Código Pix Copiado!"); }}
                                        className="bg-emerald-100 text-emerald-700 px-4 rounded-lg hover:bg-emerald-200 transition-colors font-bold"
                                    >
                                        <Copy size={18}/>
                                    </button>
                                </div>
                            </div>

                            {data.invoiceUrl && (
                                <a 
                                    href={data.invoiceUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                                >
                                    <ExternalLink size={16}/> Abrir Boleto / Fatura Completa
                                </a>
                            )}
                        </div>
                    )}

                    {/* Conteúdo Específico por Método: MANUAL */}
                    {method === 'MANUAL' && (
                        <div className="space-y-5">
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2 border-b pb-2 border-slate-200">
                                    <Landmark size={16} className="text-slate-500"/> Dados da Conta do Condomínio
                                </h4>
                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                                        <span>Banco:</span> 
                                        <span className="font-bold text-slate-800">{config.bankName || "Não informado"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                                        <span>Agência:</span> 
                                        <span className="font-bold text-slate-800">{config.agency || "---"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                                        <span>Conta:</span> 
                                        <span className="font-bold text-slate-800">{config.account || "---"}</span>
                                    </div>
                                    
                                    <div className="pt-3">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">Chave Pix</p>
                                        <div className="flex gap-2 items-center bg-white p-3 rounded-lg border border-slate-300 shadow-sm">
                                            <code className="flex-1 text-sm font-mono text-emerald-700 break-all">{config.pixKey || "Chave não cadastrada"}</code>
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(config.pixKey); alert("Chave Pix Copiada!"); }} 
                                                className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                                                title="Copiar Chave"
                                            >
                                                <Copy size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <p className="text-sm text-slate-600 mb-3">
                                    Após realizar a transferência, é <strong>obrigatório</strong> enviar o comprovante para validar sua reserva.
                                </p>
                                <button 
                                    onClick={onClose} 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <ImageIcon2 size={18}/> Ir para "Minhas Reservas" e Anexar Comprovante
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer do Modal */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
                    <button onClick={onClose} className="text-slate-500 text-xs font-bold hover:text-slate-800 underline">
                        Fechar e Pagar Depois
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
//  COMPONENTE PRINCIPAL: SPACES
//  Gerencia Áreas Comuns, Reservas, Pagamentos e Configurações
// ============================================================================

const Spaces: React.FC = () => {
  const { user } = useAuth();
  
  // --------------------------------------------------------------------------
  //  ESTADOS (STATES) - Gerenciamento de Dados e UI
  // --------------------------------------------------------------------------

  // Dados principais (Áreas Comuns e Lista de Reservas)
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]); 
  const [selectedArea, setSelectedArea] = useState<CommonArea | null>(null);
  
  // Navegação entre abas (Tabs)
  const [activeTab, setActiveTab] = useState<'areas' | 'my-bookings' | 'manage'>('areas');
  
  // Configuração Financeira (Carregada do Backend)
  // Inicializada com valores padrão seguros
  const [paymentConfig, setPaymentConfig] = useState<CondoPaymentConfig>({
    enableAsaas: false,
    enableManualPix: true, 
    bankName: '', agency: '', account: '', pixKey: '', instructions: '',
    asaasAccessToken: '', // Inicializa vazio
    asaasWalletId: ''     // Inicializa vazio
  });

  // Controle de UI (Edição, Visibilidade, Modais)
  const [isEditingConfig, setIsEditingConfig] = useState(false); // Bloqueia inputs de config por padrão
  const [showAsaasKey, setShowAsaasKey] = useState(false);     // Toggle para ver a chave de API
  
  // Estado para o Modal de Pagamento (Novo Recurso Solicitado)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [lastPaymentData, setLastPaymentData] = useState<PaymentResponseData | null>(null);

  // Formulário de Reserva (Dados do Morador)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'ASAAS' | 'MANUAL' | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    date: '',
    startTime: '',
    endTime: '',
    nome: '',
    cpf: '',
    bloco: '',
    unidade: ''
  });

  // Feedback e Erros (Mensagens Globais para o usuário)
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Uploads (Controle de Estado de carregamento)
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Gestão de Áreas (Admin/Síndico - Criar/Editar/Excluir)
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaForm, setAreaForm] = useState<Partial<CommonArea>>({
    name: '', capacity: 0, price: 0, description: '', rules: '', openTime: '08:00', closeTime: '22:00', imageUrl: ''
  });

  // --------------------------------------------------------------------------
  //  EFEITOS (USE EFFECTS) - Ciclo de Vida do Componente
  // --------------------------------------------------------------------------

  // Carrega dados iniciais ao montar o componente
  useEffect(() => {
    loadData();
  }, []);

  // Preenche dados do usuário automaticamente ao abrir modal de reserva
  // Isso facilita a vida do morador, que não precisa digitar nome/cpf/unidade toda vez
  useEffect(() => {
    if (user && selectedArea) {
      setBookingForm(prev => ({
        ...prev,
        nome: user.nome || user.name || '',
        cpf: user.cpf || '',
        bloco: user.bloco || '',
        unidade: user.unidade || user.unit || ''
      }));
      // Reseta a escolha de pagamento ao abrir o modal de nova reserva para forçar uma nova escolha consciente
      setSelectedPaymentMethod(null);
      // Limpa mensagens anteriores para não confundir o usuário
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [user, selectedArea]);

  // --------------------------------------------------------------------------
  //  FUNÇÕES DE CARREGAMENTO (DATA FETCHING)
  // --------------------------------------------------------------------------

  const loadData = async () => {
    try {
      // Busca Áreas e Reservas em paralelo para otimizar o tempo de carregamento
      const [areasData, bookingsData] = await Promise.all([
        api.get('/facilities/areas'),
        api.get('/facilities/bookings')
      ]);
      setAreas(areasData.data || areasData);
      setBookings(bookingsData.data || bookingsData);

      // Busca configurações de pagamento (separado para não quebrar fluxo principal se falhar)
      // Isso é importante caso o usuário não tenha permissão de ver configs (ex: morador), o resto da tela ainda deve funcionar
      try {
          const configRes = await api.get('/tenants/payment-config');
          if (configRes.data) {
              setPaymentConfig(configRes.data);
          }
      } catch (err) {
          // Apenas loga warning silencioso, pois pode ser um morador sem permissão ou config ainda não criada pelo síndico
          console.warn("Aviso: Configuração de pagamento não acessível ou inexistente.", err);
      }

    } catch (error) {
      console.error("Erro crítico ao carregar dados:", error);
      setErrorMsg("Não foi possível carregar os dados atualizados. Verifique sua conexão e recarregue a página.");
    }
  };

  // --------------------------------------------------------------------------
  //  LÓGICA DE NEGÓCIO E VALIDAÇÃO
  // --------------------------------------------------------------------------
  
  /**
   * Verifica se uma data e área estão bloqueadas.
   * Regra Crítica de Negócio:
   * 1. Se status for CANCELLED, REJECTED ou EXPIRED: A data está LIVRE.
   * 2. Se status for APPROVED, CONFIRMED, UNDER_ANALYSIS ou COMPLETED: A data está OCUPADA.
   * 3. Se status for PENDING (Aguardando Pagamento/Comprovante):
   * - Bloqueia APENAS se a reserva tiver sido criada há menos de 30 minutos.
   * - Se passou de 30 minutos e ainda está PENDING, considera LIVRE visualmente.
   * (O backend possui um job que eventualmente marca como EXPIRED para consistência no banco).
   */
  const isDateBlocked = (areaId: string, date: string) => {
    return bookings.some(b => {
        const status = b.status as string;

        // Status que liberam a agenda imediatamente
        if (['CANCELLED', 'REJECTED', 'EXPIRED'].includes(status)) return false;
        
        // Status que ocupam a agenda definitivamente ou estão em análise manual pelo síndico
        if (['APPROVED', 'CONFIRMED', 'UNDER_ANALYSIS', 'COMPLETED'].includes(status)) {
            // Verifica colisão exata de Área e Data
            return b.areaId === areaId && b.date === date;
        }

        // Status "Pendente" - ocupa temporariamente (Janela de 30 min para pagamento)
        if (status === 'PENDING') {
            const created = new Date(b.createdAt).getTime();
            const now = new Date().getTime();
            const diffMinutes = (now - created) / 1000 / 60;
            
            // Se passou de 30 minutos, libera visualmente para outros tentarem
            if (diffMinutes > 30) return false;
            
            // Se ainda está dentro dos 30 min, bloqueia para garantir a exclusividade temporária
            return b.areaId === areaId && b.date === date;
        }

        return false;
    });
  };

  /**
   * Valida os dados do formulário de reserva antes de enviar ao backend.
   * Retorna uma string com o erro ou null se estiver tudo ok.
   */
  const validateBooking = () => {
    const { date, startTime, endTime } = bookingForm;
    const today = new Date().toISOString().split('T')[0];

    if (!date) return "Selecione uma data para a reserva.";
    if (date < today) return "A reserva deve ser feita para uma data futura.";
    
    if (!startTime || !endTime) return "Defina o horário de início e fim.";
    if (startTime < "08:00" || endTime > "22:00") return "O horário permitido para reservas é estritamente das 08:00 às 22:00.";
    if (startTime >= endTime) return "O horário de início deve ser anterior ao horário de término.";
    
    // Verifica colisão de agenda usando a lógica de negócio centralizada
    if (selectedArea && isDateBlocked(selectedArea.id, date)) {
      return "DATA INDISPONÍVEL: Já existe uma reserva ativa, confirmada ou em processo de pagamento para este dia/área.";
    }

    return null;
  };

  // --------------------------------------------------------------------------
  //  ACTIONS: GESTÃO DE ÁREAS (SÍNDICO)
  // --------------------------------------------------------------------------

  // Faz o upload da imagem da área para o serviço de arquivos
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Endpoint para salvar imagem na pasta 'areas'
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

  // Salva (Cria ou Edita) uma área comum
  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAreaId) {
        await api.patch(`/facilities/areas/${editingAreaId}`, areaForm);
        setSuccessMsg("Área atualizada com sucesso!");
      } else {
        await api.post('/facilities/areas', areaForm);
        setSuccessMsg("Nova área criada com sucesso!");
      }
      setIsAddingArea(false);
      setEditingAreaId(null);
      setAreaForm({ name: '', capacity: 0, price: 0, description: '', rules: '', openTime: '08:00', closeTime: '22:00', imageUrl: '' });
      loadData();
    } catch (e) {
      setErrorMsg("Erro ao salvar área. Verifique os dados.");
    }
  };

  // Exclui uma área comum
  const handleDeleteArea = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta área permanentemente?")) return;
    try {
      await api.delete(`/facilities/areas/${id}`);
      loadData();
      setSuccessMsg("Área excluída com sucesso.");
    } catch (e) { setErrorMsg("Erro ao excluir área."); }
  };

  // --------------------------------------------------------------------------
  //  ACTIONS: CONFIGURAÇÃO DE PAGAMENTO (SÍNDICO)
  // --------------------------------------------------------------------------

  const handleSaveConfig = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await api.post('/tenants/payment-config', paymentConfig);
          alert("Configurações de pagamento salvas e auditadas com sucesso!");
          setIsEditingConfig(false); // Bloqueia novamente após salvar
          loadData();
      } catch (e) {
          console.error(e);
          alert("Erro ao salvar configurações. Verifique se você tem permissão de síndico.");
      }
  };

  // --------------------------------------------------------------------------
  //  ACTIONS: RESERVAS E PAGAMENTO (MORADOR)
  // --------------------------------------------------------------------------

  // Upload do Comprovante (Para método Pix Manual)
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>, bookingId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBookingId(bookingId);
    const formData = new FormData();
    formData.append('file', file);

    try {
        await api.post(`/facilities/bookings/${bookingId}/receipt`, formData);
        alert("Comprovante enviado com sucesso! Sua reserva está em análise pelo síndico.");
        loadData(); 
    } catch (error: any) {
        // Extração segura da mensagem de erro para evitar o crash "Objects are not valid as a React child"
        const message = error.response?.data?.message || error.message || "Erro desconhecido ao enviar comprovante.";
        alert("Erro ao enviar comprovante: " + message);
    } finally {
        setUploadingBookingId(null);
    }
  };

  // Validação Manual do Síndico (Aprovar/Rejeitar)
  const handleValidateReceipt = async (bookingId: string, isValid: boolean) => {
      const action = isValid ? "APROVAR" : "REJEITAR";
      if (!window.confirm(`Deseja realmente ${action} esta reserva/comprovante?`)) return;

      try {
          await api.patch(`/facilities/bookings/${bookingId}/validate`, { valid: isValid });
          alert(`Reserva ${isValid ? 'confirmada' : 'rejeitada'} com sucesso!`);
          loadData();
      } catch (e) {
          alert("Erro ao processar validação da reserva.");
      }
  };

  // --------------------------------------------------------------------------
  //  CRIAR RESERVA (CORE FUNCTION) - CORRIGIDA E ROBUSTA
  // --------------------------------------------------------------------------
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check inicial
    if (!selectedArea || !user) {
        setErrorMsg("Erro interno: Usuário ou Área não selecionados.");
        return;
    }
    
    // Limpa mensagens anteriores
    setErrorMsg('');
    setSuccessMsg('');

    // 1. Validação de dados do formulário
    const validationError = validateBooking();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    const price = selectedArea.price ?? 0;
    
    // 2. Determinação do método de pagamento final (Fallback seguro)
    let finalMethod = 'MANUAL'; 

    if (price > 0) {
        // Valida se o usuário escolheu um método caso ambos estejam ativos
        if (paymentConfig.enableAsaas && paymentConfig.enableManualPix && !selectedPaymentMethod) {
            setErrorMsg("Por favor, selecione uma forma de pagamento (Pix Automático ou Conta do Condomínio) antes de confirmar.");
            return;
        }
        
        // Define o método final com base na configuração do condomínio
        if (paymentConfig.enableAsaas && !paymentConfig.enableManualPix) {
             finalMethod = 'ASAAS';
        } else if (!paymentConfig.enableAsaas && paymentConfig.enableManualPix) {
             finalMethod = 'MANUAL';
        } else if (selectedPaymentMethod) {
             finalMethod = selectedPaymentMethod;
        }
    } else {
        finalMethod = 'FREE'; // Grátis
    }

    // 3. Montagem do Payload Seguro para o Backend (CORREÇÃO CRÍTICA AQUI)
    // O backend espera um Enum ou String exata para billingType: 'PIX' (Asaas) ou 'MANUAL' ou 'FREE'.
    // Corrigimos o envio de 'ASAAS_PIX' que causava erro 400.
    
    let billingTypePayload = 'FREE';
    if (price > 0) {
        if (finalMethod === 'ASAAS') {
            billingTypePayload = 'PIX'; // Mapeando ASAAS para PIX conforme esperado pelo backend
        } else {
            // Enviamos 'MANUAL' para o backend identificar que é Pix direto
            billingTypePayload = 'MANUAL'; 
        }
    }

    // DEBUG: Log do payload antes de enviar para conferência no console
    console.log("Enviando Payload de Reserva:", {
        areaId: selectedArea.id,
        userId: user.id,
        billingType: billingTypePayload,
        finalMethod: finalMethod
    });

    // 4. Confirmação do Usuário com REGRAS EXPLÍCITAS (Como solicitado)
    // Esta parte garante que o usuário esteja ciente das regras antes do POST
    let confirmMsg = `Confirmar Reserva: ${selectedArea.name}\nData: ${new Date(bookingForm.date).toLocaleDateString()}\n`;
    
    if (price > 0) {
        confirmMsg += `Valor: R$ ${price.toFixed(2)}\n`;
        confirmMsg += `Pagamento via: ${finalMethod === 'ASAAS' ? 'Pix Automático (Asaas)' : 'Transferência/Pix Manual'}\n\n`;
        
        confirmMsg += `⚠️ ATENÇÃO ÀS REGRAS DE PAGAMENTO:\n`;
        if (finalMethod === 'ASAAS') {
             confirmMsg += `- O sistema irá gerar um Pix Copia e Cola.\n`;
             confirmMsg += `- Você tem exatos 30 MINUTOS para pagar.\n`;
             confirmMsg += `- Se não pagar a tempo, a reserva expira automaticamente e libera a vaga para outro morador.\n`;
        } else {
             confirmMsg += `- Faça o Pix para a conta do condomínio (dados na tela).\n`;
             confirmMsg += `- Você tem exatos 30 MINUTOS para fazer o upload do comprovante.\n`;
             confirmMsg += `- Se não enviar o comprovante a tempo, a reserva expira automaticamente e libera a vaga.\n`;
        }
    } else {
        confirmMsg += `Valor: Gratuito\n`;
    }
    
    if(!window.confirm(confirmMsg)) return;

    try {
      // 5. Chamada ao Backend
      const response = await api.post('/facilities/bookings', {
        areaId: selectedArea.id,
        userId: user.id,
        ...bookingForm,
        billingType: billingTypePayload // Payload corrigido (PIX ou MANUAL ou FREE)
      });
      
      // Armazena dados de resposta para o modal de pagamento (se houver pix copy paste)
      const responseData = response.data;
      setLastPaymentData(responseData);

      // 6. Mensagens de Sucesso e Abertura do Modal
      if (price > 0) {
          setIsPaymentModalOpen(true); // ABRE O MODAL DE PAGAMENTO
          if (finalMethod === 'ASAAS') {
             setSuccessMsg("Reserva iniciada! Finalize o pagamento no modal.");
          } else {
             setSuccessMsg("Reserva iniciada! Envie o comprovante.");
          }
      } else {
          setSuccessMsg("Reserva gratuita confirmada com sucesso!");
      }

      loadData(); 
      setSelectedArea(null); // Fecha o formulário lateral
      setActiveTab('my-bookings'); // Redireciona para lista de reservas (onde o modal vai abrir por cima se necessário)
    } catch (e: any) {
      console.error("Erro detalhado ao criar reserva:", e);
      
      // 7. TRATAMENTO DE ERRO BLINDADO (Correção do Crash React Child)
      // O React quebra se tentarmos renderizar um objeto diretamente no JSX do erro.
      // Precisamos extrair a string da mensagem de erro com segurança.
      
      let backendMsg = "Erro desconhecido ao processar reserva.";
      
      if (e.response) {
          // Erro vindo do servidor (4xx, 5xx)
          if (e.response.data) {
              if (typeof e.response.data === 'string') {
                  // Backend retornou texto puro
                  backendMsg = e.response.data;
              } else if (typeof e.response.data === 'object') {
                  // Backend retornou JSON, tenta achar campos comuns
                  // Tenta 'message', depois 'error', e se não achar, faz stringify para não perder a info
                  backendMsg = e.response.data.message || e.response.data.error || JSON.stringify(e.response.data);
              }
          } else {
              backendMsg = `Erro ${e.response.status}: ${e.response.statusText}`;
          }
      } else if (e.message) {
          // Erro de rede ou cliente (ex: timeout)
          backendMsg = e.message;
      }
      
      // Define o erro como string pura para evitar o crash do React
      setErrorMsg(`Falha na reserva: ${backendMsg}`);
    }
  };

  // --------------------------------------------------------------------------
  //  FILTROS DE DADOS PARA EXIBIÇÃO
  // --------------------------------------------------------------------------
  const myBookings = bookings.filter(b => b.userId === user?.id);
  
  // Filtra reservas que precisam de atenção do síndico (comprovante enviado ou em análise)
  const pendingValidations = bookings.filter(b => {
      const status = b.status as string;
      // Mostra se está "Em Análise" OU se é "Pendente" mas já tem comprovante enviado
      return status === 'UNDER_ANALYSIS' || (status === 'PENDING' && (b as any).receiptUrl);
  });
  
  // Badge de Status (Estilização)
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

  // ==========================================================================
  //  RENDERIZAÇÃO (JSX)
  // ==========================================================================

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* MODAL DE PAGAMENTO (NOVO - ABRE APÓS SUCESSO) */}
      <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          data={lastPaymentData}
          method={selectedPaymentMethod}
          config={paymentConfig}
      />

      {/* HEADER E NAVEGAÇÃO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Espaços e Reservas</h1>
          <p className="text-slate-500">Agende áreas comuns com segurança e flexibilidade.</p>
        </div>
        {/* Barra de Navegação (Tabs) */}
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
           <button onClick={() => setActiveTab('areas')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'areas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Reservar</button>
           <button onClick={() => setActiveTab('my-bookings')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'my-bookings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Minhas Reservas</button>
           {/* Botão de Gestão visível apenas para Síndicos e Gerentes */}
           {['MANAGER', 'SINDICO'].includes(user?.role || '') && (
             <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'manage' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                Gestão 
                {pendingValidations.length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">{pendingValidations.length}</span>
                )}
             </button>
           )}
        </div>
      </div>

      {/* FEEDBACK MESSAGES GLOBALS */}
      {errorMsg && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center border border-red-200 animate-in slide-in-from-top-2 shadow-sm">
              <XCircle className="w-5 h-5 mr-2 shrink-0" /> 
              {/* Garante que o erro seja renderizado como string para evitar crash */}
              <span>{typeof errorMsg === 'string' ? errorMsg : "Ocorreu um erro inesperado."}</span>
          </div>
      )}
      {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center border border-emerald-200 animate-in slide-in-from-top-2 shadow-sm">
              <CheckCircle className="w-5 h-5 mr-2 shrink-0" /> 
              <span>{successMsg}</span>
          </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB: AREAS (LISTAGEM E RESERVA)                                                 */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'areas' && (
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LISTA DE ÁREAS DISPONÍVEIS (COLUNA ESQUERDA) */}
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
            {areas.length === 0 && <p className="text-slate-400 p-4">Nenhuma área comum cadastrada.</p>}
          </div>

          {/* FORMULÁRIO DE RESERVA (SIDEBAR DIREITA) */}
          <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xl sticky top-6">
                {selectedArea ? (
                  <form onSubmit={handleCreateBooking}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Finalizar Reserva</h3>
                            <p className="text-sm text-slate-500">{selectedArea.name}</p>
                        </div>
                        <button type="button" onClick={() => setSelectedArea(null)}><XCircle className="text-slate-400 hover:text-slate-600"/></button>
                    </div>

                    {/* --- REGRAS DE USO E PAGAMENTO (DESTAQUE SOLICITADO) --- */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800 space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-2 font-bold border-b border-amber-200 pb-1">
                            <Info size={14}/> REGRAS IMPORTANTES:
                        </div>
                        <ul className="list-disc pl-4 space-y-1">
                            <li><strong>Horário permitido:</strong> 08:00 às 22:00.</li>
                            <li>
                                <strong>Pagamento (Timeout):</strong> Você tem <strong>30 minutos</strong> para concluir.
                                <ul className="list-[circle] pl-4 mt-1 text-amber-900/80">
                                    {paymentConfig.enableAsaas && <li><strong>Asaas:</strong> Pague o Pix/Boleto gerado.</li>}
                                    {paymentConfig.enableManualPix && <li><strong>Conta Condomínio:</strong> Faça o Pix e <u>envie o comprovante</u> aqui.</li>}
                                </ul>
                            </li>
                            <li className="font-bold">Após 30 minutos sem pagamento/comprovante, a reserva é cancelada automaticamente e o dia volta a ficar disponível para qualquer morador.</li>
                        </ul>
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
                              <input type="time" required min="08:00" max="22:00" value={bookingForm.startTime} onChange={e => setBookingForm({...bookingForm, startTime: e.target.value})} className="w-full p-2.5 mt-1 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-700 uppercase">Fim</label>
                              <input type="time" required min="08:00" max="22:00" value={bookingForm.endTime} onChange={e => setBookingForm({...bookingForm, endTime: e.target.value})} className="w-full p-2.5 mt-1 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
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

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB: GESTÃO (SÍNDICO)                                                           */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'manage' && (user?.role === 'MANAGER' || user?.role === 'SINDICO') && (
        <div className="space-y-8">
           
           {/* CONFIGURAÇÃO DE PAGAMENTO (HÍBRIDO + 2 ÁREAS SEPARADAS) */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
               <div className="flex justify-between items-center">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><Banknote className="text-emerald-600"/> Configuração de Recebimento</h3>
                   
                   {/* BOTÃO MESTRE DE EDIÇÃO */}
                   <button 
                     onClick={() => setIsEditingConfig(!isEditingConfig)} 
                     className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isEditingConfig ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
                   >
                     {isEditingConfig ? <><XCircle size={16}/> Cancelar Edição</> : <><Edit size={16}/> Editar Configurações</>}
                   </button>
               </div>
               
               <form onSubmit={handleSaveConfig}>
                   {/* ÁREA 1: ASAAS AUTOMÁTICO */}
                   <div className={`p-4 rounded-xl border mb-6 transition-all ${paymentConfig.enableAsaas ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                       <div className="flex justify-between items-center mb-3">
                           <h4 className="font-bold text-blue-900 flex items-center gap-2"><CreditCard size={18}/> Gateway Automático (Asaas)</h4>
                           <label className="flex items-center gap-2 cursor-pointer">
                               <span className="text-xs font-bold text-blue-700 uppercase">Ativar</span>
                               <input 
                                 type="checkbox" 
                                 className="w-5 h-5 text-blue-600 rounded disabled:opacity-50" 
                                 checked={paymentConfig.enableAsaas} 
                                 onChange={e => setPaymentConfig({...paymentConfig, enableAsaas: e.target.checked})} 
                                 disabled={!isEditingConfig} // BLOQUEIO DE EDIÇÃO
                               />
                           </label>
                       </div>
                       <p className="text-xs text-blue-700 mb-2">Permite que o morador pague via Pix Copia e Cola ou Boleto diretamente na plataforma. O sistema aprova a reserva automaticamente após a compensação.</p>
                       
                       {/* CAMPO DE CHAVE ASAAS (PROTEGIDO) */}
                       {paymentConfig.enableAsaas && (
                           <div className="mt-4 border-t border-blue-200 pt-4 animate-in fade-in">
                               <label className="block text-xs font-bold text-blue-800 mb-1">
                                   Chave de API do Asaas (Produção)
                                   <span className="ml-2 font-normal text-slate-500 italic opacity-75">- Começa com "$aact_..."</span>
                               </label>
                               <div className="relative">
                                   <input 
                                       type={showAsaasKey ? "text" : "password"} 
                                       value={paymentConfig.asaasAccessToken || ''} 
                                       onChange={e => setPaymentConfig({...paymentConfig, asaasAccessToken: e.target.value})} 
                                       className="w-full p-2.5 border border-blue-300 rounded text-sm mb-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                       placeholder="$aact_..."
                                       disabled={!isEditingConfig} // BLOQUEIO DE EDIÇÃO
                                   />
                                   <button 
                                      type="button" 
                                      onClick={() => setShowAsaasKey(!showAsaasKey)} 
                                      className="absolute right-3 top-2.5 text-blue-400 hover:text-blue-600"
                                   >
                                      {showAsaasKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                                   </button>
                                   {!isEditingConfig && paymentConfig.asaasAccessToken && (
                                       <div className="absolute right-10 top-2.5 text-xs text-slate-400 flex items-center gap-1"><Lock size={12}/> Protegido</div>
                                   )}
                               </div>

                               <label className="block text-xs font-bold text-blue-800 mb-1 mt-3">
                                   ID da Carteira (Wallet ID) - Opcional
                                   <span className="ml-2 font-normal text-slate-500 italic opacity-75">- Para split de pagamento</span>
                               </label>
                               <input 
                                   type="text" 
                                   value={paymentConfig.asaasWalletId || ''} 
                                   onChange={e => setPaymentConfig({...paymentConfig, asaasWalletId: e.target.value})} 
                                   className="w-full p-2.5 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                   placeholder="wallet_..."
                                   disabled={!isEditingConfig} // BLOQUEIO DE EDIÇÃO
                               />

                               <p className="text-[10px] text-slate-500 mt-2">
                                   * Esta chave conecta a conta Asaas do condomínio ao sistema para gerar cobranças automáticas.
                               </p>
                           </div>
                       )}

                       {/* MENSAGEM DE CUSTO ASAAS */}
                       <div className="bg-white p-3 rounded border border-blue-200 flex items-start gap-2 text-xs text-slate-600 mt-2">
                           <AlertCircle size={16} className="text-amber-500 shrink-0"/>
                           <span><strong>Atenção ao Custo:</strong> O Asaas cobra uma taxa administrativa por transação recebida (R$ 1,99 ou conforme seu plano). Este valor é descontado do total repassado ao condomínio.</span>
                       </div>
                   </div>

                   {/* ÁREA 2: PIX MANUAL DA CONTA */}
                   <div className={`p-4 rounded-xl border transition-all ${paymentConfig.enableManualPix ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                       <div className="flex justify-between items-center mb-3">
                           <h4 className="font-bold text-emerald-900 flex items-center gap-2"><Landmark size={18}/> Conta Bancária Direta (Pix Manual)</h4>
                           <label className="flex items-center gap-2 cursor-pointer">
                               <span className="text-xs font-bold text-emerald-700 uppercase">Ativar</span>
                               <input 
                                 type="checkbox" 
                                 className="w-5 h-5 text-emerald-600 rounded disabled:opacity-50" 
                                 checked={paymentConfig.enableManualPix} 
                                 onChange={e => setPaymentConfig({...paymentConfig, enableManualPix: e.target.checked})} 
                                 disabled={!isEditingConfig} // BLOQUEIO DE EDIÇÃO
                               />
                           </label>
                       </div>
                       <p className="text-xs text-emerald-700 mb-4">O morador faz a transferência direta para a conta do condomínio e envia o comprovante. Requer aprovação manual do síndico. <strong>Custo Zero.</strong></p>
                       
                       {/* FORMULÁRIO DE DADOS BANCÁRIOS */}
                       {paymentConfig.enableManualPix && (
                           <div className="grid md:grid-cols-2 gap-4 animate-in fade-in">
                               <input type="text" value={paymentConfig.bankName || ''} onChange={e => setPaymentConfig({...paymentConfig, bankName: e.target.value})} className="w-full p-2 border rounded bg-white disabled:bg-slate-100 disabled:text-slate-500" placeholder="Nome do Banco" disabled={!isEditingConfig} />
                               <input type="text" value={paymentConfig.pixKey || ''} onChange={e => setPaymentConfig({...paymentConfig, pixKey: e.target.value})} className="w-full p-2 border rounded bg-white disabled:bg-slate-100 disabled:text-slate-500" placeholder="Chave Pix" disabled={!isEditingConfig} />
                               <input type="text" value={paymentConfig.agency || ''} onChange={e => setPaymentConfig({...paymentConfig, agency: e.target.value})} className="w-full p-2 border rounded bg-white disabled:bg-slate-100 disabled:text-slate-500" placeholder="Agência" disabled={!isEditingConfig} />
                               <input type="text" value={paymentConfig.account || ''} onChange={e => setPaymentConfig({...paymentConfig, account: e.target.value})} className="w-full p-2 border rounded bg-white disabled:bg-slate-100 disabled:text-slate-500" placeholder="Conta Corrente" disabled={!isEditingConfig} />
                               <textarea value={paymentConfig.instructions || ''} onChange={e => setPaymentConfig({...paymentConfig, instructions: e.target.value})} className="w-full p-2 border rounded bg-white md:col-span-2 disabled:bg-slate-100 disabled:text-slate-500" rows={2} placeholder="Instruções extras (Ex: Enviar comprovante para whatsapp tal...)" disabled={!isEditingConfig} />
                           </div>
                       )}
                   </div>

                   {/* BOTÃO SALVAR GERAL (SÓ APARECE QUANDO ESTÁ EDITANDO) */}
                   {isEditingConfig && (
                       <div className="flex justify-end mt-6 animate-in slide-in-from-bottom-2">
                           <button type="submit" className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2">
                               <Save size={18}/> Salvar Todas as Alterações
                           </button>
                       </div>
                   )}
               </form>
           </div>
           
           {/* VALIDAÇÃO DE COMPROVANTES (INALTERADO) */}
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
                                       <div className="flex items-center gap-2 mb-1"><span className="font-bold text-slate-800">{(booking as any).nome}</span><span className="text-xs bg-white border px-2 py-0.5 rounded text-slate-500">Unid: {(booking as any).unidade}</span></div>
                                       <p className="text-sm text-slate-600">{areaName} - {new Date(booking.date).toLocaleDateString()} ({booking.startTime})</p>
                                       <div className="mt-2">
                                           {(booking as any).receiptUrl ? (
                                               <a href={(booking as any).receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1"><FileText size={12}/> Abrir Comprovante Anexado <ExternalLink size={10}/></a>
                                           ) : <span className="text-red-500 text-xs font-bold">Comprovante não enviado ainda.</span>}
                                       </div>
                                   </div>
                                   <div className="flex gap-2">
                                       <button onClick={() => handleValidateReceipt(booking.id, true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"><ThumbsUp size={14}/> Aprovar</button>
                                       <button onClick={() => handleValidateReceipt(booking.id, false)} className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 border border-red-200"><ThumbsDown size={14}/> Rejeitar</button>
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               )}
           </div>

           {/* CADASTRO DE ÁREAS (INALTERADO) */}
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
                                  <div className={`p-3 border border-dashed rounded-lg w-full text-sm flex items-center justify-center gap-2 ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>{isUploading ? 'Enviando...' : <><Upload size={16}/> Escolher Arquivo</>}</div></div></div>
                      </div>
                      {areaForm.imageUrl && <div className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Imagem definida!</div>}
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
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">{area.imageUrl && <img src={area.imageUrl} className="w-full h-full object-cover" />}</div>
                        <div><p className="font-bold text-slate-800">{area.name}</p><p className="text-xs text-emerald-600 font-bold">R$ {Number(area.price).toFixed(2)}</p></div>
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
                   <td className="px-6 py-4"><p className="text-slate-800 font-medium">{new Date(booking.date).toLocaleDateString()}</p><p className="text-xs text-slate-500">{booking.startTime} - {booking.endTime}</p></td>
                   <td className="px-6 py-4">
                       <div className="flex items-center gap-4">
                           {getStatusBadge(booking.status as string)}
                           {booking.status === 'PENDING' && <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded border border-yellow-200"><Timer size={14} className="text-yellow-600"/><BookingTimer createdAt={booking.createdAt} onExpire={loadData} /></div>}
                           {(booking.status === 'PENDING' || (booking.status as string) === 'UNDER_ANALYSIS') && (
                               <div className="relative group">
                                   <input type="file" id={`upload-${booking.id}`} className="hidden" onChange={(e) => handleReceiptUpload(e, booking.id)} disabled={uploadingBookingId === booking.id} />
                                   <label htmlFor={`upload-${booking.id}`} className={`cursor-pointer text-xs font-bold px-3 py-1.5 rounded border transition-all flex items-center gap-1 ${uploadingBookingId === booking.id ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>{uploadingBookingId === booking.id ? 'Enviando...' : <><Upload size={12}/> {booking.status === 'PENDING' ? 'Enviar Comprovante' : 'Reenviar'}</>}</label>
                               </div>
                           )}
                       </div>
                   </td>
                 </tr>
               ))}
               {myBookings.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-400">Você ainda não tem reservas.</td></tr>}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default Spaces;