import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MessageSquare, FileCheck, Shield, Video, Send, Lock, Clock, FileText, CheckCircle, Gavel, Scale, Download, Eye, EyeOff, Layers, X
} from 'lucide-react';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext';
import SockJS from 'sockjs-client';
import { over } from 'stompjs';

// Variável global para manter a conexão WebSocket
let stompClient: any = null;

const VotingRoom: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Estados de Dados
  const [assembly, setAssembly] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  // --- NOVA LÓGICA: MULTI-UNIDADES ---
  // Inicializa com array vazio para evitar undefined no primeiro render
  const [myUnits, setMyUnits] = useState<string[]>([]);
  const [totalWeight, setTotalWeight] = useState(1); 

  // Estados de Controle do Modal de Unidades
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [tempSelectedUnits, setTempSelectedUnits] = useState<string[]>([]);

  // Estados de UI
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [chatMsg, setChatMsg] = useState('');
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'VOTE' | 'MANAGE'>('VOTE');
  const [closing, setClosing] = useState(false);
  
  // Estado que estava faltando
  const [summarizing, setSummarizing] = useState(false); 
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Permissões e Status
  const isManager = user?.role === 'MANAGER' || user?.role === 'SINDICO' || user?.role === 'ADM_CONDO' || user?.role === 'ADMIN';
  const isSecret = assembly?.votePrivacy === 'SECRET';
  const isClosed = assembly?.status === 'CLOSED' || assembly?.status === 'ENCERRADA';

  // Regra de Voto
  const canVote = (user?.role === 'MORADOR') || (user?.role === 'SINDICO') || user?.role === 'ADM_CONDO';

  // Estatísticas
  const totalVotes = assembly?.votes?.length || 0;
  // Fração Base (do usuário logado)
  const userFraction = (user as any)?.fraction || 0.0152; 
  // Fração Total da Assembleia (considerando todos os votos)
  const totalFraction = totalVotes * userFraction; 
  // Fração Total do Usuário (considerando suas múltiplas unidades)
  const myTotalFraction = userFraction * totalWeight;

  // --- CORREÇÃO F5: Sincroniza Unidades e Voto quando o User carregar ---
  useEffect(() => {
    if (user) {
        // Tenta pegar a lista vinda do login (backend AuthDTOs atualizado)
        // Se não tiver lista, pega a unidade única do cadastro. Se nada, array vazio.
        const unitsFromUser = (user as any)?.unidadesList || [user?.unidade].filter(Boolean);
        
        console.log("DEBUG: Unidades do usuário carregadas:", unitsFromUser);

        if (unitsFromUser && unitsFromUser.length > 0) {
            setMyUnits(unitsFromUser);
            setTotalWeight(unitsFromUser.length);
            // Pré-seleciona todas por padrão para facilitar o UX
            setTempSelectedUnits(unitsFromUser); 
        } else {
            // Fallback visual
            setMyUnits(['Unidade Padrão']);
        }

        // Se a assembleia já carregou, verifica se esse usuário JÁ votou
        if (assembly && assembly.votes) {
            checkIfVoted(assembly.votes);
        }
    }
  }, [user, assembly]); // Executa quando user OU assembly mudarem

  // Função auxiliar para verificar se o usuário já votou
  const checkIfVoted = (votes: any[]) => {
      if (!votes || !user) return;
      
      // O backend pode retornar o user aninhado (v.user.id) ou flat (v.userId)
      // Verifica se existe ALGUM voto deste usuário
      const myVote = votes.find((v: any) => {
          const voteUserId = v.userId || (v.user && v.user.id);
          return voteUserId === user.id;
      });

      if (myVote) {
          setHasVoted(true);
          setVoteReceipt(myVote.id || myVote.hash);
      } else {
          setHasVoted(false);
          setVoteReceipt(null);
      }
  };

  // --- LÓGICA DE CÁLCULO DA ATA ---
  const ataPreview = useMemo(() => {
    if (!assembly) return '';

    const votes = assembly.votes || [];
    
    // 1. Identifica quais opções estão disponíveis (do Banco ou Fallback)
    const activeOptions = assembly.options && assembly.options.length > 0 
      ? assembly.options 
      : [
            { id: 'sim', descricao: 'Sim' },
            { id: 'nao', descricao: 'Não' },
            { id: 'abstencao', descricao: 'Abstenção' }
        ];

    // 2. Contabiliza os votos dinamicamente comparando IDs
    const results = activeOptions.map((opt: any) => {
        const count = votes.filter((v: any) => v.optionId === opt.id).length;
        // Cálculo de % da fração ideal (opcional, mas legal na ata)
        const fractionPercent = ((count * userFraction) * 100).toFixed(4);
        return {
            name: opt.descricao || opt.label,
            count: count,
            percent: fractionPercent
        };
    });

    // 3. Gera o texto dos resultados dinâmico
    const resultsText = results.map((r: any) => 
        `- ${r.name}: ${r.count} votos (${r.percent}% da fração ideal)`
    ).join('\n');

    // 4. Define o vencedor
    // Ordena por maior número de votos
    const sortedResults = [...results].sort((a: any, b: any) => b.count - a.count);
    
    let decision = "EMPATADO";
    if (totalVotes === 0) {
        decision = "SEM QUÓRUM para deliberação";
    } else if (sortedResults[0].count > (sortedResults[1]?.count || 0)) {
        decision = `APROVADA a opção: ${sortedResults[0].name}`;
    }

    const date = new Date();
    const formattedDate = date.toLocaleDateString('pt-BR');
    
    return `ATA DA ASSEMBLEIA GERAL AGE DO CONDOMÍNIO (ID: ${assembly.id.substring(0, 8)})

Aos ${formattedDate}, encerrou-se a votação eletrônica referente à convocação enviada.

A assembleia foi realizada na modalidade VIRTUAL, em conformidade com o Art. 1.354-A do Código Civil Brasileiro.

1. DA CONVOCAÇÃO
Foi comprovado o envio de notificação aos condôminos via sistema Votzz.

2. DO QUÓRUM
Estiveram presentes (votantes) ${totalVotes} unidades, representando uma fração ideal total de ${(totalFraction * 100).toFixed(4)}%.

3. DA ORDEM DO DIA: "${assembly.titulo}"
${assembly.description}

4. DA VOTAÇÃO
O sistema registrou votos criptografados e auditáveis, com o seguinte resultado:
${resultsText}

5. DA DELIBERAÇÃO
Com base nos votos válidos, foi ${decision}.

A presente ata é gerada automaticamente pelo sistema Votzz, com hash de integridade SHA-256.





________________________________________________
Assinado digitalmente pelo Presidente da Mesa / Síndico.`;
  }, [assembly, totalVotes, totalFraction]);

  // --- 1. CONEXÃO WEBSOCKET ---
  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = () => {
        if (stompClient && stompClient.connected) {
            if (isMounted) setConnected(true);
            return;
        }

        const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';
        const baseUrl = apiUrl.replace(/\/api$/, '');
        const socketUrl = `${baseUrl}/ws-votzz`;

        const socket = new SockJS(socketUrl);
        stompClient = over(socket);
        stompClient.debug = () => {}; 

        stompClient.connect(
            {}, 
            () => { 
                if (!isMounted) return;
                setConnected(true);
                
                stompClient.subscribe(`/topic/assembly/${id}`, (message: any) => {
                    if (message.body) {
                        const newMsg = JSON.parse(message.body);
                        
                        if (!newMsg.type || newMsg.type === 'CHAT') {
                            setMessages(prev => [...prev, newMsg]);
                            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                        }
                        if (newMsg.type === 'STATUS_UPDATE') {
                            setAssembly((prev: any) => ({ ...prev, status: newMsg.status }));
                        }
                    }
                });
            },
            (error: any) => { 
                console.error("Erro WebSocket:", error);
                if (isMounted) {
                    setConnected(false);
                    setTimeout(connectWebSocket, 5000);
                }
            }
        );
    };

    if (id && user) {
        connectWebSocket();
    }

    return () => {
        isMounted = false;
        if (stompClient && stompClient.connected) {
            stompClient.disconnect(() => console.log("Desconectado"));
        }
    };
  }, [id, user]);

  // --- 2. CARGA DE DADOS ---
  useEffect(() => {
    loadData();
  }, [id]); // Carrega inicialmente pelo ID

  const loadData = async () => {
    if (!id) return;
    
    // 1. Carrega Assembleia
    try {
        const resAssembly = await api.get(`/assemblies/${id}`);
        setAssembly(resAssembly.data);
        
        // A verificação de voto foi movida para o useEffect unificado acima
        // para garantir sincronia com o user.
    } catch (e) {
        console.error("Erro ao carregar assembleia:", e);
    }

    try {
        const resChat = await api.get(`/chat/assemblies/${id}`);
        setMessages(resChat.data || []);
        setTimeout(() => chatEndRef.current?.scrollIntoView(), 500);
    } catch (e) {
        console.warn("Chat vazio ou erro:", e);
        setMessages([]);
    }
  };

  // --- 3. AÇÕES ---
  
  // Função que dispara o processo de voto
  const handleVote = () => {
    if (!id || !selectedOption || !user) return;

    console.log("DEBUG: Iniciando voto. Unidades disponíveis:", myUnits);
    
    // Se o morador tem mais de 1 unidade, perguntamos por quais ele quer votar
    if (myUnits.length > 1) {
        // Se a seleção temporária estiver vazia por algum motivo, preenche com todas
        if (tempSelectedUnits.length === 0) setTempSelectedUnits(myUnits);
        setShowUnitModal(true);
    } else {
        // Se só tem 1 unidade, vota direto
        submitFinalVote(myUnits);
    }
  };

  // Função que envia o voto real para o backend
  const submitFinalVote = async (unitsToVote: string[]) => {
    try {
      if (unitsToVote.length === 0) {
        alert("Selecione pelo menos uma unidade para votar.");
        return;
      }

      const response = await api.post(`/assemblies/${id}/vote`, { 
        optionId: selectedOption, 
        userId: user?.id,
        units: unitsToVote // Enviamos a lista de strings
      });
      
      setHasVoted(true);
      setVoteReceipt(response.data.id || 'CONFIRMADO-MULTI');
      setShowUnitModal(false);
      setTotalWeight(unitsToVote.length); // Atualiza o peso exibido
      
      alert(`Voto registrado com sucesso para ${unitsToVote.length} unidade(s)!`);
      loadData(); 
    } catch (e: any) { 
        alert("Erro ao votar: " + (e.response?.data?.message || "Tente novamente.")); 
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim() || !user) return;

    if (!stompClient || !stompClient.connected) {
        alert("Conexão perdida. Aguarde a reconexão...");
        return;
    }

    const chatDTO = {
      senderName: user.nome || user.name || user.email,
      content: chatMsg,
      userId: user.id,
      tenantId: user.tenantId, 
      assemblyId: id,
      type: 'CHAT'
    };

    try {
        stompClient.send(`/app/chat/${id}/send`, {}, JSON.stringify(chatDTO));
        setChatMsg('');
    } catch (err) {
        console.error("Erro envio msg:", err);
    }
  };

  const handleCloseAssembly = async () => {
    if (!id || !window.confirm("ATENÇÃO: Isso encerrará a votação e gerará a Ata Jurídica. Confirmar?")) return;
    setClosing(true);
    try {
        await api.patch(`/assemblies/${id}/close`); 
        loadData();
    } catch(e: any) {
        alert("Erro: " + (e.response?.data?.message || e.message));
    } finally {
        setClosing(false);
    }
  };

  const handleExportDossier = () => {
      if(!id) return;
      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';
      window.open(`${apiUrl}/assemblies/${id}/dossier`, '_blank');
  };

  // --- FUNÇÃO DE IMPRESSÃO PDF PERSONALIZADA ---
  const handlePrintAta = () => {
      if (!assembly || !ataPreview) return;

      const cleanString = (str: string) => str ? str.replace(/[^a-zA-Z0-9]/g, '_') : 'Desconhecido';
      
      const assembleiaNome = cleanString(assembly.titulo || assembly.title);
      const condominioNome = cleanString(assembly.tenant?.nome || 'Condominio');
      
      const fileName = `DossieJuridicoAssemblyVotzz_${assembleiaNome}_${condominioNome}`;

      const printWindow = window.open('', '_blank', 'width=900,height=800');
      
      if (printWindow) {
          printWindow.document.write(`
            <html>
            <head>
                <title>${fileName}</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        padding: 40px;
                        line-height: 1.6;
                        font-size: 12px;
                        color: #000;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 20px;
                    }
                    .logo {
                        font-weight: bold;
                        font-size: 20px;
                        margin-bottom: 10px;
                    }
                    .content {
                        white-space: pre-wrap;
                        text-align: justify;
                    }
                    .footer {
                        margin-top: 50px;
                        text-align: center;
                        font-size: 10px;
                        color: #666;
                        border-top: 1px solid #ccc;
                        padding-top: 10px;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">Votzz - Sistema de Governança</div>
                    <div>Registro Digital de Assembleia</div>
                </div>
                
                <div class="content">${ataPreview}</div>

                <div class="footer">
                    Documento gerado eletronicamente em ${new Date().toLocaleString()} <br/>
                    Válido para: ${assembly.tenant?.nome || 'Condomínio'} <br/>
                    Hash de integridade do sistema Votzz.
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    }
                </script>
            </body>
            </html>
          `);
          printWindow.document.close();
      } else {
          alert("Por favor, permita pop-ups para baixar o PDF.");
      }
  };

  const handleSummarizeIA = () => {
      if(!id) return;
      setSummarizing(true);
      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';
      window.open(`${apiUrl}/chat/assemblies/${id}/resumo-pdf`, '_blank');
      setTimeout(() => setSummarizing(false), 2000);
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }
    return "";
  };

  if (!assembly) return <div className="p-20 text-center animate-pulse"><Clock className="w-12 h-12 mx-auto text-slate-300 mb-4 animate-spin"/><p className="text-slate-400 font-bold">Carregando sala...</p></div>;

  // Garante opções de voto (Sim/Não/Abstenção por padrão se vazio)
  const votingOptions = assembly.options && assembly.options.length > 0 
      ? assembly.options 
      : [
            { id: 'sim', descricao: 'Sim' },
            { id: 'nao', descricao: 'Não' },
            { id: 'abstencao', descricao: 'Abstenção' }
        ];

  const toggleUnit = (unit: string) => {
    setTempSelectedUnits(prev => prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]);
  };

  return (
    <div className="space-y-6 pb-20 p-4 md:p-6">
      
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('/assemblies')} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para lista
        </button>
        {isManager && (
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button onClick={() => setActiveTab('VOTE')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'VOTE' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                  Sala de Votação
                </button>
                <button onClick={() => setActiveTab('MANAGE')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'MANAGE' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                  Gestão & Encerramento
                </button>
            </div>
        )}
      </div>

      {activeTab === 'MANAGE' && isManager ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            <Gavel className="w-6 h-6 text-emerald-400" /> Painel Legal do Síndico
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Controle de quórum e formalização jurídica (Art. 1.354-A CC).</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${isClosed ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white animate-pulse'}`}>
                            {isClosed ? 'ENCERRADA' : 'EM ANDAMENTO'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 relative z-10">
                    <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
                        <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Quórum (Unidades)</p>
                        <p className="text-3xl font-black mt-1">{totalVotes} <span className="text-sm font-medium text-slate-400">presentes</span></p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
                          <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Fração Ideal Total</p>
                          <p className="text-3xl font-black mt-1">{(totalFraction * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
                          <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Convocação</p>
                          <p className="text-3xl font-black mt-1 text-emerald-400">100% <span className="text-sm font-medium text-slate-400">entregue</span></p>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                  {!isClosed ? (
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-lg text-slate-800 mb-2">Ações Críticas</h3>
                        <p className="text-sm text-slate-500 mb-6">Ao encerrar, o sistema calculará os votos ponderados pela fração ideal e gerará a Ata automaticamente.</p>
                        <button onClick={handleCloseAssembly} disabled={closing} className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
                            {closing ? 'Processando...' : <><Lock className="w-5 h-5" /> Encerrar Votação e Lavrar Ata</>}
                        </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm flex items-center gap-4">
                            <div className="bg-emerald-100 p-3 rounded-full">
                                <CheckCircle className="w-6 h-6 text-emerald-600"/>
                            </div>
                            <div>
                                <h3 className="font-black text-lg text-emerald-800">Ata Gerada com Sucesso</h3>
                                <p className="text-sm text-emerald-600">A votação foi auditada e o documento oficial foi criado.</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-[1rem] shadow-inner border border-slate-200 font-mono text-xs leading-relaxed text-slate-700 overflow-y-auto max-h-96 whitespace-pre-wrap">
                            {ataPreview}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={handlePrintAta} className="w-full bg-slate-800 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg">
                                <FileText className="w-5 h-5" /> Baixar Ata (PDF)
                            </button>
                            <button onClick={handleExportDossier} className="w-full bg-slate-700 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all border border-slate-600">
                                <Shield className="w-5 h-5" /> Exportar Dossiê Jurídico
                            </button>
                        </div>
                    </div>
                  )}
              </div>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
            
            <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">{assembly.titulo || assembly.title}</h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wide">{assembly.type || assembly.tipoAssembleia}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${isClosed ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {isClosed ? 'Encerrada' : 'Aberta para Votos'}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {isSecret ? <><EyeOff size={14}/> Voto Secreto</> : <><Eye size={14}/> Voto Aberto</>}
                        </div>
                        {connected ? (
                            <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1 mt-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> Conectado</span>
                        ) : (
                            <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 mt-1"><span className="w-2 h-2 bg-red-500 rounded-full"/> Offline</span>
                        )}
                    </div>
                </div>

                {assembly.youtubeLiveUrl ? (
                    <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-900 relative group">
                        <iframe 
                            width="100%" height="100%" 
                            src={`${getYoutubeEmbedUrl(assembly.youtubeLiveUrl)}?autoplay=1&mute=0`} 
                            title="Live" frameBorder="0" allowFullScreen
                            className="absolute inset-0 w-full h-full"
                        ></iframe>
                    </div>
                ) : (
                    <div className="aspect-video bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                        <Video size={48} className="mb-4 opacity-20"/>
                        <p className="font-bold">Nenhum link de transmissão configurado.</p>
                    </div>
                )}

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="text-slate-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2"><FileText size={16}/> Pauta Oficial</h3>
                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {assembly.description}
                    </div>
                    
                    {assembly.anexoUrl && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h4 className="text-xs font-black text-slate-400 uppercase mb-3">Documentos Anexos</h4>
                            <a href={assembly.anexoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors group">
                                <div className="bg-white p-2 rounded-lg border border-slate-200 text-red-500"><FileText size={20}/></div>
                                <span className="font-bold text-slate-700 text-sm group-hover:text-blue-600">Documento da Assembleia (PDF)</span>
                                <Download size={16} className="ml-auto text-slate-400"/>
                            </a>
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <Lock className="h-5 w-5 mr-2 text-emerald-600" />
                        Cédula de Votação
                    </h3>

                    <div className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1 flex justify-between">
                            <span>Seu Poder de Voto</span>
                            {/* MOSTRA O TOTAL DE UNIDADES AQUI */}
                            {totalWeight > 1 && <span className="text-emerald-600 flex items-center gap-1"><Layers size={10}/> {totalWeight} Unidades</span>}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                            {myUnits.map((u, i) => (
                                <span key={i} className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-600 font-mono">{u}</span>
                            ))}
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                            <span className="text-sm font-medium text-slate-700">Fração Total:</span>
                            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold flex items-center">
                                <Scale className="w-3 h-3 mr-1" /> {(myTotalFraction * 100).toFixed(4)}%
                            </span>
                        </div>
                    </div>

                    {isSecret ? (
                        <div className="flex items-center text-xs text-purple-700 bg-purple-50 p-2 rounded mb-4">
                            <EyeOff className="w-3 h-3 mr-1" /> Votação Secreta.
                        </div>
                    ) : (
                        <div className="flex items-center text-xs text-blue-700 bg-blue-50 p-2 rounded mb-4">
                            <Eye className="w-3 h-3 mr-1" /> Voto Aberto.
                        </div>
                    )}

                    {hasVoted ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckIcon className="h-6 w-6 text-emerald-600" />
                            </div>
                            <h4 className="font-bold text-emerald-900">Voto Confirmado</h4>
                            <p className="text-sm text-emerald-700 mt-1 mb-3">Obrigado por participar.</p>
                            <div className="text-xs bg-white p-2 rounded border border-emerald-100 text-slate-500 break-all font-mono">
                                Receipt: {voteReceipt}
                            </div>
                        </div>
                    ) : isClosed ? (
                        <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-center text-slate-500">
                            <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="font-bold">Votação Encerrada</p>
                        </div>
                    ) : canVote ? (
                        <div className="space-y-3">
                            {votingOptions.map((opt: any) => (
                                <button
                                    key={opt.id || opt.descricao}
                                    onClick={() => setSelectedOption(opt.id || opt.descricao)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                                        selectedOption === (opt.id || opt.descricao)
                                        ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 text-emerald-900' 
                                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                    }`}
                                >
                                    <span className="font-medium">{opt.descricao || opt.label}</span>
                                </button>
                            ))}
                            <button
                                onClick={handleVote}
                                disabled={!selectedOption}
                                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg shadow-md transition-colors"
                            >
                                {/* BOTÃO DINÂMICO CONFORME QUANTIDADE DE UNIDADES */}
                                {myUnits.length > 1 ? 'Selecionar Unidades & Confirmar' : 'Confirmar Voto Seguro'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                            <Shield className="mx-auto mb-2 opacity-50" size={32}/>
                            <p className="font-bold text-sm">Apenas moradores habilitados podem votar.</p>
                        </div>
                    )}
                    
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-start text-xs text-slate-500">
                            <FileCheck className="h-4 w-4 mr-2 flex-shrink-0 text-slate-400" />
                            <p>Em conformidade com Art. 1.354-A do CC. Hash auditável e imutável.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border shadow-lg overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                        <span className="font-black text-slate-700 flex items-center gap-2"><MessageSquare size={18}/> Chat</span>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Ao Vivo</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                        {messages.length === 0 && <div className="text-center mt-20 opacity-30"><MessageSquare size={48} className="mx-auto mb-2"/><p className="font-bold text-xs">Nenhuma mensagem.</p></div>}
                        {messages.map((m, idx) => (
                            <div key={idx} className={`flex flex-col ${m.userId === user?.id ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">{m.senderName}</span>
                                    <span className="text-[9px] text-slate-300">{new Date(m.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className={`p-3 rounded-2xl max-w-[90%] text-sm shadow-sm ${m.userId === user?.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendChat} className="p-3 bg-white border-t flex gap-2 items-center">
                        <input 
                            value={chatMsg} 
                            onChange={e => setChatMsg(e.target.value)} 
                            placeholder="Escreva sua mensagem..." 
                            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                            disabled={isClosed}
                        />
                        <button type="submit" disabled={!chatMsg.trim() || !connected || isClosed} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200">
                            <Send size={18}/>
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* MODAL DE SELEÇÃO DE UNIDADES (APARECE SE TIVER > 1 UNIDADE) */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 scale-in-center">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Layers className="text-emerald-600" /> Unidades
                </h3>
                <button onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-6 font-medium text-center">Você possui múltiplas unidades. Selecione por quais deseja votar agora:</p>
            
            <div className="space-y-2 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {myUnits.map(unit => (
                <label key={unit} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${tempSelectedUnits.includes(unit) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <input 
                    type="checkbox" 
                    checked={tempSelectedUnits.includes(unit)}
                    onChange={() => {
                        toggleUnit(unit);
                    }}
                    className="w-5 h-5 text-emerald-600 rounded-lg border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-700">{unit}</span>
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => submitFinalVote(tempSelectedUnits)}
                disabled={tempSelectedUnits.length === 0}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
              >
                Confirmar {tempSelectedUnits.length} Voto(s)
              </button>
              <button onClick={() => setShowUnitModal(false)} className="w-full text-slate-400 font-bold py-2 hover:text-slate-600 transition-colors text-center">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CheckIcon = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default VotingRoom;