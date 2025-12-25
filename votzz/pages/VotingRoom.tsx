import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Send, Lock, Clock, ArrowLeft, Download, MessageSquare, 
  AlertCircle, Eye, EyeOff, Gavel, Scale, FileCheck, Shield, Video, XCircle
} from 'lucide-react';
import { api } from '../services/api'; 
import { analyzeSentiment } from '../services/geminiService';
import { Assembly, User, VotePrivacy, AssemblyStatus } from '../types';

const VotingRoom: React.FC<{ user: User }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assembly, setAssembly] = useState<any>(null); // Alterado para any para aceitar a estrutura real do banco
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [chatMsg, setChatMsg] = useState('');
  const [voteReceipt, setVoteReceipt] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [showLive, setShowLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'VOTE' | 'MANAGE'>('VOTE');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (id) loadData();
    // ACRESCENTADO: Polling para atualizar chat e votos automaticamente a cada 5 segundos
    const interval = setInterval(() => {
        if (id) loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setError(null);
      const data = await api.get(`/assemblies/${id}`);
      if (data) {
        setAssembly(data);
        
        // CORREÇÃO: Verifica se o usuário já votou usando a tabela pollVotes do banco real
        const userVote = data.pollVotes?.find((v: any) => v.userId === user.id);
        if (userVote) {
          setHasVoted(true);
          setVoteReceipt(userVote.id || "REGISTRADO");
        }
      } else {
        setError("Assembleia não localizada.");
      }
    } catch (error) {
      console.error("Erro ao carregar assembleia real:", error);
      setError("Não foi possível conectar à sala. Verifique se o ID está correto no banco.");
    }
  };

  const handleVote = async () => {
    if (!id || !selectedOption) return;
    try {
      // ACRESCENTADO: Lógica para POST real na tabela poll_votes
      const vote = await api.post(`/assemblies/${id}/vote`, {
        optionId: selectedOption,
        userId: user.id
      });
      setHasVoted(true);
      setVoteReceipt(vote.id || "REGISTRADO");
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAiInteraction = async (msg: string) => {
    try {
      const roleToSimulate = user.role === 'MANAGER' ? 'Morador' : 'Síndico';
      await api.post('/chat/gemini-simulate', { message: msg, role: roleToSimulate });
      loadData();
    } catch (error) {
      console.error("Erro na simulação da IA:", error);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim() || !id) return;
    
    // ACRESCENTADO: Envio real para a tabela chat_message
    await api.post(`/chat/assemblies/${id}`, { 
        content: chatMsg, 
        userId: user.id,
        userName: user.nome 
    });
    
    handleAiInteraction(chatMsg);
    setChatMsg('');
    loadData();
  };

  const handleCloseAssembly = async () => {
    if (!id || !assembly) return;
    if (!window.confirm("ATENÇÃO: Isso encerrará a votação definitivamente e gerará a Ata. Confirmar?")) return;
    
    setClosing(true);
    try {
        // CORREÇÃO: Endpoint real para mudar status no banco e gerar ata
        await api.post(`/assemblies/${id}/close`, {});
        alert("Assembleia encerrada com sucesso. Ata gerada.");
        loadData();
    } catch(e: any) {
        alert(e.message);
    } finally {
        setClosing(false);
    }
  };

  const runAnalysis = async () => {
    // CORREÇÃO: Lendo mensagens da tabela real 'messages' retornada pelo banco
    if (!assembly || !assembly.messages) return;
    const messages = assembly.messages.map((c: any) => `${c.userName}: ${c.content}`);
    setAiAnalysis("Analisando discussão...");
    const result = await analyzeSentiment(messages);
    setAiAnalysis(result);
  }

  const downloadDossier = () => {
      const baseUrl = 'http://localhost:8080/api';
      window.open(`${baseUrl}/assemblies/${id}/dossier`, '_blank');
  };

  if (error) return (
    <div className="p-20 text-center space-y-4">
        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800">{error}</h2>
        <button onClick={() => navigate('/assemblies')} className="text-emerald-600 font-bold hover:underline">Voltar para a lista</button>
    </div>
  );

  if (!assembly) return <div className="p-8 text-center text-slate-500"><Clock className="w-8 h-8 mx-auto mb-2 animate-spin"/> Carregando sala real...</div>;

  const isSecret = assembly.votePrivacy === VotePrivacy.SECRET;
  const isManager = user.role === 'MANAGER';
  const isClosed = assembly.status === 'ENCERRADA' || assembly.status === AssemblyStatus.CLOSED;

  const totalVotes = assembly.pollVotes?.length || 0;
  const totalFraction = assembly.pollVotes?.reduce((acc: number, v: any) => acc + (v.fraction || 0), 0) || 0;

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-slate-900 p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/assemblies')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{assembly.titulo}</h1>
            <p className="text-emerald-400 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Sessão em Tempo Real
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowLive(!showLive)}
            className={`${showLive ? 'bg-slate-700' : 'bg-red-600 animate-pulse'} hover:opacity-90 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all`}
          >
            <Video className="w-5 h-5" />
            {showLive ? 'Sair da Reunião' : 'Entrar na Assembleia ao Vivo'}
          </button>
          
          {isManager && (
            <div className="flex bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setActiveTab('VOTE')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'VOTE' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Votação</button>
                <button onClick={() => setActiveTab('MANAGE')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'MANAGE' ? 'bg-white text-slate-900' : 'text-slate-400'}`}>Gestão</button>
            </div>
          )}
        </div>
      </div>

      {showLive && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="lg:col-span-2 aspect-video bg-black rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl">
             <iframe 
               src={assembly.linkVideoConferencia || `https://meet.jit.si/votzz-${id}`} 
               className="w-full h-full"
               allow="camera; microphone; fullscreen; display-capture"
             ></iframe>
          </div>

          <div className="bg-white rounded-3xl border shadow-sm flex flex-col h-[500px] lg:h-auto">
            <div className="p-4 border-b font-bold flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-400" />
                Debate da Unidade
              </div>
              <button onClick={runAnalysis} className="text-xs text-purple-600 font-bold hover:underline">Resumir IA</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {aiAnalysis && (
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-xs text-purple-800 animate-in zoom-in-95">
                    <strong>Resumo IA:</strong> {aiAnalysis}
                  </div>
                )}
                {/* CORREÇÃO: Lendo 'messages' que é o campo real retornado pelo seu Controller */}
                {assembly.messages?.map((msg: any) => (
                   <div key={msg.id} className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      msg.userId === user.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-800 border'
                    }`}>
                      <span className="block text-[10px] font-black uppercase opacity-70 mb-1">{msg.userName}</span>
                      {msg.content}
                    </div>
                   </div>
                ))}
            </div>

            <form onSubmit={handleSendChat} className="p-4 border-t bg-white rounded-b-3xl flex gap-2">
              <input 
                type="text" 
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                placeholder="Mensagem para o condomínio..." 
                className="flex-1 bg-slate-100 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
              />
              <button className="bg-emerald-600 p-2 rounded-xl text-white hover:bg-emerald-700 transition-colors">
                <Send size={20}/>
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="text-emerald-600" /> Documentos da Pauta (PDF)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assembly.documents?.map((doc: string, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border group hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{doc}</span>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {activeTab === 'MANAGE' && isManager ? (
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase">Quórum Atual</p>
                    <p className="text-3xl font-black mt-2">{totalVotes}</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase">Representação %</p>
                    <p className="text-3xl font-black mt-2">{(totalFraction * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase">Status Legal</p>
                    <p className="text-xl font-bold mt-2 text-emerald-400">Auditável</p>
                  </div>
               </div>

               {!isClosed && (
                 <button onClick={handleCloseAssembly} disabled={closing} className="w-full bg-red-600 py-4 rounded-2xl font-black text-lg hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3">
                   {closing ? 'Processando Ata...' : <><Lock /> Encerrar e Lavrar Ata Eletrônica</>}
                 </button>
               )}
               
               {isClosed && (
                 <div className="p-6 bg-white text-slate-900 rounded-2xl space-y-4">
                    <h4 className="font-black flex items-center gap-2"><Shield className="text-emerald-600" /> Ata Gerada via Blockchain</h4>
                    <pre className="text-xs bg-slate-50 p-4 rounded-lg overflow-x-auto font-mono">{assembly.minutes?.content || "ATA PROCESSADA NO BANCO"}</pre>
                    <div className="flex gap-2">
                       <button onClick={downloadDossier} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                         <Download size={18} /> Baixar PDF
                       </button>
                    </div>
                 </div>
               )}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border shadow-sm">
               <h3 className="text-lg font-bold text-slate-800 mb-6">Pauta e Deliberação</h3>
               <p className="text-slate-600 leading-relaxed whitespace-pre-line">{assembly.description}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border shadow-xl sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800">Cédula Digital</h3>
              {isSecret ? <EyeOff size={18} className="text-purple-500" /> : <Eye size={18} className="text-blue-500" />}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border mb-6">
               <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Sua Identidade Digital</p>
               <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-700">Unidade {user.unit}</span>
                  <span className="text-emerald-600 font-black">{(user.fraction ? user.fraction * 100 : 0).toFixed(4)}%</span>
               </div>
            </div>

            {hasVoted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                   <FileCheck size={32} />
                </div>
                <h4 className="font-black text-slate-800 text-xl">Voto Confirmado</h4>
                <div className="text-[10px] font-mono bg-slate-50 p-2 rounded border break-all">Hash: {voteReceipt}</div>
              </div>
            ) : isClosed ? (
              <div className="text-center py-10 text-slate-400 font-bold">Votação encerrada pelo administrador.</div>
            ) : (
              <div className="space-y-3">
                {/* CORREÇÃO: Lendo 'pollOptions' que é o campo real retornado pelo banco */}
                {assembly.pollOptions?.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOption(opt.id)}
                    className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all font-bold ${
                      selectedOption === opt.id 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900' 
                      : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  onClick={handleVote}
                  disabled={!selectedOption}
                  className="w-full mt-4 bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:bg-slate-200 disabled:shadow-none transition-all"
                >
                  Confirmar Voto Seguro
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VotingRoom;