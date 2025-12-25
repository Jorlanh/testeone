
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Type, FileText, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { generateAssemblyDescription } from '../services/geminiService';
import { MockService } from '../services/mockDataService';
import { AssemblyStatus, VoteType, VotePrivacy } from '../types';

const CreateAssembly: React.FC = () => {
  const navigate = useNavigate();
  const [loadingAi, setLoadingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'AGE',
    quorumType: 'SIMPLE',
    voteType: VoteType.YES_NO_ABSTAIN,
    votePrivacy: VotePrivacy.OPEN
  });

  const handleAiGenerate = async () => {
    if (!formData.title) return alert("Digite um título para o tema primeiro.");
    
    setLoadingAi(true);
    const desc = await generateAssemblyDescription(formData.title, "Foco em transparência e regras do código civil.");
    setFormData(prev => ({ ...prev, description: desc }));
    setLoadingAi(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Default options based on type
    let options = [
        { id: '1', label: 'Sim' }, 
        { id: '2', label: 'Não' }, 
        { id: '3', label: 'Abstenção' }
    ];

    if (formData.voteType === VoteType.MULTIPLE_CHOICE) {
        options = [{ id: '1', label: 'Opção A' }, { id: '2', label: 'Opção B' }]; // Simplification for demo
    }

    await MockService.createAssembly({
        ...formData,
        status: AssemblyStatus.OPEN,
        options
    });

    setSaving(false);
    navigate('/assemblies');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Voltar
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Nova Assembleia</h1>
          <p className="text-slate-500">Configure os detalhes da votação e use a IA para redigir a pauta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Título / Tema</label>
              <div className="relative">
                <Type className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input 
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Ex: Aprovação de Reforma do Hall"
                  required
                />
              </div>
            </div>

            <div className="col-span-2">
              <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm font-medium text-slate-700">Descrição da Pauta (Edital)</label>
                 <button 
                   type="button"
                   onClick={handleAiGenerate}
                   disabled={loadingAi || !formData.title}
                   className="text-xs flex items-center bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
                 >
                   {loadingAi ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                   {loadingAi ? 'Gerando...' : 'Gerar com IA'}
                 </button>
              </div>
              <textarea 
                rows={6}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm leading-relaxed"
                placeholder="Descreva os detalhes para os votantes..."
                required
              />
              <p className="text-xs text-slate-400 mt-1">
                A IA ajuda a criar textos formais, mas você deve revisar o conteúdo antes de publicar.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Assembleia</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="AGE">AGE - Extraordinária</option>
                <option value="AGO">AGO - Ordinária</option>
                <option value="REUNIAO">Reunião Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Privacidade do Voto</label>
              <div className="relative">
                <select 
                  value={formData.votePrivacy}
                  onChange={e => setFormData({...formData, votePrivacy: e.target.value as VotePrivacy})}
                  className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white appearance-none"
                >
                  <option value={VotePrivacy.OPEN}>Voto Aberto (Público)</option>
                  <option value={VotePrivacy.SECRET}>Voto Secreto (Anônimo)</option>
                </select>
                <div className="absolute left-3 top-2.5 pointer-events-none text-slate-500">
                   {formData.votePrivacy === VotePrivacy.SECRET ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Votação</label>
              <select 
                value={formData.voteType}
                onChange={e => setFormData({...formData, voteType: e.target.value as VoteType})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value={VoteType.YES_NO_ABSTAIN}>Sim / Não / Abstenção</option>
                <option value={VoteType.MULTIPLE_CHOICE}>Múltipla Escolha</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quórum Necessário</label>
              <select 
                value={formData.quorumType}
                onChange={e => setFormData({...formData, quorumType: e.target.value as any})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              >
                <option value="SIMPLE">Maioria Simples (Presentes)</option>
                <option value="ABSOLUTE">Maioria Absoluta (Total Unidades)</option>
                <option value="QUALIFIED">Qualificado (2/3)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
              <input 
                type="datetime-local"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim</label>
              <input 
                type="datetime-local"
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
             <button 
              type="button" 
              onClick={() => navigate('/assemblies')}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm flex items-center"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {saving ? 'Criando...' : 'Criar Assembleia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssembly;
