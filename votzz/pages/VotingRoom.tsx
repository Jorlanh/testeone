import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MessageSquare, FileCheck, Shield, Video, Sparkles, Send, Lock, Clock, FileText, CheckCircle, Gavel, Scale, Download, Eye, EyeOff
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
  
  // Estados de UI
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [chatMsg, setChatMsg] = useState('');
  const [showLive, setShowLive] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'VOTE' | 'MANAGE'>('VOTE');
  const [closing, setClosing] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Permissões e Status
  const isManager = user?.role === 'MANAGER' || user?.role === 'SINDICO' || user?.role === 'ADM_CONDO' || user?.role === 'ADMIN';
  const isSecret = assembly?.votePrivacy === 'SECRET';
  const isClosed = assembly?.status === 'CLOSED' || assembly?.status === 'ENCERRADA';

  // Regra de Voto
  const canVote = (user?.role === 'MORADOR' && !!user.unidade) || 
                  (user?.role === 'SINDICO' && !!user.unidade) || 
                  user?.role === 'ADM_CONDO';

  // Estatísticas
  const totalVotes = assembly?.votes?.length || 0;
  const userFraction = (user as any)?.fraction || 0.0152; 
  const totalFraction = totalVotes * userFraction; 

  // --- 1. CONEXÃO WEBSOCKET (CORRIGIDA) ---
  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = () => {
        // Se já existe e está conectado, não reconecta
        if (stompClient && stompClient.connected) {
            if (isMounted) setConnected(true);
            return;
        }

        const socket = new SockJS('http://localhost:8080/ws-votzz');
        stompClient = over(socket);
        stompClient.debug = () => {}; // Desativa logs no console

        stompClient.connect(
            {}, 
            () => { // Callback de Sucesso
                if (!isMounted) return;
                setConnected(true);
                
                // Inscreve no tópico da assembleia
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
            (error: any) => { // Callback de Erro
                console.error("Erro WebSocket:", error);
                if (isMounted) {
                    setConnected(false);
                    // Tenta reconectar em 5s apenas se o componente ainda estiver montado
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
  }, [id, user]);

  const loadData = async () => {
    if (!id) return;
    
    // Carrega Assembleia
    try {
        const resAssembly = await api.get(`/assemblies/${id}`);
        setAssembly(resAssembly.data);
        
        if (resAssembly.data.votes) {
            const myVote = resAssembly.data.votes.find((v: any) => v.userId === user?.id);
            if (myVote) {
                setHasVoted(true);
                setVoteReceipt(myVote.id); 
            }
        }
    } catch (e) {
        console.error("Erro ao carregar assembleia:", e);
    }

    // Carrega Chat (Try-Catch separado para não quebrar a tela se falhar)
    try {
        const resChat = await api.get(`/chat/assemblies/${id}`);
        setMessages(resChat.data || []);
        setTimeout(() => chatEndRef.current?.scrollIntoView(), 500);
    } catch (e) {
        console.warn("Chat não carregado (possível erro 500 se vazio):", e);
        setMessages([]);
    }
  };

  // --- 3. AÇÕES ---

  const handleVote = async () => {
    if (!id || !selectedOption || !user) return;
    try {
      const response = await api.post(`/assemblies/${id}/vote`, { 
        optionId: selectedOption, 
        userId: user.id 
      });
      setHasVoted(true);
      setVoteReceipt(response.data.id || 'CONFIRMADO');
      alert("Voto registrado com sucesso!");
      loadData(); 
    } catch (e: any) { 
        alert("Erro ao votar: " + (e.response?.data?.message || "Tente novamente.")); 
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim() || !user) return;

    // Verificação de segurança do socket
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
    if (!id || !window.confirm("Confirmar encerramento?")) return;
    setClosing(true);
    try {
        await api.patch(`/assemblies/${id}/close`); 
        alert("Assembleia encerrada.");
        loadData();
    } catch(e: any) {
        alert("Erro: " + (e.response?.data?.message || e.message));
    } finally {
        setClosing(false);
    }
  };

  const handleExportDossier = () => {
      if(!id) return;
      window.open(`http://localhost:8080/api/assemblies/${id}/dossier`, '_blank');
  };

  const handleSummarizeIA = () => {
      if(!id) return;
      setSummarizing(true);
      window.open(`http://localhost:8080/api/chat/assemblies/${id}/resumo-pdf`, '_blank');
      setTimeout(() => setSummarizing(false), 2000);
  };

  // Extrai ID do YouTube corretamente para Live/Embed
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    // Garante que retorna URL de embed válida para o iframe
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }
    return "";
  };

  if (!assembly) return <div className="p-20 text-center animate-pulse"><Clock className="w-12 h-12 mx-auto text-slate-300 mb-4 animate-spin"/><p className="text-slate-400 font-bold">Carregando sala...</p></div>;

  // Garante opções de voto (Sim/Não/Abstenção por padrão se vazio)
  const votingOptions = assembly.options && assembly.options.length > 0 
      ? assembly.options 
      : (assembly.pollOptions && assembly.pollOptions.length > 0 
          ? assembly.pollOptions 
          : [
              { id: 'sim', descricao: 'Sim' },
              { id: 'nao', descricao: 'Não' },
              { id: 'abstencao', descricao: 'Abstenção' }
            ]);

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!isClosed ? (
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-lg text-slate-800 mb-2">Ações Críticas</h3>
                        <p className="text-sm text-slate-500 mb-6">Ao encerrar, o sistema calculará os votos ponderados pela fração ideal e gerará a Ata automaticamente.</p>
                        <button onClick={handleCloseAssembly} disabled={closing} className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
                            {closing ? 'Processando...' : <><Lock className="w-5 h-5" /> Encerrar Votação e Lavrar Ata</>}
                        </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 shadow-sm">
                        <h3 className="font-black text-lg text-emerald-800 mb-2 flex items-center gap-2"><CheckCircle size={20}/> Ata Gerada</h3>
                        <p className="text-sm text-emerald-600 mb-6">A assembleia foi encerrada e os documentos legais estão prontos.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleSummarizeIA} className="w-full bg-white text-emerald-800 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-all border border-emerald-200">
                                <FileText className="w-5 h-5" /> Baixar Ata (PDF)
                            </button>
                            <button onClick={handleExportDossier} className="w-full bg-emerald-800 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-900 transition-all shadow-lg">
                                <Shield className="w-5 h-5" /> Exportar Dossiê Jurídico
                            </button>
                        </div>
                    </div>
                  )}
                  
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                      <h3 className="font-black text-lg text-slate-800 mb-4 flex items-center gap-2"><Sparkles className="text-purple-600"/> Inteligência Artificial</h3>
                      <button onClick={handleSummarizeIA} className="w-full py-4 bg-purple-50 text-purple-700 font-bold rounded-xl border border-purple-100 hover:bg-purple-100 transition-all flex items-center justify-center gap-2">
                          Gerar Resumo do Chat e Decisões
                      </button>
                  </div>
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

                {/* AREA DA LIVE - AGORA SEMPRE RENDERIZA O IFRAME SE TIVER URL */}
                {assembly.youtubeLiveUrl ? (
                    <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-900 relative group">
                        {/* O iframe é renderizado diretamente. O YouTube controla se mostra a live ou a thumbnail de espera */}
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
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Seu Poder de Voto</p>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700">Unidade: {user?.unidade || 'N/A'}</span>
                            <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold flex items-center">
                                <Scale className="w-3 h-3 mr-1" /> {(userFraction * 100).toFixed(4)}%
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
                            {/* Renderiza as opções ou o fallback (Sim/Não) se vazio */}
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
                                Confirmar Voto Seguro
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
    </div>
  );
};

const CheckIcon = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default VotingRoom;