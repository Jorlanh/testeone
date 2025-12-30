import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Send, Lock, Clock, ArrowLeft, Download, MessageSquare, 
  AlertCircle, Eye, EyeOff, Gavel, Scale, FileCheck, Shield, Video, XCircle
} from 'lucide-react';
import api from '../services/api'; 
import { analyzeSentiment } from '../services/geminiService';
import { User, VotePrivacy, AssemblyStatus } from '../types';
import { useAuth } from '../context/AuthContext'; // Importar AuthContext

const VotingRoom: React.FC = () => { // Removemos prop user, pegamos do hook
  const { user } = useAuth(); // Pegar user do contexto
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assembly, setAssembly] = useState<any>(null);
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
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadData = async () => {
    if (!id || !user) return;
    try {
      setError(null);
      const response = await api.get(`/assemblies/${id}`);
      const data = response.data;
      setAssembly(data);
      const userVote = data.votes?.find((v: any) => v.userId === user.id);
      if (userVote) {
        setHasVoted(true);
        setVoteReceipt(userVote.id || "REGISTRADO");
      }
    } catch (err) {
      setError("Assembleia não localizada.");
    }
  };

  const handleVote = async () => {
    if (!id || !selectedOption || !user) return;
    try {
      const response = await api.post(`/assemblies/${id}/vote`, {
        optionId: selectedOption,
        userId: user.id
      });
      setHasVoted(true);
      setVoteReceipt(response.data.id || "REGISTRADO");
      loadData();
    } catch (e: any) { alert("Erro ao votar: " + e.response?.data?.message || "Tente novamente."); }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMsg.trim() || !user) return;
    await api.post(`/chat/assemblies/${id}`, { 
        content: chatMsg, userId: user.id, userName: user.nome 
    });
    setChatMsg('');
    loadData();
  };

  const handleCloseAssembly = async () => {
    if (!id) return;
    if (!window.confirm("Confirmar encerramento?")) return;
    setClosing(true);
    try {
        await api.post(`/assemblies/${id}/close`, {});
        loadData();
    } catch(e: any) { alert("Erro ao encerrar"); } finally { setClosing(false); }
  };

  if (!user) return <div>Carregando usuário...</div>;
  if (error) return <div className="p-20 text-center"><XCircle className="w-16 h-16 text-red-500 mx-auto" /><h2 className="text-2xl font-bold">{error}</h2></div>;
  if (!assembly) return <div className="p-8 text-center text-slate-500"><Clock className="w-8 h-8 mx-auto mb-2 animate-spin"/> Carregando sala real...</div>;

  const isManager = user.role === 'MANAGER' || user.role === 'SINDICO';

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-slate-900 p-6 rounded-2xl text-white flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/assemblies')} className="p-2 hover:bg-slate-800 rounded-full"><ArrowLeft /></button>
          <h1 className="text-2xl font-bold">{assembly.titulo || assembly.title}</h1>
        </div>
        <button onClick={() => setShowLive(!showLive)} className="bg-red-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
            <Video /> {showLive ? 'Sair' : 'Entrar ao Vivo'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-8 rounded-3xl border shadow-sm">
             <h3 className="text-lg font-bold mb-4">Pauta</h3>
             <p className="text-slate-600 whitespace-pre-line">{assembly.description}</p>
           </div>
           {isManager && (
             <button onClick={handleCloseAssembly} disabled={closing} className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold">
               {closing ? 'Processando...' : 'Encerrar Assembleia'}
             </button>
           )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border shadow-xl">
            <h3 className="font-black mb-6 text-slate-800">Cédula Digital</h3>
            {hasVoted ? (
              <div className="text-center py-8">
                  <FileCheck className="mx-auto text-emerald-600" size={48}/>
                  <h4 className="font-bold">Voto Confirmado</h4>
                  <p className="text-xs text-slate-400 mt-2">Recibo: {voteReceipt}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(assembly.pollOptions || assembly.options)?.map((opt: any) => (
                  <button key={opt.id} onClick={() => setSelectedOption(opt.id)} className={`w-full p-4 rounded-2xl border-2 font-bold ${selectedOption === opt.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'}`}>
                    {opt.label}
                  </button>
                ))}
                <button onClick={handleVote} disabled={!selectedOption} className="w-full mt-4 bg-emerald-600 text-white py-4 rounded-2xl font-black">Confirmar Voto</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default VotingRoom;