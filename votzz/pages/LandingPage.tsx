import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Smartphone, 
  FileText, 
  Users, 
  Lock, 
  ChevronRight, 
  Star, 
  BarChart3, 
  Mail, 
  ShieldCheck, 
  TrendingUp, 
  Gift, 
  LayoutDashboard, 
  Zap, 
  Check, 
  Headphones, 
  Crown,
  Video // Novo ícone para Vídeo
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { User } from '../types';

interface LandingPageProps {
  user: User | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const benefitsList = [
    "Aplicativo Votzz (iOS/Android)",
    "Votação em Tempo Real",
    "Assembleia Digital ao Vivo",
    "Ata Automática",
    "Auditoria Criptografada",
    "Lista de Presença Digital",
    "Convocações Digitais",
    "Votos e Pautas Ilimitados",
    "Acesso Moradores e Conselho",
    "Dashboard Completo"
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* 1. Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm py-3' : 'bg-white/50 backdrop-blur-sm py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => scrollToSection('home')}>
            <Logo theme="dark" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium hover:text-emerald-600 transition-colors">Funcionalidades</button>
            <Link to="/pricing" className="text-sm font-medium hover:text-emerald-600 transition-colors">Preços</Link>
            <Link to="/affiliate/login" className="text-sm font-bold text-slate-900 flex items-center gap-1 hover:text-emerald-600 transition-colors group">
              <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              Área do Afiliado
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Ir para Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                  Entrar
                </Link>
                <Link 
                  to="/pricing" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Começar Agora
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-lg p-4 flex flex-col space-y-4 animate-in slide-in-from-top-2">
            <button onClick={() => scrollToSection('features')} className="text-left py-2 font-medium border-b border-slate-50">Funcionalidades</button>
            <Link to="/pricing" className="text-left py-2 font-medium border-b border-slate-50">Preços</Link>
            <Link to="/affiliate/login" className="text-left py-2 font-bold text-emerald-700 border-b border-slate-50 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sou Afiliado
            </Link>
            {user ? (
               <Link to="/dashboard" className="bg-emerald-600 text-white py-3 rounded-lg text-center font-bold shadow-md flex items-center justify-center gap-2">
                 <LayoutDashboard className="w-4 h-4" />
                 Acessar Dashboard
               </Link>
            ) : (
              <>
                <Link to="/login" className="text-left py-2 font-medium text-emerald-600">Entrar</Link>
                <Link 
                  to="/pricing" 
                  className="bg-emerald-600 text-white py-3 rounded-lg text-center font-medium shadow-md"
                >
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section id="home" className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        <div className="absolute top-0 right-0 -z-10 opacity-10 pointer-events-none">
          <svg width="600" height="600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#10B981" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-4.9C93.5,9.5,82.2,23.2,71.2,35.2C60.2,47.2,49.5,57.5,37.6,65.3C25.7,73.1,12.6,78.4,-1.2,80.5C-15,82.6,-28.3,81.5,-40.4,75.1C-52.5,68.7,-63.3,57,-71.6,44.1C-79.9,31.2,-85.7,17.1,-84.9,3.3C-84.1,-10.5,-76.7,-24,-67.2,-35.8C-57.7,-47.6,-46.1,-57.7,-33.5,-65.8C-20.9,-73.9,-7.3,-80,4.8,-88.3L16.9,-96.6Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-8 animate-in slide-in-from-left duration-700">
              <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                Votações Online e <span className="text-emerald-600">Assembleias ao Vivo</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                A única plataforma com transmissão de vídeo integrada, votação segura e gestão completa para condomínios modernos.
                <br />
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mt-2 inline-block">Teste grátis por 30 dias com todos os recursos.</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link 
                    to="/dashboard"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-bold text-center shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Ir para meu Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/pricing"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-bold text-center shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1"
                  >
                    Começar 30 Dias Grátis
                  </Link>
                )}
                <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2">
                  <Video className="w-5 h-5 text-emerald-600" /> Ver Demonstração
                </button>
              </div>
            </div>
            
            {/* Hero Image / Mockup */}
            <div className="lg:w-1/2 relative animate-in slide-in-from-right duration-1000">
              <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 aspect-[4/3] flex flex-col">
                  {/* Interface Mock: Assembleia ao Vivo */}
                  <div className="bg-slate-900 p-4 flex items-center justify-between border-b border-slate-700">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Ao Vivo</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4 flex-1 bg-slate-900 relative flex flex-col justify-center items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                          <Users className="text-slate-400 w-8 h-8"/>
                      </div>
                      <h3 className="text-white font-bold text-lg">Assembleia Geral Extraordinária</h3>
                      <p className="text-slate-400 text-sm">Pauta 1: Aprovação das Contas 2024</p>
                      
                      <div className="w-full max-w-xs bg-slate-800 rounded-lg p-3 mt-4 border border-slate-700">
                          <div className="flex justify-between text-xs text-slate-300 mb-1">
                              <span>Votos Favoráveis</span>
                              <span>72%</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-[72%]"></div>
                          </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
              <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm">Recursos Poderosos</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-2">Tudo o que você precisa para decidir</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Video, label: "Assembleia Ao Vivo", desc: "Transmissão de vídeo integrada na plataforma." }, // Novo
              { icon: Clock, label: "Votação em Tempo Real", desc: "Acompanhe a apuração instantânea." },
              { icon: FileText, label: "Ata Automática", desc: "Geração de documentos pós-votação." },
              { icon: Lock, label: "Auditoria Criptografada", desc: "Registro imutável e seguro." },
              { icon: Users, label: "Lista de Presença", desc: "Controle automático de quórum." },
              { icon: Mail, label: "Convocações Digitais", desc: "Envio de e-mail e notificações." },
              { icon: CheckCircle, label: "Votos Ilimitados", desc: "Sem limite de pautas ou usuários." },
              { icon: BarChart3, label: "Dashboard Completo", desc: "Métricas para o gestor." }
            ].map((feat, i) => (
              <div key={i} className="flex items-start p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <feat.icon className="h-6 w-6 text-emerald-600 mr-4 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900">{feat.label}</h4>
                  <p className="text-sm text-slate-500 mt-1">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pricing Preview */}
      <section id="pricing" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-emerald-500/20 text-emerald-400 font-bold px-4 py-1.5 rounded-full mb-4 text-sm uppercase tracking-wide">
              Plano Free: 30 dias grátis
            </div>
            <h2 className="text-3xl font-bold mb-4">Comece grátis, renove se gostar</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Todos os condomínios começam com o <strong>Plano Free (30 dias)</strong> com acesso total a todas as funcionalidades. 
              Após o período, a renovação é feita diretamente pelo painel do síndico.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* PLANO 1: ESSENCIAL */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-slate-500 transition-all flex flex-col">
              <h3 className="text-xl font-bold text-slate-200">Essencial</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-4">Até 30 Unidades</p>
              <div className="my-6">
                <span className="text-4xl font-bold text-white">R$ 190</span>
                <span className="text-slate-400 text-sm">/mês</span>
              </div>
              <p className="text-slate-400 mb-8 text-sm">Ideal para condomínios pequenos.</p>
              
              <ul className="space-y-4 mb-8 flex-1">
                 {benefitsList.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-slate-300">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" /> {item}
                    </li>
                 ))}
                 <li className="text-slate-500 text-sm italic pl-8">+ todos os outros benefícios</li>
              </ul>
              
              <Link to="/pricing" className="block w-full bg-white/10 hover:bg-white/20 text-white text-center py-3 rounded-lg font-bold transition-colors">
                Experimentar Grátis
              </Link>
            </div>

            {/* PLANO 2: BUSINESS */}
            <div className="bg-slate-800 rounded-2xl p-8 border-2 border-emerald-500 relative transform md:-translate-y-4 shadow-2xl shadow-emerald-900/20 flex flex-col">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">MAIS POPULAR</div>
              <h3 className="text-xl font-bold text-white">Business</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-4">31 a 80 Unidades</p>
              
              <div className="my-6">
                <span className="text-4xl font-bold text-white">R$ 349</span>
                <span className="text-slate-400 text-sm">/mês</span>
              </div>
              <p className="text-slate-300 mb-8 text-sm">Melhor custo-benefício.</p>

              <ul className="space-y-4 mb-8 flex-1">
                 {benefitsList.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-white">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" /> {item}
                    </li>
                 ))}
                 <li className="text-slate-400 text-sm italic pl-8">+ todos os outros benefícios</li>
              </ul>
              
              <Link to="/pricing" className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-center py-4 rounded-lg font-bold transition-colors shadow-lg">
                Experimentar Grátis
              </Link>
            </div>

            {/* PLANO 3: CUSTOM */}
            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 hover:border-slate-500 transition-all flex flex-col">
              <h3 className="text-xl font-bold text-slate-200">Custom</h3>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-4">Acima de 80 Unidades</p>
              
              <div className="my-6">
                <span className="text-3xl font-bold text-white">Sob Medida</span>
              </div>
              <p className="text-slate-400 mb-8 text-sm">Para grandes empreendimentos.</p>

              <ul className="space-y-4 mb-8 flex-1">
                 {benefitsList.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-slate-300">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" /> {item}
                    </li>
                 ))}
                 <li className="text-slate-500 text-sm italic pl-8">+ todos os outros benefícios</li>
              </ul>
              
              <Link to="/pricing" className="block w-full bg-white/10 hover:bg-white/20 text-white text-center py-3 rounded-lg font-bold transition-colors">
                Experimentar Grátis
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 6. How it Works */}
      <section id="how-it-works" className="py-20 bg-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-slate-900">Como funciona</h2>
             <p className="text-slate-600">Simples, rápido e eficiente.</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 relative">
            {[
              { num: "01", title: "Crie a conta", text: "Comece com 30 dias grátis." },
              { num: "02", title: "Cadastre", text: "Importe unidades e membros." },
              { num: "03", title: "Inicie", text: "Configure a assembleia e pautas." },
              { num: "04", title: "Votação", text: "Usuários votam pelo app/web." },
              { num: "05", title: "Renovação", text: "Escolha seu plano no painel." },
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 relative z-10 text-center hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-10 h-10 bg-emerald-600 text-white font-bold rounded-full flex items-center justify-center mx-auto mb-4 text-sm shadow-md shadow-emerald-200">
                    {step.num}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{step.title}</h4>
                  <p className="text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-200 -z-0 transform -translate-y-8"></div>
          </div>
        </div>
      </section>

      {/* 7. Social Proof */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900">O que dizem nossos clientes</h2>
              </div>
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center relative shadow-sm">
                <div className="flex justify-center text-yellow-400 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
                </div>
                <p className="text-slate-700 italic text-xl mb-6 font-medium leading-relaxed">"A plataforma revolucionou nossas assembleias. O quórum aumentou de 20% para 85% já na primeira votação online."</p>
                <div className="flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-300 mr-4 overflow-hidden border-2 border-white shadow-sm">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">Roberto Silva</p>
                      <p className="text-sm text-slate-500">Síndico Profissional</p>
                    </div>
                </div>
              </div>
            </div>
        </div>
      </section>
      
      {/* 7.5. Affiliates Section */}
      <section id="affiliates" className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
            <TrendingUp className="w-96 h-96" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-6">
                    <Gift className="w-4 h-4" /> Programa de Parceiros
                </div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Lucre indicando o <span className="text-emerald-400">Votzz</span></h2>
                <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                    Você é síndico profissional, administradora ou consultor? 
                    Ganhe <strong className="text-white">comissões recorrentes</strong> por cada condomínio ou clube que trouxer para a plataforma.
                </p>
                
                <Link 
                  to="/affiliate/register" 
                  className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-full font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105"
                >
                    Quero ser Parceiro
                </Link>
              </div>

              <div className="md:w-1/2">
                  <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 transform hover:rotate-1 transition-transform duration-500">
                      <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
                        <div>
                           <p className="text-sm text-slate-400">Ganhos este mês</p>
                           <p className="text-3xl font-bold text-white">R$ 3.450,00</p>
                        </div>
                        <div className="bg-emerald-500/20 p-2 rounded-lg">
                           <TrendingUp className="w-6 h-6 text-emerald-500" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm"><span className="text-slate-300">Condomínio Jardins</span><span className="text-emerald-400 font-bold">+ R$ 45,00/mês</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="text-slate-300">Clube Pinheiros</span><span className="text-emerald-400 font-bold">+ R$ 120,00/mês</span></div>
                      </div>
                  </div>
              </div>
            </div>
        </div>
      </section>

      {/* 8. CTA Final */}
      <section className="py-24 bg-emerald-600 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-700 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent"></div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">Pronto para modernizar sua assembleia?</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <Link to="/pricing" className="bg-white text-emerald-700 px-8 py-4 rounded-full font-bold shadow-lg hover:bg-slate-50 transition-colors">
              Ver Planos e Assinar
            </Link>
        </div>
      </section>

      {/* 9. Footer */}
      <footer id="contact" className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                  <div className="mb-4">
                      <Link to="/"><Logo theme="light" showSlogan={true} /></Link>
                  </div>
                  <p className="text-sm">Tecnologia para decisões democráticas e transparentes.</p>
              </div>
              <div>
                  <h4 className="text-white font-bold mb-4">Empresa</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link to="/pricing" className="hover:text-white">Preços</Link></li>
                    <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                    <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                  </ul>
              </div>
              <div>
                  <h4 className="text-white font-bold mb-4">Legal</h4>
                  <ul className="space-y-2 text-sm">
                    <li><Link to="/terms" className="hover:text-white">Termos de Uso</Link></li>
                    <li><Link to="/privacy" className="hover:text-white">Privacidade</Link></li>
                  </ul>
              </div>
              <div>
                  <h4 className="text-white font-bold mb-4">Contato</h4>
                  <ul className="space-y-2 text-sm">
                    <li>suporte@votzz.com.br</li>
                  </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8 text-center text-xs">
               &copy; {new Date().getFullYear()} Votzz. Todos os direitos reservados.
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;