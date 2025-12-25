
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Vote, 
  FileText, 
  LogOut, 
  Menu, 
  User as UserIcon,
  Landmark,
  CalendarDays
} from 'lucide-react';
import { User } from '../types';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Landmark, label: 'Governança', path: '/governance' },
    { icon: Vote, label: 'Assembleias', path: '/assemblies' },
    { icon: CalendarDays, label: 'Espaços & Reservas', path: '/facilities' },
    { icon: FileText, label: 'Relatórios & Auditoria', path: '/reports' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-700/50">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <Logo theme="light" />
          </Link>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path) 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-slate-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.role === 'MANAGER' ? 'Síndico' : 'Morador'} - {user?.unit}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-2 text-slate-400 hover:text-white w-full px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header (Mobile) */}
        <header className="bg-white shadow-sm border-b border-slate-200 md:hidden p-4 flex justify-between items-center z-10">
          <Link to="/">
            <Logo theme="dark" />
          </Link>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-1 rounded-md hover:bg-slate-100">
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
