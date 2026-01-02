// src/pages/VotingRoom.tsx - COMPLETO COM WEBSOCKET + AUDITORIA IA

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  MessageSquare, 
  FileCheck, 
  Shield, 
  Video, 
  Sparkles, 
  Send, 
  Lock, 
  Clock,
  FileText, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext';
import { AssemblyStatus } from '../types';

// Bibliotecas para WebSocket (Certifique-se de instalar: npm install sockjs-client stompjs)
import SockJS from 'sockjs-client';
import { over, Client } from 'stompjs';

let stompClient: Client | null = null;

const VotingRoom: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [assembly, setAssembly] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [showLive, setShowLive] = useState(true);
  const [voteReceipt, setVoteReceipt] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [connected, setConnected] = useState(false);
  
  // Referência para rolar o chat automaticamente
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isManager = user?.role === 'MANAGER' || user?.role === 'SINDICO' || user?.role === 'ADMIN';

  // --- 1. CONEXÃO WEBSOCKET EM TEMPO REAL ---
  useEffect(() => {
    if (id && user) {
      connectWebSocket();
    }
    return () => {
      if (stompClient) stompClient.disconnect(() => {});
    };
  }, [id, user]);

  const connectWebSocket = () => {
    const socket = new SockJS(`${api.defaults.baseURL}/ws-votzz`);
    stompClient = over(socket);
    stompClient.debug = () => {}; // Desativa logs chatos no console
    
    stompClient.connect({}, () => {
      setConnected(true);
      // Se inscreve no tópico para receber mensagens desta assembleia específica
      stompClient?.subscribe(`/topic/assembly/${id}`, (payload) => {
        const newMessage = JSON.parse(payload.body);
        setMessages(prev => [...prev, newMessage]);
        setTimeout(scrollToBottom, 100);
      });
    }, (err) => {
      console.error("Erro na conexão WebSocket:", err);
      setConnected(false);
    });
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- 2. CARGA INICIAL DE DADOS ---
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id || !user) return;
    try {
      const response = await api.get(`/assemblies/${id}`);
      setAssembly(response.data);
      
      const userVote = response.data.votes?.find((v: any) => v.userId === user.id);
      if (userVote) { 
          setHasVoted(true); 
          setVoteReceipt(userVote.id); 
      }

      // Carregar histórico do chat via API comum ao entrar
      const chatResponse = await api.get(`/chat/assemblies/${id}`);
      setMessages(chatResponse.data || []);
      setTimeout(scrollToBottom, 500);
    } catch (err) { 
        console.error("Erro ao carregar assembleia."); 
    }
  };

  // --- 3. AÇÕES (VOTO, CHAT, IA) ---

  const handleVote = async () => {
    if (!id || !selectedOption || !user) return;
    try {
      const response = await api.post(`/assemblies/${id}/vote`, { 
        optionId: selectedOption, 
        userId: user.id 
      });
      setHasVoted(true);
      setVoteReceipt(response.data.id);
      loadData();
    } catch (e) { 
        alert("Falha ao registrar voto. Verifique sua conexão."); 
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim() || !user || !connected) return;

    // Constrói o objeto igual ao ChatMessageDTO do seu ChatController.java
    const chatDTO = {
      senderName: user.nome || user.name,
      content: chatMsg,
      userId: user.id,
      tenantId: user.tenantId,
      assemblyId: id
    };

    // Envia via WebSocket (Protocolo STOMP)
    stompClient?.send(`/app/chat/${id}/send`, {}, JSON.stringify(chatDTO));
    setChatMsg('');
  };

  const handleSummarize = async () => {
      setSummarizing(true);
      try {
          // Chamada para o ChatService.java que gera o PDF via Gemini
          window.open(`${api.defaults.baseURL}/chat/assemblies/${id}/resumo-pdf`, '_blank');
          alert("A IA Gemini está analisando o chat. O PDF será baixado em instantes.");
      } catch (e) {
          alert("Erro ao processar resumo.");
      } finally { 
          setSummarizing(false); 
      }
  };

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : "";
  };

  if (!assembly) return (
    <div className="p-20 text-center animate-pulse">
      <Clock className="w-12 h-12 mx-auto text-slate-300 mb-4 animate-spin"/>
      <p className="font-black text-slate-300 uppercase tracking-tighter">Sincronizando com a sala virtual...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 p-4 md:p-6">
      {/* HEADER DINÂMICO */}
      <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/assemblies')} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><ArrowLeft size={20}/></button>
          <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none">{assembly.titulo || assembly.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                  <span className={`w-2 h-2 rounded-full animate-ping ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                    {connected ? 'Conexão Digital Ativa' : 'Reconectando...'}
                  </span>
              </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setShowLive(!showLive)} className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all ${showLive ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                <Video size={18}/> {showLive ? 'Live On' : 'Live Off'}
            </button>
            {isManager && (
                <button 
                  onClick={handleSummarize} 
                  className="p-3 bg-emerald-600 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20" 
                  title="Auditoria e Resumo IA"
                >
                    <Shield size={20}/>
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LADO ESQUERDO: LIVE E PAUTA */}
        <div className="lg:col-span-8 space-y-6">
          {showLive && assembly.youtubeLiveUrl ? (
              <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-900">
                <iframe 
                  width="100%" height="100%" 
                  src={`${getYoutubeEmbedUrl(assembly.youtubeLiveUrl)}?autoplay=1&mute=0`} 
                  title="Transmissão Votzz" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
          ) : (
            <div className="aspect-video bg-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                <Video size={48} className="mb-4 opacity-20"/>
                <p className="font-bold">Aguardando início da transmissão.</p>
            </div>
          )}

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-emerald-600 font-black uppercase text-xs tracking-widest">
                <FileText size={16}/> Pauta e Itens de Pauta
            </div>
            <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">{assembly.description}</p>
          </div>
        </div>

        {/* LADO DIREITO: VOTOS E CHAT */}
        <div className="lg:col-span-4 space-y-6">
          {/* CÉDULA */}
          <div className="bg-white p-8 rounded-[2rem] border-2 border-emerald-50 shadow-xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                 <h3 className="font-black text-slate-900 text-xl tracking-tighter">Cédula de Voto</h3>
                 <Lock size={18} className="text-slate-200"/>
             </div>
             
             {hasVoted ? (
                 <div className="text-center bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                        <FileCheck size={32}/>
                    </div>
                    <h4 className="font-black text-emerald-900 text-lg leading-tight">Voto Confirmado</h4>
                    <p className="text-[10px] text-emerald-600 font-bold mt-4 uppercase tracking-widest bg-emerald-100 py-1 rounded-full px-4">
                      ID RECIBO: {voteReceipt?.substring(0, 8).toUpperCase() || 'OK'}
                    </p>
                 </div>
             ) : (
                <div className="space-y-3">
                   {(assembly.pollOptions || assembly.options)?.map((opt: any) => (
                      <button 
                        key={opt.id} 
                        onClick={() => setSelectedOption(opt.id)} 
                        className={`w-full p-5 rounded-2xl border-2 transition-all font-black text-lg text-left flex justify-between items-center ${selectedOption === opt.id ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        {opt.label}
                        {selectedOption === opt.id && <CheckCircle size={20}/>}
                      </button>
                   ))}
                   <button 
                    onClick={handleVote} 
                    disabled={!selectedOption || assembly.status === 'CLOSED'} 
                    className="w-full mt-6 bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-20"
                   >
                     Confirmar Voto Digital
                   </button>
                </div>
             )}
          </div>

          {/* CHAT INTEGRADO */}
          <div className="bg-white rounded-[2rem] border shadow-lg overflow-hidden flex flex-col h-[550px]">
            <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
                <span className="font-black text-slate-700 flex items-center gap-2"><MessageSquare size={18}/> Chat ao Vivo</span>
                <button 
                    onClick={handleSummarize} 
                    disabled={summarizing || messages.length < 3}
                    className="p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200" 
                    title="Resumo IA Gemini"
                >
                    <Sparkles size={16} className={summarizing ? 'animate-spin' : ''}/>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30">
                {messages.map((m, idx) => (
                    <div key={idx} className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase ml-2">{m.senderName || m.userName}</p>
                        <p className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 shadow-sm">{m.content}</p>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} className="p-4 bg-white border-t flex gap-2">
                <input 
                    value={chatMsg} 
                    onChange={e => setChatMsg(e.target.value)} 
                    placeholder="Digite sua mensagem..." 
                    className="flex-1 bg-slate-50 border-none rounded-2xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500" 
                />
                <button 
                  type="submit" 
                  disabled={!chatMsg.trim() || !connected}
                  className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 shadow-lg disabled:opacity-50"
                >
                  <Send size={20}/>
                </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingRoom;