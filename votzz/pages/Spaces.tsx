import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, MapPin, Users, Clock, Plus, CheckCircle, XCircle, AlertCircle, Wallet, Edit, Save, Trash2, Search, User as UserIcon, Upload, ImageIcon, Shield, ArrowRight, FileText
} from 'lucide-react';
import api from '../services/api'; 
import { CommonArea, Booking, User, BookingStatus } from '../types';
import { useAuth } from '../context/AuthContext';

interface SpacesProps {
  user: User | null;
}

const Spaces: React.FC<SpacesProps> = () => {
  const { user } = useAuth();
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]); 
  const [selectedArea, setSelectedArea] = useState<CommonArea | null>(null);
  const [activeTab, setActiveTab] = useState<'areas' | 'my-bookings' | 'manage'>('areas');
  
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

  // Estados de Upload de Comprovante
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);

  // --- GESTÃO DE ÁREAS (ADM) ---
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaForm, setAreaForm] = useState<Partial<CommonArea>>({
    name: '', capacity: 0, price: 0, description: '', rules: '', openTime: '08:00', closeTime: '22:00', imageUrl: ''
  });
  const [isUploading, setIsUploading] = useState(false);

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
    }
  }, [user, selectedArea]);

  const loadData = async () => {
    try {
      const [areasData, bookingsData] = await Promise.all([
        api.get('/facilities/areas'),
        api.get('/facilities/bookings') 
      ]);
      setAreas(areasData.data || areasData);
      setBookings(bookingsData.data || bookingsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setErrorMsg("Não foi possível conectar ao servidor.");
    }
  };

  // --- LÓGICA DE VALIDAÇÃO (BLOQUEIO DE DATA) ---
  const isDateBlocked = (areaId: string, date: string) => {
    return bookings.some(b => 
      b.areaId === areaId && 
      b.date === date && 
      b.status !== 'CANCELLED' && 
      b.status !== 'REJECTED'
    );
  };

  const validateBooking = () => {
    const { date, startTime, endTime } = bookingForm;
    const today = new Date().toISOString().split('T')[0];

    if (date < today) return "A reserva deve ser feita para uma data futura.";
    if (startTime < "08:00" || endTime > "22:00") return "O horário permitido é das 08:00 às 22:00.";
    if (startTime >= endTime) return "O horário de início deve ser anterior ao fim.";
    
    // VERIFICA SE JÁ EXISTE RESERVA NA DATA ESCOLHIDA
    if (selectedArea && isDateBlocked(selectedArea.id, date)) {
      return "DATA INDISPONÍVEL: Já existe uma reserva (confirmada ou em análise) para este dia.";
    }

    return null;
  };

  // --- ACTIONS ---

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

  // Função para upload de COMPROVANTE DE PAGAMENTO
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>, bookingId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBookingId(bookingId);
    const formData = new FormData();
    formData.append('file', file);

    try {
        await api.post(`/facilities/bookings/${bookingId}/receipt`, formData);
        alert("Comprovante enviado! Sua reserva ficará retida para análise do síndico.");
        loadData(); // Recarrega para atualizar status
    } catch (error: any) {
        alert("Erro ao enviar comprovante: " + (error.response?.data?.message || error.message));
    } finally {
        setUploadingBookingId(null);
    }
  };

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
    const confirmMsg = `Confirmar Reserva: ${selectedArea.name}\nValor: R$ ${price.toFixed(2)}\nData: ${new Date(bookingForm.date).toLocaleDateString()}\n\nAo confirmar, a data ficará bloqueada. Você terá 10 minutos para pagar o Pix ou enviar o comprovante.`;
    
    if(!window.confirm(confirmMsg)) return;

    try {
      await api.post('/facilities/bookings', {
        areaId: selectedArea.id,
        userId: user.id,
        ...bookingForm,
        billingType: 'PIX' 
      });
      
      setSuccessMsg("Reserva iniciada! Vá em 'Minhas Reservas' para pagar ou enviar o comprovante.");
      loadData(); 
      setSelectedArea(null);
      setActiveTab('my-bookings');
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || e.response?.data || "Erro ao processar reserva. Tente novamente.");
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

  // --- HELPERS ---
  const myBookings = bookings.filter(b => b.userId === user?.id);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': 
      case 'CONFIRMED': return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold border border-emerald-200 flex items-center gap-1"><CheckCircle size={12}/> Confirmado</span>;
      
      case 'PENDING': return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-bold border border-amber-200 flex items-center gap-1"><Clock size={12}/> Aguardando Pagto</span>;
      
      case 'UNDER_ANALYSIS': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold border border-blue-200 flex items-center gap-1"><FileText size={12}/> Em Análise</span>;
      
      case 'REJECTED': 
      case 'CANCELLED': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold border border-red-200 flex items-center gap-1"><XCircle size={12}/> Cancelado</span>;
      
      default: return <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Espaços e Reservas</h1>
          <p className="text-slate-500">Agende áreas comuns com segurança.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
           <button onClick={() => setActiveTab('areas')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'areas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Reservar</button>
           <button onClick={() => setActiveTab('my-bookings')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'my-bookings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Minhas Reservas</button>
           {user?.role === 'MANAGER' || user?.role === 'SINDICO' ? (
             <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'manage' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Gestão (Síndico)</button>
           ) : null}
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center border border-red-200"><XCircle className="w-5 h-5 mr-2" /> {errorMsg}</div>}
      {successMsg && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center border border-emerald-200"><CheckCircle className="w-5 h-5 mr-2" /> {successMsg}</div>}

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
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800">
                          <p className="font-bold mb-1">Regras Importantes:</p>
                          <ul className="list-disc list-inside space-y-1">
                              <li>Horário permitido: 08h às 22h.</li>
                              <li>Pagamento via Asaas (Pix/Boleto).</li>
                              <li>Se não pagar em 10min, envie o comprovante para segurar a vaga.</li>
                          </ul>
                        </div>

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

                        <button type="submit" className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 mt-4">
                            <Wallet size={18}/> Reservar e Pagar
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
           
           {/* SEÇÃO 1: CRIAR/EDITAR ÁREAS */}
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
                  
                  {/* SELEÇÃO DE IMAGEM (UPLOAD OU LINK) */}
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

              {/* LISTAGEM DAS ÁREAS NA ABA DE GESTÃO - AQUI ESTAVA O PROBLEMA */}
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

           {/* SEÇÃO 2: RELATÓRIO DE RESERVAS */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><CalendarDays className="text-blue-600"/> Todas as Reservas</h3>
                   <div className="text-xs text-slate-500 font-medium bg-white px-3 py-1 rounded-full border">
                       Total: {bookings.length}
                   </div>
               </div>
               <table className="w-full text-sm text-left">
                 <thead className="bg-white text-slate-500 border-b border-slate-200 uppercase text-xs font-bold">
                   <tr>
                       <th className="px-6 py-4">Morador</th>
                       <th className="px-6 py-4">Local</th>
                       <th className="px-6 py-4">Data/Hora</th>
                       <th className="px-6 py-4">Comprovante</th>
                       <th className="px-6 py-4">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {bookings.map(booking => {
                       const areaName = areas.find(a => a.id === booking.areaId)?.name || 'Área Excluída';
                       const moradorNome = (booking as any).nome || 'Morador'; 
                       const moradorUnidade = (booking as any).unit || (booking as any).unidade || '?';

                       return (
                         <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                               <p className="font-bold text-slate-800">{moradorNome}</p>
                               <p className="text-xs text-slate-500">Unidade: {moradorUnidade}</p>
                           </td>
                           <td className="px-6 py-4 text-slate-700">{areaName}</td>
                           <td className="px-6 py-4">
                               <p className="font-medium text-slate-800">{new Date(booking.date).toLocaleDateString()}</p>
                               <p className="text-xs text-slate-500">{booking.startTime} - {booking.endTime}</p>
                           </td>
                           <td className="px-6 py-4">
                                {(booking as any).receiptUrl ? (
                                    <a href={(booking as any).receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1"><FileText size={12}/> Ver</a>
                                ) : <span className="text-slate-300 text-xs">-</span>}
                           </td>
                           <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                         </tr>
                       )
                   })}
                   {bookings.length === 0 && (
                       <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma reserva registrada.</td></tr>
                   )}
                 </tbody>
               </table>
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
                           {getStatusBadge(booking.status)}
                           
                           {/* AÇÃO: ENVIAR COMPROVANTE SE ESTIVER PENDENTE */}
                           {booking.status === 'PENDING' && (
                               <div className="relative group">
                                   <input 
                                       type="file" 
                                       id={`upload-${booking.id}`} 
                                       className="hidden" 
                                       onChange={(e) => handleReceiptUpload(e, booking.id)}
                                       disabled={uploadingBookingId === booking.id}
                                   />
                                   <label htmlFor={`upload-${booking.id}`} className={`cursor-pointer text-xs font-bold px-3 py-1.5 rounded border transition-all flex items-center gap-1 ${uploadingBookingId === booking.id ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'}`}>
                                       {uploadingBookingId === booking.id ? 'Enviando...' : <><Upload size={12}/> Enviar Comprovante</>}
                                   </label>
                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded hidden group-hover:block text-center">
                                       Envie o comprovante para garantir a reserva enquanto o Pix compensa.
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