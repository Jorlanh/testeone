import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Vote, 
  CalendarDays, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  Settings,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth(); 
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // DEBUG: Para conferir se os dados estão chegando
  useEffect(() => {
    if (user) {
        console.log("DEBUG LAYOUT - Usuário:", user);
    }
  }, [user]);

  const handleLogout = () => {
    if (signOut) signOut();
    // [CORREÇÃO] Redireciona para a Landing Page (/) em vez do Login
    navigate('/'); 
  };

  const isActive = (path: string) => location.pathname === path;

  // --- LÓGICA DE EXIBIÇÃO DO USUÁRIO ---
  const userName = user?.nome || user?.name || user?.email?.split('@')[0] || 'Usuário';
  
  const getUserSubtitle = () => {
    if (!user) return 'Visitante';

    // Prioridade para cargos de gestão
    if (user.role === 'SINDICO') return 'Síndico Profissional';
    if (user.role === 'ADM_CONDO' || user.role === 'MANAGER') return 'Administrador';
    
    // Lógica para Morador
    const bloco = user.bloco || user.block || '';
    const unidade = user.unidade || user.unit || '';

    // Formato: "B [bloco] e Und [unidade]"
    if (bloco && unidade) {
        return `B ${bloco} e Und ${unidade}`;
    }
    
    if (unidade && !bloco) {
        return `Und ${unidade}`;
    }

    if (user.role === 'MORADOR') return 'Morador';
    
    return 'Visitante';
  };

  const userSubtitle = getUserSubtitle();

  const menuItems = [
    { 
      label: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard,
      allowed: ['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER', 'AFILIADO']
    },
    { 
      label: 'Governança', 
      path: '/governance', 
      icon: Vote,
      allowed: ['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER']
    },
    { 
      label: 'Assembleias', 
      path: '/assemblies', 
      icon: FileText, 
      allowed: ['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER']
    },
    { 
      label: 'Espaços & Reservas', 
      path: '/spaces', 
      icon: CalendarDays,
      allowed: ['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER']
    },
    { 
      label: 'Chamados & Ajuda', 
      path: '/tickets', 
      icon: MessageSquare,
      allowed: ['MORADOR', 'SINDICO', 'ADM_CONDO', 'MANAGER']
    },
    { 
      label: 'Relatórios & Auditoria', 
      path: '/reports', 
      icon: ShieldAlert,
      allowed: ['SINDICO', 'ADM_CONDO', 'MANAGER']
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 fixed h-full z-20 shadow-xl border-r border-slate-800">
        <div className="p-6 flex items-center justify-center border-b border-slate-800">
           <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
              <Logo theme="dark" />
           </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            if (user && !item.allowed.includes(user.role)) return null;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive(item.path) 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 font-bold translate-x-1' 
                    : 'hover:bg-slate-800 hover:text-white hover:translate-x-1'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* SEÇÃO DO PERFIL */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 font-bold text-lg border border-emerald-500/30 shrink-0 shadow-inner">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate" title={userName}>
                {userName.split(' ')[0]}
              </p>
              <p className="text-xs text-emerald-400 truncate font-medium" title={userSubtitle}>
                {userSubtitle}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Link 
              to="/profile" 
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-xs py-2 rounded-lg transition-colors text-slate-300 hover:text-white border border-slate-700"
            >
              <Settings size={14} /> Perfil
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs py-2 rounded-lg transition-colors border border-red-900/30"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-30 p-4 flex justify-between items-center shadow-md border-b border-slate-800">
        <Logo theme="dark" size="sm" />
        <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* --- MOBILE MENU --- */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900 z-20 pt-20 px-4 animate-in slide-in-from-top-10 duration-200">
          <nav className="space-y-3">
            {menuItems.map(item => {
               if (user && !item.allowed.includes(user.role)) return null;
               return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                      isActive(item.path) 
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' 
                      : 'text-slate-300 bg-slate-800 border-slate-700'
                  }`}
                >
                  <item.icon size={20} /> <span className="font-bold">{item.label}</span>
                </Link>
               )
            })}
            
            <div className="border-t border-slate-700 pt-6 mt-6">
              <div className="flex items-center gap-3 mb-6 px-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-500 font-bold border border-emerald-500/30">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{userName}</p>
                  <p className="text-xs text-emerald-400">{userSubtitle}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-2 p-3 rounded-xl text-slate-300 bg-slate-800 border border-slate-700 font-medium">
                    <Settings size={18} /> Dados
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 p-3 rounded-xl text-red-400 bg-red-900/20 border border-red-900/50 font-medium">
                    <LogOut size={18} /> Sair
                  </button>
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 mt-16 md:mt-0 overflow-x-hidden w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;