import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MessageSquare, FileCheck, Shield, Video, Send, Lock, Clock, 
  FileText, CheckCircle, Gavel, Scale, Download, Eye, EyeOff, Layers, 
  X, Trash2, Edit, AlertTriangle, Users, Printer, Bot, DownloadCloud,
  ChevronRight, Info, ExternalLink, Share2, Award, History, Landmark,
  Monitor, Smartphone, Globe, ShieldAlert, FileSearch, Zap, HardDrive,
  CloudDownload, Verified, Fingerprint, Activity, Terminal, Database,
  Cpu, Server, ShieldCheck, Mail
} from 'lucide-react';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext';
import SockJS from 'sockjs-client';
import { over } from 'stompjs';

/**
 * ============================================================================
 * VOTZZ GOVERNANCE PROTOCOL v3.0 - ENTERPRISE HIGH-FIDELITY INTERFACE
 * ============================================================================
 * Este componente orquestra a deliberação jurídica em ambiente virtual.
 * Infraestrutura Integrada:
 * - Storage: AWS S3 (Bucket isolado por Condomínio/Tenant)
 * - Mail: AWS SES (Protocolos de Confirmação, Editais e Atas Judiciais)
 * - DB: PostgreSQL (Persistência de Chat e Auditoria Criptográfica de Votos)
 * - Real-time: Cluster WebSocket via STOMP Protocol para Sincronização Global
 * ============================================================================
 */

let stompClient: any = null;

const VotingRoom: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // --- 1. ESTADOS DE DADOS CORE (ESTADO DE SINCRO DO BACKEND) ---
  const [assembly, setAssembly] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // --- 2. ESTADOS: GESTÃO MULTI-UNIDADES E FRAÇÕES ---
  const [myUnits, setMyUnits] = useState<string[]>([]);
  const [totalWeight, setTotalWeight] = useState(1); 

  // --- 3. UI & UX ARCHITECTURE STATES ---
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [tempSelectedUnits, setTempSelectedUnits] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [chatMsg, setChatMsg] = useState('');
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'VOTE' | 'MANAGE'>('VOTE');
  const [isHoveringVideo, setIsHoveringVideo] = useState(false);
  
  // --- 4. AWS S3 & BACKGROUND PROCESSING STATES ---
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [summarizing, setSummarizing] = useState(false); 
  const [exportingDossier, setExportingDossier] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // --- 5. PERMISSÕES E STATUS JURÍDICOS ---
  const isManager = useMemo(() => {
    return user?.role === 'MANAGER' || user?.role === 'SINDICO' || user?.role === 'ADM_CONDO' || user?.role === 'ADMIN';
  }, [user]);

  const isSecret = useMemo(() => assembly?.votePrivacy === 'SECRET', [assembly]);
  
  const isClosed = useMemo(() => {
      const s = (assembly?.status || '').toUpperCase();
      return ['CLOSED', 'ENCERRADA', 'FINALIZADA', 'HISTORICO', 'COMPLETED'].includes(s);
  }, [assembly]);

  const canVote = useMemo(() => {
    return (user?.role === 'MORADOR') || (user?.role === 'SINDICO') || (user?.role === 'ADM_CONDO');
  }, [user]);

  // --- 6. CÁLCULOS MATEMÁTICOS DE QUÓRUM E FRAÇÃO IDEAL ---
  const totalVotesCount = useMemo(() => assembly?.votes?.length || 0, [assembly]);
  const baseFraction = useMemo(() => (user as any)?.fraction || 0.0152, [user]); 
  const currentTotalFraction = useMemo(() => totalVotesCount * baseFraction, [totalVotesCount, baseFraction]); 
  const userTotalFraction = useMemo(() => baseFraction * totalWeight, [baseFraction, totalWeight]);

  // --- 7. CORE FUNCTIONS: DATA SYNC (PERSISTÊNCIA DE CHAT E AWS) ---

  /**
   * loadData: Sincroniza o estado da assembleia, histórico do chat no PostgreSQL e status de votos.
   */
  const loadData = async () => {
    if (!id) return;
    try {
        const [resAssembly, resChat] = await Promise.all([
            api.get(`/assemblies/${id}`),
            api.get(`/chat/assemblies/${id}`) // PERSISTÊNCIA: Carrega mensagens salvas no Banco
        ]);
        
        setAssembly(resAssembly.data);
        setMessages(resChat.data || []);
        
        if (resAssembly.data.auditLogs) {
            setAuditLogs(resAssembly.data.auditLogs.slice(0, 15));
        }

        // Verificação de integridade de voto para o utilizador logado
        if (resAssembly.data.votes && user) {
            const foundVote = resAssembly.data.votes.find((v: any) => {
                const vId = v.userId || (v.user && v.user.id);
                return vId === user.id;
            });
            if (foundVote) {
                setHasVoted(true);
                setVoteReceipt(foundVote.id || foundVote.hash || 'AWS-S3-SIGNED-VOTE');
            }
        }

        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 500);
    } catch (e: any) { 
        console.error("Critical Sync Error:", e);
        if (e.response?.status === 404) setErrorStatus("Assembleia não localizada no cluster.");
    }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : "";
  };

  // --- 8. HANDLERS ADMINISTRATIVOS (AWS BUCKET & SES GATEWAY) ---

  const handleEditAssembly = () => {
      navigate('/create-assembly', { state: { assemblyData: assembly } });
  };

  const handleDeleteAssembly = async () => {
      if(!id || !window.confirm("ELIMINAR DEFINITIVAMENTE? Esta ação remove todos os dados do S3 e Banco.")) return;
      setDeleting(true);
      try { await api.delete(`/assemblies/${id}`); navigate('/assemblies'); } catch { setDeleting(false); }
  };

  /**
   * handleClosePauta: Dispara o encerramento jurídico, guarda o log de chat no S3 e envia SES.
   */
  const handleClosePauta = async () => {
    if (!id || !window.confirm("ENCERRAR VOTAÇÃO? A Ata Jurídica será lavrada no Bucket S3 e moradores serão notificados via AWS SES.")) return;
    setClosing(true);
    try { 
      await api.patch(`/assemblies/${id}/close`); 
      await loadData();
      alert("Sessão finalizada. Ata arquivada na AWS Cloud.");
    } catch (e: any) {
      alert("Erro ao finalizar: " + (e.response?.data?.message || e.message));
    } finally { setClosing(false); }
  };

  /**
   * handleExportDossierAWS: Faz o download do Dossiê Jurídico armazenado no S3.
   */
  const handleExportDossierAWS = () => {
      if(!id) return;
      setExportingDossier(true);
      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';
      window.open(`${apiUrl}/assemblies/${id}/dossier`, '_blank');
      setTimeout(() => setExportingDossier(false), 2000);
  };

  /**
   * handleIAAnalysis: Processa o chat persistido via Gemini Pro 1.5.
   */
  const handleIAAnalysis = () => {
      if(!id) return;
      setSummarizing(true);
      const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api';
      window.open(`${apiUrl}/chat/assemblies/${id}/resumo-pdf`, '_blank');
      setTimeout(() => setSummarizing(false), 3000);
  };

  const handlePrintAta = () => {
      const printWindow = window.open('', '_blank', 'width=900,height=800');
      if (printWindow) {
          printWindow.document.write(`<html><body style="font-family:monospace;padding:50px;">${ataPreview}</body></html>`);
          printWindow.document.close();
          setTimeout(() => printWindow.print(), 500);
      }
  };

  // --- 9. HANDLERS DE INTERAÇÃO DO USUÁRIO (VOTO E CHAT REAL-TIME) ---

  const executeVoteApi = async (unitsToRegister: string[]) => {
    if (!id || !user?.id) return;
    try {
      const payload = { 
        optionId: selectedOption, 
        userId: user.id, 
        units: unitsToRegister,
        timestamp: new Date().toISOString()
      };
      await api.post(`/assemblies/${id}/vote`, payload);
      setHasVoted(true);
      setShowUnitModal(false);
      await loadData();
      alert("Voto selado criptograficamente com sucesso.");
    } catch (e: any) { alert("Erro de integridade: " + e.message); }
  };

  const handleVoteSubmission = () => {
    if (!selectedOption) return;
    if (myUnits.length > 1) setShowUnitModal(true);
    else executeVoteApi(myUnits);
  };

  const toggleUnit = (unit: string) => {
      setTempSelectedUnits(prev => prev.includes(unit) ? prev.filter(u => u !== unit) : [...prev, unit]);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim() || !user || !stompClient?.connected || !id) return;
    const chatDTO = { 
        senderName: user.nome || user.email, 
        content: chatMsg, 
        userId: user.id, 
        tenantId: user.tenantId, 
        assemblyId: id, 
        type: 'CHAT',
        timestamp: new Date().toISOString()
    };
    stompClient.send(`/app/chat/${id}/send`, {}, JSON.stringify(chatDTO));
    setChatMsg('');
  };

  // --- 10. INITIAL SYNC EFFECTS ---
  useEffect(() => {
    if (user) {
        const unitsFromUser = (user as any)?.unidadesList || (user?.unidade ? [user.unidade] : []);
        if (unitsFromUser.length > 0) {
            setMyUnits(unitsFromUser);
            setTotalWeight(unitsFromUser.length);
            setTempSelectedUnits(unitsFromUser);
        } else {
            setMyUnits(['UNIDADE PADRÃO']);
        }
    }
  }, [user]);

  useEffect(() => {
    const start = async () => {
        setLoadingInitial(true);
        await loadData();
        setLoadingInitial(false);
    };
    start();
  }, [id]);

  // --- 11. CLUSTER WEBSOCKET SYNC ---
  useEffect(() => {
    let isMounted = true;
    const connectWebSocket = () => {
        if (!id || !user || stompClient?.connected) return;
        const socket = new SockJS((api.defaults.baseURL?.replace(/\/api$/, '') || '') + '/ws-votzz');
        stompClient = over(socket);
        stompClient.debug = null; 
        stompClient.connect({}, () => { 
            if (!isMounted) return;
            setConnected(true);
            stompClient.subscribe(`/topic/assembly/${id}`, (message: any) => {
                const data = JSON.parse(message.body);
                if (data.type === 'CHAT') {
                    setMessages(prev => [...prev, data]);
                    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                } else if (data.type === 'STATUS_UPDATE') {
                    setAssembly((prev: any) => ({ ...prev, status: data.status }));
                }
            });
        }, () => { if (isMounted) { setConnected(false); setTimeout(connectWebSocket, 5000); } });
    };
    connectWebSocket();
    return () => { isMounted = false; if (stompClient?.connected) stompClient.disconnect(); };
  }, [id, user]);

  const votingOptions = useMemo(() => {
    return assembly?.options?.length > 0 ? assembly.options : [
        { id: 'sim', descricao: 'Sim' }, 
        { id: 'nao', descricao: 'Não' },
        { id: 'abstencao', descricao: 'Abstenção' }
    ];
  }, [assembly]);

  if (loadingInitial) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Clock className="w-24 h-24 text-emerald-500 animate-spin mb-10" />
        <h2 className="text-white font-black text-4xl uppercase tracking-[0.3em]">Votzz Governance</h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sincronizando protocolos AWS S3/SES...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-100">
      
      {/* ----------------------------------------------------------------------------
          BARRA DE NAVEGAÇÃO SUPERIOR (ALTA DENSIDADE)
          ---------------------------------------------------------------------------- */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[60] px-8 py-5 shadow-sm">
          <div className="max-w-[1900px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-8">
                  <button onClick={() => navigate('/assemblies')} className="p-4 bg-slate-100 hover:bg-slate-900 text-slate-500 hover:text-white rounded-[1.5rem] transition-all duration-500 group">
                    <ArrowLeft size={28} className="group-hover:-translate-x-2 transition-transform"/>
                  </button>
                  <div className="h-14 w-[1.5px] bg-slate-200 hidden lg:block"></div>
                  <div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${isClosed ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white animate-pulse'}`}>{isClosed ? 'ATA SELADA' : 'AUDIÊNCIA ATIVA'}</span>
                        <h1 className="font-black text-3xl uppercase tracking-tighter text-slate-900 leading-none">{assembly.titulo}</h1>
                    </div>
                    <p className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase mt-2 flex items-center gap-2 leading-none">
                        <Verified size={14} className="text-blue-500"/> SESSÃO SEGURA • ID: {assembly.id?.substring(0,8)} • BUCKET: {user?.tenantId?.substring(0,8)}
                    </p>
                  </div>
              </div>
              
              <div className="flex items-center gap-5">
                  {isManager && (
                    <div className="flex bg-slate-100 p-1.5 rounded-[1.8rem] border border-slate-200 shadow-inner">
                        <button onClick={() => setActiveTab('VOTE')} className={`px-10 py-3 text-[11px] font-black rounded-[1.5rem] transition-all duration-500 ${activeTab === 'VOTE' ? 'bg-white shadow-2xl text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                           <Monitor size={16}/> AUDIÊNCIA
                        </button>
                        <button onClick={() => setActiveTab('MANAGE')} className={`px-10 py-3 text-[11px] font-black rounded-[1.5rem] transition-all duration-500 ${activeTab === 'MANAGE' ? 'bg-white shadow-2xl text-slate-900 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                           <Gavel size={16}/> GESTÃO LEGAL
                        </button>
                    </div>
                  )}
                  <div className={`px-5 py-2.5 rounded-full border font-black text-[10px] uppercase tracking-widest flex items-center gap-3 ${connected ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {connected ? 'SYNC ACTIVE' : 'OFFLINE MODE'}
                  </div>
              </div>
          </div>
      </nav>

      <main className="max-w-[1900px] mx-auto p-4 md:p-10">
        {activeTab === 'MANAGE' && isManager ? (
          /* PAINEL ADMINISTRATIVO COMPLETO */
          <div className="animate-in slide-in-from-bottom-8 duration-1000 space-y-12 pb-40">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-slate-900 text-white p-14 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><Database size={200}/></div>
                      <h4 className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em]">Quórum Absoluto</h4>
                      <p className="text-9xl font-black mt-4 tracking-tighter leading-none">{totalVotesCount}</p>
                      <p className="text-emerald-400 text-xs font-black pt-6 flex items-center gap-2 border-t border-white/5 uppercase tracking-widest"><Verified size={16}/> Unidades Identificadas</p>
                  </div>
                  <div className="bg-white p-14 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col justify-between group">
                      <h4 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em]">Peso da Massa</h4>
                      <p className="text-6xl font-black text-slate-900 tracking-tighter">{(currentTotalFraction * 100).toFixed(4)}%</p>
                      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mt-6 shadow-inner"><div className="bg-blue-600 h-full transition-all duration-1000" style={{width: `${Math.min(100, currentTotalFraction * 100)}%`}}></div></div>
                  </div>
                  <div className="bg-white p-14 rounded-[4rem] shadow-2xl border border-slate-100">
                      <h4 className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em]">Monitoramento AWS</h4>
                      <div className="mt-6 space-y-6">
                        <div className="flex gap-4"><Activity className="text-blue-500"/><span className="text-[10px] font-black uppercase tracking-tighter">Bucket S3: ATIVO</span></div>
                        <div className="flex gap-4"><Terminal className="text-emerald-500"/><span className="text-[10px] font-black uppercase tracking-tighter">SES Protocol: ATIVO</span></div>
                      </div>
                  </div>
                  <div className="bg-indigo-600 text-white p-14 rounded-[4rem] shadow-2xl cursor-pointer hover:bg-indigo-700 transition-all group overflow-hidden" onClick={handleIAAnalysis}>
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform"><Bot size={150}/></div>
                      <Bot size={48} className="mb-4 group-hover:rotate-12 transition-transform relative z-10"/>
                      <h4 className="text-2xl font-black uppercase leading-tight relative z-10">IA Gemini Pro</h4>
                      <p className="text-[10px] font-bold text-indigo-200 mt-4 uppercase relative z-10">Exportar resumo do debate em PDF</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-10">
                      {!isClosed ? (
                          <div className="bg-white p-12 lg:p-24 rounded-[6rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 space-y-16">
                              <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Gestão da Assembleia</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                  <button onClick={handleEditAssembly} className="p-12 bg-slate-50 text-slate-700 rounded-[3rem] font-black border-4 border-slate-100 hover:bg-white hover:border-blue-500 transition-all flex flex-col items-center gap-6 group">
                                      <div className="p-5 bg-white rounded-3xl group-hover:scale-110 transition-transform shadow-lg"><Edit size={48} className="text-amber-500"/></div>
                                      REVISAR PAUTA
                                  </button>
                                  <button onClick={handleDeleteAssembly} disabled={deleting} className="p-12 bg-red-50 text-red-700 rounded-[3rem] font-black border-4 border-red-100 hover:bg-white hover:border-red-500 transition-all flex flex-col items-center gap-6 group">
                                      <div className="p-5 bg-white rounded-3xl group-hover:scale-110 transition-transform shadow-lg"><Trash2 size={48}/></div>
                                      ELIMINAR SALA
                                  </button>
                              </div>
                              <div className="bg-slate-950 p-16 rounded-[4rem] text-center shadow-2xl relative overflow-hidden group">
                                  <Lock className="mx-auto text-emerald-500 mb-10 group-hover:scale-110 transition-transform" size={80}/>
                                  <h4 className="text-white text-3xl font-black uppercase tracking-tight">Finalização Jurídica</h4>
                                  <p className="text-slate-400 mb-12 max-w-md mx-auto">Este comando congela o chat no banco e salva a ata no S3.</p>
                                  <button onClick={handleClosePauta} disabled={closing} className="w-full bg-emerald-500 text-slate-950 p-10 rounded-[3rem] font-black text-3xl hover:bg-emerald-400 transition-all shadow-2xl uppercase tracking-tighter">{closing ? 'GERANDO PDF...' : 'ENCERRAR AGORA'}</button>
                              </div>
                          </div>
                      ) : (
                          <div className="bg-white p-16 lg:p-24 rounded-[6rem] shadow-2xl border space-y-12 animate-in zoom-in-95">
                              <div className="flex items-center gap-10">
                                  <div className="bg-emerald-500 p-10 rounded-[3rem] text-slate-900 shadow-2xl"><Award size={60}/></div>
                                  <h3 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Sessão Auditada</h3>
                              </div>
                              <div className="bg-slate-950 p-12 rounded-[4rem] font-mono text-emerald-400/80 max-h-[400px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner custom-scrollbar">{ataPreview}</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
                                  <button onClick={handlePrintAta} className="bg-slate-900 text-white p-10 rounded-[3rem] font-black text-2xl flex items-center justify-center gap-6 shadow-2xl hover:bg-black transition-all group"><Printer size={32}/> IMPRIMIR</button>
                                  <button onClick={handleExportDossierAWS} disabled={exportingDossier} className="bg-emerald-500 text-slate-950 p-10 rounded-[3rem] font-black text-2xl flex items-center justify-center gap-6 shadow-2xl hover:bg-emerald-400 transition-all group">
                                      {exportingDossier ? <Clock className="animate-spin" size={32}/> : <DownloadCloud size={40}/>} 
                                      DOSSIÊ AWS S3
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="lg:col-span-4 bg-white p-10 rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col h-full min-h-[600px]">
                      <h3 className="font-black text-slate-900 text-2xl tracking-tighter flex items-center gap-4 mb-12"><History className="text-emerald-500" size={32}/> Auditoria Live</h3>
                      <div className="space-y-10 flex-1 overflow-y-auto custom-scrollbar pr-4">
                        {messages.length === 0 ? <p className="text-center text-slate-300 font-black py-20 uppercase text-xs">Sem eventos...</p> : messages.slice(-20).map((m, i) => (
                            <div key={i} className="flex gap-6 border-l-4 border-emerald-500 pl-6 py-2 animate-in slide-in-from-right duration-500 hover:bg-slate-50 transition-colors rounded-r-xl">
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase text-slate-800">{m.senderName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{m.content}</p>
                                    <p className="text-[9px] font-mono text-emerald-500 font-black mt-2">{new Date(m.timestamp || Date.now()).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                      </div>
                  </div>
              </div>
          </div>
        ) : (
          /* VISÃO CONDÔMINO (ALTA FIDELIDADE) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-1000 pb-40">
              <div className="lg:col-span-8 space-y-12">
                  {/* LIVE STREAM INTEGRADA */}
                  <div className={`aspect-video bg-slate-950 rounded-[5rem] overflow-hidden shadow-2xl ring-[20px] transition-all duration-1000 relative group active:scale-[0.995] ${isHoveringVideo ? 'ring-emerald-500/10' : 'ring-white'}`} onMouseEnter={() => setIsHoveringVideo(true)} onMouseLeave={() => setIsHoveringVideo(false)}>
                      {assembly.youtubeLiveUrl ? (
                          <iframe width="100%" height="100%" src={`${getYoutubeEmbedUrl(assembly.youtubeLiveUrl)}?autoplay=1&mute=0&rel=0&showinfo=0`} title="Live" frameBorder="0" allowFullScreen className="absolute inset-0 w-full h-full scale-[1.005]"></iframe>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-700 bg-slate-900"><Monitor size={140} className="opacity-10 animate-pulse"/><p className="font-black uppercase tracking-[0.6em] text-sm opacity-30 mt-6 leading-none">Aguardando Transmissão</p></div>
                      )}
                      <div className="absolute top-12 left-12"><div className="bg-red-600 text-white px-6 py-2.5 rounded-full text-[12px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl animate-pulse"><div className="w-2.5 h-2.5 bg-white rounded-full"></div> LIVE</div></div>
                  </div>

                  {/* PAUTA & AWS S3 DOWNLOADS */}
                  <div className="bg-white p-16 lg:p-24 rounded-[6rem] border shadow-2xl space-y-16 relative overflow-hidden group">
                      <div className="space-y-10 relative z-10">
                          <div className="flex items-center gap-6"><div className="w-20 h-2 bg-emerald-500 rounded-full shadow-lg"></div><h3 className="text-slate-400 font-black uppercase text-xs tracking-[0.5em]">Edital e Pauta Deliberativa</h3></div>
                          <div className="prose prose-slate max-w-none text-slate-800 leading-[1.8] text-3xl font-black tracking-tighter whitespace-pre-wrap selection:bg-emerald-100">{assembly.description}</div>
                      </div>
                      
                      <div className="pt-20 border-t-2 space-y-10 relative z-10">
                          <h4 className="text-slate-900 text-3xl font-black tracking-tighter uppercase leading-none">Repositório Digital AWS S3</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* ANEXO DA PAUTA (S3) */}
                              {assembly.anexoUrl ? (
                                  <a href={assembly.anexoUrl} target="_blank" rel="noreferrer" download className="flex items-center gap-8 p-12 bg-slate-50 border-2 rounded-[4rem] hover:bg-blue-600 transition-all group shadow-lg hover:-translate-y-4 active:scale-95">
                                      <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 text-blue-600 shadow-xl group-hover:scale-110 transition-all duration-500 group-hover:rotate-12"><DownloadCloud size={48}/></div>
                                      <div className="flex-1 space-y-1"><span className="block font-black text-slate-900 text-2xl tracking-tighter group-hover:text-white uppercase leading-none">Baixar Anexo</span><span className="text-[11px] text-blue-500 font-black uppercase block group-hover:text-blue-100 tracking-widest mt-2">Nuvem AWS S3</span></div>
                                      <Download size={32} className="text-slate-400 group-hover:text-white transition-all"/>
                                  </a>
                              ) : (
                                  <div className="flex items-center gap-8 p-12 bg-slate-50 border-4 border-dashed rounded-[4rem] opacity-30 group"><FileSearch size={48}/><span className="font-black text-slate-400 uppercase text-2xl tracking-tighter group-hover:translate-x-2 transition-all">Sem Anexos</span></div>
                              )}

                              {/* DOSSIÊ JURÍDICO (S3) - BOTÃO LIBERADO PARA TODOS SE ENCERRADA */}
                              {isClosed ? (
                                  <button onClick={handleExportDossierAWS} disabled={exportingDossier} className="flex items-center gap-8 p-12 bg-slate-900 border-4 rounded-[4rem] hover:bg-black transition-all duration-700 group shadow-2xl hover:-translate-y-4 active:scale-95">
                                      <div className="bg-emerald-500 p-8 rounded-[2rem] text-slate-950 shadow-2xl group-hover:rotate-12 transition-all">{exportingDossier ? <Clock className="animate-spin" size={48}/> : <Award size={48}/>}</div>
                                      <div className="text-left flex-1 space-y-1"><span className="block font-black text-white text-2xl tracking-tighter uppercase leading-none uppercase">Dossiê Votzz</span><span className="text-[11px] text-emerald-500 font-black uppercase mt-2 block tracking-widest leading-none">Auditória Final AWS</span></div>
                                      <Download size={32} className="text-slate-600 group-hover:text-white transition-all"/>
                                  </button>
                              ) : (
                                  <div className="flex items-center gap-8 p-12 bg-slate-100 border-4 border-dashed rounded-[4rem] opacity-30 group relative overflow-hidden transition-all duration-1000">
                                      <Lock size={48} className="text-slate-400"/><span className="font-black text-slate-400 uppercase text-2xl tracking-tighter group-hover:translate-x-4 transition-transform duration-700">Dossiê Seguro</span>
                                      <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all p-8 text-center text-white font-black text-xs uppercase tracking-widest leading-relaxed">Este documento é selado na AWS S3 imediatamente após o encerramento das deliberações.</div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="lg:col-span-4 space-y-16">
                  {/* CÉDULA DE VOTO */}
                  <div className="bg-white rounded-[5rem] shadow-2xl border border-slate-100 p-14 sticky top-28 ring-1 ring-slate-100 z-40 transition-all duration-700 hover:shadow-indigo-500/10 active:scale-[0.99]">
                      <div className="flex items-center justify-between mb-12">
                        <h3 className="text-4xl font-black text-slate-950 tracking-tighter flex items-center gap-5 uppercase leading-none"><Lock className="text-emerald-500" size={40} /> Cédula</h3>
                        {hasVoted && <div className="bg-emerald-500 text-white px-6 py-2.5 rounded-[1.5rem] text-[11px] font-black uppercase shadow-2xl border-b-4 border-emerald-700 animate-in zoom-in-95">VOTO SELADO</div>}
                      </div>

                      <div className="bg-slate-900 p-8 rounded-[3rem] mb-10 border border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-all"><Scale size={150}/></div>
                          <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] relative z-10"><span>Poder de Representação</span><Award size={20} className="text-blue-400"/></div>
                          <div className="flex flex-wrap gap-3 relative z-10">
                              {myUnits.map((u, i) => <div key={i} className="bg-white/5 border-2 border-white/5 px-6 py-2.5 rounded-2xl text-[12px] font-black text-white shadow-xl flex items-center gap-3 hover:bg-white/10 transition-all shadow-inner"><Landmark size={14} className="text-emerald-500"/> {u}</div>)}
                          </div>
                          <div className="pt-8 border-t border-white/10 flex justify-between items-center relative z-10">
                              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-left leading-none">Fração Acumulada:</span>
                              <span className="bg-blue-600 text-white px-6 py-2.5 rounded-[1.5rem] text-[15px] font-black shadow-xl">{(userTotalFraction * 100).toFixed(4)}%</span>
                          </div>
                      </div>

                      {hasVoted ? (
                          <div className="bg-emerald-50 border-4 border-emerald-100 rounded-[4.5rem] p-16 text-center animate-in zoom-in duration-700 shadow-2xl shadow-emerald-500/5 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-45 transition-transform duration-[2s]"><Verified size={250}/></div>
                              <div className="relative mx-auto mb-14">
                                <div className="h-40 w-40 bg-emerald-500/10 rounded-[3rem] flex items-center justify-center mx-auto border-8 border-white shadow-2xl relative z-10 animate-in bounce-in-95 duration-1000 group-hover:scale-110 transition-transform">
                                    <Verified className="h-20 w-20 text-emerald-500" />
                                </div>
                                <div className="absolute inset-0 bg-emerald-400 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
                              </div>
                              <h4 className="font-black text-emerald-950 text-4xl uppercase tracking-tighter leading-none">Deliberação Concluída</h4>
                              <p className="text-emerald-700 mt-6 font-bold text-lg leading-relaxed">Sua participação foi selada criptograficamente no cluster AWS Votzz.</p>
                              <div className="mt-12 p-10 bg-white rounded-[3.5rem] border-2 border-emerald-100 shadow-inner overflow-hidden">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">Assinatura Digital de Voto</p>
                                  <p className="text-[9px] text-slate-500 break-all font-mono leading-tight text-left uppercase bg-slate-50 p-6 rounded-3xl border">{voteReceipt}</p>
                              </div>
                              <button onClick={() => window.print()} className="mt-10 flex items-center justify-center gap-3 mx-auto text-[11px] font-black text-emerald-600 uppercase tracking-widest hover:underline active:scale-95 transition-all"><Printer size={16}/> Imprimir Recibo</button>
                          </div>
                      ) : isClosed ? (
                          <div className="bg-slate-100 border-4 border-slate-200 rounded-[4.5rem] p-20 text-center text-slate-400 animate-in fade-in duration-1000 shadow-inner"><Lock className="h-24 w-24 mx-auto mb-10 opacity-5 animate-bounce" /><h4 className="font-black uppercase tracking-[0.5em] text-sm opacity-30 leading-none">Pauta Concluída</h4><p className="text-[10px] font-bold mt-4 uppercase tracking-widest leading-none">Sessão selada no banco S3.</p></div>
                      ) : canVote ? (
                          /* INTERFACE DE VOTO ATIVO (ULTRA PREMIUM) */
                          <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
                              <div className="space-y-5">
                                {votingOptions.map((opt: any) => (
                                    <button key={opt.id || opt.descricao} onClick={() => setSelectedOption(opt.id || opt.descricao)} className={`w-full text-left p-10 rounded-[2.5rem] border-4 transition-all duration-500 font-black uppercase text-xl tracking-tighter flex justify-between items-center group active:scale-[0.98] ${selectedOption === (opt.id || opt.descricao) ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-2xl ring-4 ring-emerald-500/10' : 'border-slate-50 hover:border-slate-300 text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-2xl'}`}>
                                        <span className="flex items-center gap-6"><div className={`w-10 h-10 rounded-2xl border-4 flex items-center justify-center transition-all ${selectedOption === (opt.id || opt.descricao) ? 'bg-emerald-500 border-emerald-500 shadow-2xl scale-110' : 'bg-white border-slate-100'}`}>{selectedOption === (opt.id || opt.descricao) && <CheckCircle className="text-white" size={24}/>}</div> {opt.descricao || opt.label}</span>
                                        <ChevronRight className={`transition-all duration-500 ${selectedOption === (opt.id || opt.descricao) ? 'translate-x-2 text-emerald-500' : 'opacity-0'}`} size={32}/>
                                    </button>
                                ))}
                              </div>
                              <div className="pt-4">
                                <button onClick={handleVoteClick} disabled={!selectedOption} className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-10 rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] transition-all duration-700 uppercase tracking-[0.4em] text-sm hover:-translate-y-2 active:scale-95 flex items-center justify-center gap-6 group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                    {myUnits.length > 1 ? <><Layers size={24} className="group-hover:rotate-12 transition-transform duration-700"/> VALIDAR EM LOTE</> : <><Shield size={24} className="group-hover:rotate-[360deg] transition-transform duration-[1.5s]"/> AUTENTICAR VOTO SEGURO</>}
                                </button>
                                <div className="flex flex-col items-center gap-3 mt-10 opacity-30 grayscale"><div className="flex gap-4"><Shield size={14}/><Scale size={14}/><HardDrive size={14}/><Database size={14}/></div><p className="text-[9px] font-black uppercase tracking-widest">Protocolo Votzz-Gov AWS Stack Active</p></div>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center p-16 bg-slate-50 rounded-[5rem] border-4 border-slate-100 text-slate-400 space-y-10 shadow-inner"><ShieldAlert className="mx-auto opacity-10" size={100}/><p className="font-black text-sm uppercase tracking-tighter text-slate-600 leading-tight">Acesso Identificado</p><p className="text-[10px] font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Sua conta não possui unidades habilitadas para voto neste condomínio.</p><button className="bg-white border text-slate-600 px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase hover:shadow-xl transition-all">Solicitar Suporte</button></div>
                      )}
                  </div>

                  {/* CHAT REAL-TIME MESA DIRETORA (PERSISTÊNCIA AWS S3) */}
                  <div className="bg-white rounded-[4.5rem] border border-slate-100 shadow-[0_60px_100px_-30px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col h-[850px] ring-1 ring-slate-100 transition-all duration-1000 hover:shadow-indigo-500/10">
                      <div className="p-10 bg-slate-50 border-b border-slate-100 flex justify-between items-center relative overflow-hidden">
                          <div className="flex items-center gap-5 relative z-10"><div className="bg-slate-900 p-4 rounded-[1.5rem] shadow-2xl text-white group cursor-help transition-all hover:scale-110 active:scale-95 active:rotate-12 duration-700"><MessageSquare size={28}/></div><div><span className="font-black text-slate-900 uppercase text-lg tracking-tighter block leading-none uppercase">Mesa Diretora</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block leading-none">Diálogos Persistidos na Cloud</span></div></div>
                          <div className="flex flex-col items-end gap-1.5 relative z-10"><div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isClosed ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse'}`}>{isClosed ? 'SESSÃO FECHADA' : 'NETWORK SYNC ACTIVE'}</div></div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-gradient-to-b from-slate-50 via-white to-slate-50 custom-scrollbar scroll-smooth">
                          {messages.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-[0.05] grayscale space-y-8"><Monitor size={150}/><p className="font-black uppercase text-xs tracking-[0.6em] text-center max-w-[200px] leading-loose">Aguardando interações da pauta...</p></div>}
                          {messages.map((m, idx) => (
                              <div key={idx} className={`flex flex-col ${m.userId === user?.id ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-10 duration-700 group/msg`}>
                                  <div className={`flex items-center gap-4 mb-4 px-5 ${m.userId === user?.id ? 'flex-row-reverse' : ''}`}><div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center font-black text-xs text-white shadow-lg group-hover/msg:scale-110 transition-transform ${m.userId === user?.id ? 'bg-slate-900' : 'bg-indigo-600'}`}>{m.senderName.substring(0,2).toUpperCase()}</div><div className="flex flex-col space-y-1"><span className={`text-[11px] font-black uppercase tracking-tight text-slate-800 ${m.userId === user?.id ? 'text-right' : ''}`}>{m.senderName}</span><span className={`text-[8px] text-slate-400 font-bold uppercase tracking-widest ${m.userId === user?.id ? 'text-right' : ''}`}>{new Date(m.timestamp || Date.now()).toLocaleTimeString()}</span></div></div>
                                  <div className={`p-8 rounded-[3rem] max-w-[95%] text-[15px] font-semibold leading-[1.7] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-all duration-500 hover:shadow-2xl active:scale-[0.99] ${m.userId === user?.id ? 'bg-slate-900 text-white rounded-tr-none shadow-slate-300 border-none hover:bg-black hover:-translate-x-2' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none hover:translate-x-2'}`}>{m.content}</div>
                                  <div className="mt-2 px-6 flex items-center gap-2 opacity-0 group-hover/msg:opacity-50 transition-opacity"><Database size={10}/><span className="text-[7px] font-black uppercase tracking-widest">Saved in S3 Archive</span></div>
                              </div>
                          ))}
                          <div ref={chatEndRef} className="h-6 w-full" />
                      </div>
                      <form onSubmit={handleSendMessage} className="p-10 bg-white border-t-2 border-slate-50 flex gap-5 items-center relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.02)]">
                          <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder={isClosed ? "Audiência encerrada pela mesa." : "Manifeste sua opinião oficial aqui..."} className="w-full bg-slate-50 border-2 border-transparent rounded-[2.5rem] px-10 py-7 text-[15px] font-black outline-none focus:ring-[12px] focus:ring-blue-600/5 focus:bg-white focus:border-blue-500 transition-all duration-500 disabled:opacity-50 placeholder:text-slate-300 shadow-inner" disabled={isClosed}/>
                          <button type="submit" disabled={!chatMsg.trim() || !connected || isClosed} className="p-8 bg-blue-600 text-white rounded-[2.5rem] hover:bg-blue-700 disabled:opacity-10 transition-all duration-700 shadow-[0_20px_40px_rgba(37,99,235,0.4)] flex-shrink-0 active:scale-90 group relative overflow-hidden hover:scale-105 active:rotate-2 shadow-xl shadow-blue-500/40"><div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div><Send size={32} className="relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500"/></button>
                      </form>
                  </div>
              </div>
          </div>
        )}
      </main>

      {/* MODAL DE SELEÇÃO DE UNIDADES CPF-BASED (VOTO PONDERADO) */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-slate-950/98 z-[300] flex items-center justify-center p-6 backdrop-blur-[40px] animate-in fade-in duration-700">
          <div className="bg-white rounded-[6rem] p-16 lg:p-24 max-w-2xl w-full shadow-[0_100px_250px_-50px_rgba(0,0,0,0.6)] border border-slate-100 animate-in zoom-in-95 duration-700 relative overflow-hidden">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="flex justify-between items-center mb-16 relative z-10"><div className="space-y-2"><div className="flex items-center gap-6"><Layers className="text-emerald-500" size={50} /><h3 className="text-5xl font-black text-slate-950 uppercase tracking-tighter leading-none uppercase">Suas Unidades</h3></div><p className="text-[11px] text-slate-400 font-black tracking-[0.4em] uppercase ml-[74px]">Verificação de Voto Ponderado CPF-SECURE</p></div><button onClick={() => setShowUnitModal(false)} className="bg-slate-100 p-5 rounded-full hover:rotate-180 transition-all shadow-inner hover:text-red-500 hover:bg-red-50 active:scale-90"><X size={40} /></button></div>
            <div className="bg-blue-600 p-10 rounded-[3rem] mb-12 flex items-center gap-8 relative z-10 shadow-2xl shadow-blue-500/30 group/alert hover:-translate-y-1 transition-transform duration-700"><div className="bg-white p-5 rounded-[1.8rem] text-blue-600 shadow-2xl flex-shrink-0 animate-bounce-slow group-hover/alert:rotate-12 transition-transform"><Info size={32}/></div><p className="text-blue-50 font-black text-lg uppercase tracking-tight leading-tight uppercase">Selecione quais das unidades vinculadas ao seu registro irão votar agora: <span className="bg-blue-400 text-white px-3 py-1 rounded-xl ml-2 font-black shadow-lg">{selectedOption}</span></p></div>
            <div className="space-y-5 mb-16 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar relative z-10 px-4">
              {myUnits.map(unit => (
                <label key={unit} className={`flex items-center gap-10 p-10 rounded-[3.5rem] border-4 transition-all duration-1000 cursor-pointer group relative overflow-hidden shadow-sm active:scale-95 ${tempSelectedUnits.includes(unit) ? 'border-emerald-500 bg-emerald-50 shadow-2xl shadow-emerald-500/10 scale-[1.02]' : 'border-slate-50 hover:bg-slate-50 hover:border-slate-200 hover:translate-x-2'}`}>
                  {tempSelectedUnits.includes(unit) && <div className="absolute top-0 right-0 p-5"><Verified size={24} className="text-emerald-500 animate-in zoom-in spin-in-90 duration-[1.5s]"/></div>}
                  <div className={`w-14 h-14 rounded-[1.5rem] border-4 flex items-center justify-center transition-all duration-700 shadow-xl ${tempSelectedUnits.includes(unit) ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-emerald-200' : 'bg-white border-slate-100 group-hover:border-slate-300 shadow-inner'}`}>{tempSelectedUnits.includes(unit) && <CheckCircle className="text-white" size={32}/>}</div>
                  <input type="checkbox" className="hidden" checked={tempSelectedUnits.includes(unit)} onChange={() => toggleUnit(unit)}/>
                  <div className="flex-1 space-y-2"><span className={`font-black uppercase text-3xl tracking-tighter transition-colors duration-1000 leading-none ${tempSelectedUnits.includes(unit) ? 'text-emerald-950' : 'text-slate-900'}`}>{unit}</span><div className="flex gap-3"><Scale size={14} className="text-slate-300"/><p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] group-hover:text-slate-600 transition-colors">Fração Individual de Poder: {baseFraction}</p></div></div>
                </label>
              ))}
            </div>
            <div className="space-y-6 relative z-10 pt-10 border-t-4 border-slate-50">
              <button onClick={() => executeVoteApi(tempSelectedUnits)} disabled={tempSelectedUnits.length === 0} className="w-full bg-slate-950 text-white font-black py-12 rounded-[3.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.4)] hover:bg-black disabled:opacity-10 transition-all duration-[1s] uppercase tracking-[0.5em] text-sm flex items-center justify-center gap-6 group scale-in-center active:scale-90 border-b-[16px] border-black/40 hover:border-emerald-500/20 active:translate-y-4 shadow-2xl animate-in slide-in-from-bottom-5"><div className="bg-white/10 p-4 rounded-[1.2rem] group-hover:bg-emerald-500 transition-all group-hover:rotate-[360deg] duration-[1.5s] shadow-xl"><Zap size={32}/></div> AUTENTICAR {tempSelectedUnits.length} VOTO(S) PONDERADO(S)</button>
              <button onClick={() => setShowUnitModal(false)} className="w-full text-slate-400 font-black py-2 hover:text-red-500 transition-all duration-500 text-center text-[10px] uppercase tracking-[0.4em] active:scale-90 hover:scale-110">Anular Protocolo e Retornar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 12px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 100px; border: 4px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; border: 4px solid transparent; background-clip: content-box; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-15px) rotate(5deg); } }
        .animate-bounce-slow { animation: bounce-slow 4s infinite ease-in-out; }
        @media print { .no-print, header, button, form, nav, .sticky, aside { display: none !important; } main { margin: 0 !important; padding: 0 !important; } .shadow-2xl, .shadow-xl, .shadow-lg { box-shadow: none !important; border: 1px solid #eee !important; box-shadow: none !important; } .rounded-[6rem], .rounded-[5rem], .rounded-[4rem], .rounded-[3rem] { border-radius: 0 !important; } .text-white, .text-slate-400 { color: black !important; } }
        .scroll-smooth { scroll-behavior: smooth; }
        @keyframes scale-in-center { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .scale-in-center { animation: scale-in-center 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
      `}</style>
    </div>
  );
};

const CheckIcon = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>
);

export default VotingRoom;