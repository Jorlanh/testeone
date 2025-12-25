import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, MapPin, Users, Clock, Plus, CheckCircle, XCircle, AlertCircle, Wallet, Edit, Save, Trash2
} from 'lucide-react';
import { api } from '../services/api'; 
import { CommonArea, Booking, User, BookingStatus } from '../types';

interface FacilitiesProps {
  user: User | null;
}

const Facilities: React.FC<FacilitiesProps> = ({ user }) => {
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedArea, setSelectedArea] = useState<CommonArea | null>(null);
  const [activeTab, setActiveTab] = useState<'areas' | 'my-bookings' | 'manage'>('areas');
  
  const [bookingDate, setBookingDate] = useState('');
  const [bookingStart, setBookingStart] = useState('');
  const [bookingEnd, setBookingEnd] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- NOVOS ESTADOS ACRESCENTADOS PARA GESTÃO DE ÁREAS (ADM) ---
  const [isAddingArea, setIsAddingArea] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaForm, setAreaForm] = useState<Partial<CommonArea>>({
    name: '', capacity: 0, price: 0, description: '', rules: '', openTime: '08:00', closeTime: '22:00', imageUrl: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const areasData = await api.get('/facilities/areas');
      const bookingsData = await api.get('/facilities/bookings');
      setAreas(areasData);
      setBookings(bookingsData);
    } catch (error) {
      console.error("Erro ao carregar dados do banco:", error);
      setErrorMsg("Não foi possível conectar ao servidor real.");
    }
  };

  // --- NOVA FUNÇÃO ACRESCENTADA: SALVAR/EDITAR ÁREA NO BANCO ---
  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAreaId) {
        await api.patch(`/facilities/areas/${editingAreaId}`, areaForm);
        setSuccessMsg("Área atualizada com sucesso!");
      } else {
        await api.post('/facilities/areas', areaForm);
        setSuccessMsg("Nova área cadastrada no condomínio!");
      }
      setIsAddingArea(false);
      setEditingAreaId(null);
      setAreaForm({ name: '', capacity: 0, price: 0, description: '', rules: '', openTime: '08:00', closeTime: '22:00', imageUrl: '' });
      loadData();
    } catch (e) {
      setErrorMsg("Erro ao salvar área no banco de dados.");
    }
  };

  // --- NOVA FUNÇÃO ACRESCENTADA: DELETAR ÁREA ---
  const handleDeleteArea = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta área permanentemente?")) return;
    try {
      // Requisão DELETE real para o backend
      await api.delete(`/facilities/areas/${id}`);
      setSuccessMsg("Área removida.");
      loadData();
    } catch (e) {
      setErrorMsg("Erro ao excluir área.");
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea || !user) return;
    setErrorMsg('');
    setSuccessMsg('');

    // Pagamento Simulado conforme solicitado
    const pay = window.confirm(`Taxa de Reserva: R$ ${selectedArea.price.toFixed(2)}\n\nDeseja realizar o pagamento via PIX agora?`);
    if(!pay) return;

    try {
      await api.post('/facilities/bookings', {
        areaId: selectedArea.id,
        userId: user.id,
        unit: user.unit,
        date: bookingDate,
        startTime: bookingStart,
        endTime: bookingEnd
      });
      
      setSuccessMsg("Pagamento Confirmado! Reserva registrada no banco de dados.");
      loadData();
      setBookingStart('');
      setBookingEnd('');
    } catch (e: any) {
      setErrorMsg("Erro: Horário indisponível ou erro no servidor.");
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: BookingStatus) => {
    if (!user) return;
    try {
      await api.patch(`/facilities/bookings/${bookingId}/status`, status);
      loadData();
    } catch (error) {
      setErrorMsg("Erro ao atualizar status.");
    }
  };

  const myBookings = bookings.filter(b => b.userId === user?.id);
  const pendingBookings = bookings.filter(b => b.status === 'PENDING');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold">Aprovado</span>;
      case 'PENDING': return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-bold">Pendente</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-bold">Rejeitado</span>;
      case 'CANCELLED': return <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-bold">Cancelado</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Espaços e Reservas</h1>
          <p className="text-slate-500">Agende e gerencie as áreas comuns do condomínio no banco real.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
           <button onClick={() => setActiveTab('areas')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'areas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Reservar Área</button>
           <button onClick={() => setActiveTab('my-bookings')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'my-bookings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Minhas Reservas</button>
           {user?.role === 'MANAGER' && (
             <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'manage' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>Gerenciar ({pendingBookings.length})</button>
           )}
        </div>
      </div>

      {errorMsg && <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center"><XCircle className="w-5 h-5 mr-2" /> {errorMsg}</div>}
      {successMsg && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> {successMsg}</div>}

      {activeTab === 'areas' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
            {areas.map(area => (
              <div 
                key={area.id} 
                className={`bg-white rounded-xl border overflow-hidden transition-all cursor-pointer ${selectedArea?.id === area.id ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md' : 'border-slate-200 hover:shadow-lg'}`}
                onClick={() => { setSelectedArea(area); setSuccessMsg(''); setErrorMsg(''); }}
              >
                <div className="h-40 bg-slate-200 relative">
                  <img src={area.imageUrl} alt={area.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-slate-800">
                    {area.price > 0 ? `R$ ${area.price.toFixed(2)}` : 'Grátis'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900">{area.name}</h3>
                  <div className="flex items-center text-xs text-slate-500 mt-2 space-x-3">
                    <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {area.capacity} pessoas</span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {area.openTime} - {area.closeTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-6">
                {selectedArea ? (
                  <form onSubmit={handleCreateBooking}>
                    <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center"><CalendarDays className="w-5 h-5 mr-2 text-emerald-600" /> Reservar {selectedArea.name}</h3>
                    <div className="space-y-4">
                       <input type="date" required min={new Date().toISOString().split('T')[0]} value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                       <div className="grid grid-cols-2 gap-2">
                          <input type="time" required value={bookingStart} onChange={e => setBookingStart(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" />
                          <input type="time" required value={bookingEnd} onChange={e => setBookingEnd(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg" />
                       </div>
                       <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"><Wallet size={18}/> Pagar e Confirmar</button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-12 text-slate-400"><MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Selecione uma área para agendar.</p></div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* VIEW: MANAGE (SÍNDICO) - INSERIR E EDITAR ÁREAS REAIS */}
      {activeTab === 'manage' && user?.role === 'MANAGER' && (
        <div className="space-y-8">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Plus className="text-emerald-600"/> Configuração de Áreas Comuns</h2>
                <button onClick={() => { setIsAddingArea(!isAddingArea); setEditingAreaId(null); }} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">
                  {isAddingArea ? 'Cancelar' : 'Adicionar Nova Área'}
                </button>
              </div>

              {isAddingArea && (
                <form onSubmit={handleSaveArea} className="grid md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <input type="text" placeholder="Nome da Área" value={areaForm.name} onChange={e => setAreaForm({...areaForm, name: e.target.value})} className="p-2 border rounded-lg" required />
                  
                  {/* PLACEHOLDERS ATUALIZADOS: Quantidade Máxima e Valor */}
                  <input type="number" placeholder="Quantidade Máxima" value={areaForm.capacity || ''} onChange={e => setAreaForm({...areaForm, capacity: Number(e.target.value)})} className="p-2 border rounded-lg" required />
                  <input type="number" step="0.01" placeholder="Valor" value={areaForm.price || ''} onChange={e => setAreaForm({...areaForm, price: Number(e.target.value)})} className="p-2 border rounded-lg" required />
                  
                  <input type="text" placeholder="URL da Imagem" value={areaForm.imageUrl} onChange={e => setAreaForm({...areaForm, imageUrl: e.target.value})} className="p-2 border rounded-lg" />
                  <textarea placeholder="Descrição" value={areaForm.description} onChange={e => setAreaForm({...areaForm, description: e.target.value})} className="p-2 border rounded-lg md:col-span-2" />
                  
                  <button type="submit" className="bg-emerald-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 md:col-span-2 hover:bg-emerald-700 transition-all">
                    <Save size={18}/> Salvar no Banco de Dados
                  </button>
                </form>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {areas.map(area => (
                  <div key={area.id} className="p-4 border rounded-xl flex justify-between items-center bg-white hover:border-emerald-200">
                    <div>
                      <p className="font-bold text-slate-800">{area.name}</p>
                      <p className="text-xs text-emerald-600 font-bold">R$ {area.price.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setAreaForm(area); setEditingAreaId(area.id); setIsAddingArea(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16}/></button>
                      <button onClick={() => handleDeleteArea(area.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="font-bold text-lg mb-4 flex items-center text-slate-800"><AlertCircle className="w-5 h-5 mr-2 text-amber-500" /> Solicitações Pendentes</h2>
              <div className="space-y-4">
                {pendingBookings.map(booking => (
                  <div key={booking.id} className="flex flex-col md:flex-row justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                        <p className="font-bold text-slate-800">{areas.find(a => a.id === booking.areaId)?.name}</p>
                        <p className="text-sm text-slate-600"><span className="font-medium">Unidade: {booking.unit}</span> • {new Date(booking.date).toLocaleDateString()} • {booking.startTime} às {booking.endTime}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleStatusUpdate(booking.id, 'REJECTED')} className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 text-xs font-bold">Rejeitar</button>
                        <button onClick={() => handleStatusUpdate(booking.id, 'APPROVED')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-bold shadow-sm">Aprovar</button>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'my-bookings' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
           <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
               <tr><th className="px-6 py-4">Área</th><th className="px-6 py-4">Data</th><th className="px-6 py-4">Status</th></tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {myBookings.map(booking => (
                 <tr key={booking.id} className="hover:bg-slate-50">
                   <td className="px-6 py-4 font-bold text-slate-800">{areas.find(a => a.id === booking.areaId)?.name}</td>
                   <td className="px-6 py-4 text-slate-600">{new Date(booking.date).toLocaleDateString()}</td>
                   <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default Facilities;