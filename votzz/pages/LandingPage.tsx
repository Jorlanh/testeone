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
  Video,
  ArrowRight,
  MousePointerClick,
  Percent,
  CircleDollarSign,
  Handshake
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { User } from '../types';

/**
 * LANDING PAGE COMPLETA - VOTZZ
 * Esta página contém o fluxo principal de vendas, apresentação de recursos
 * e o novo Programa de Afiliados com comissão de 15% recorrente.
 */

interface LandingPageProps {
  user: User | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Efeito para monitorar o scroll e aplicar sombra no header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * scrollToSection - Realiza a rolagem suave para IDs específicos
   * @param id Identificador da seção (ex: 'affiliates')
   */
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  // Lista de benefícios exibida nos cards de planos
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

  // Dados para a seção de FAQ de Afiliados
  const affiliateFaq = [
    {
      q: "Como recebo minha comissão?",
      a: "O pagamento é feito via PIX todo dia 10 de cada mês, referente aos clientes ativos que pagaram a mensalidade no mês anterior."
    },
    {
      q: "A comissão é vitalícia?",
      a: "Sim! Enquanto o condomínio indicado por você continuar utilizando e pagando a plataforma, você recebe seus 15% mensalmente."
    },
    {
      q: "Preciso ser síndico para ser afiliado?",
      a: "Não. O programa é aberto para síndicos profissionais, administradoras, consultores de condomínio ou qualquer entusiasta da tecnologia."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased">
      
      {/* ============================================================
          1. HEADER & NAVIGATION
          ============================================================ */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-md py-3' : 'bg-white/50 backdrop-blur-sm py-5'
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
            
            {/* Botão de redirecionamento interno para seção de afiliados */}
            <button 
              onClick={() => scrollToSection('affiliates')} 
              className="text-sm font-bold text-slate-900 flex items-center gap-1 hover:text-emerald-600 transition-colors group outline-none"
            >
              <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              Área do Afiliado
            </button>
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
            
            {/* Botão Afiliados Mobile */}
            <button 
              onClick={() => scrollToSection('affiliates')} 
              className="text-left py-2 font-bold text-emerald-700 border-b border-slate-50 flex items-center gap-2 outline-none"
            >
              <TrendingUp className="w-4 h-4" />
              Área do Afiliado
            </button>

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

      {/* ============================================================
          2. HERO SECTION
          ============================================================ */}
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
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mt-2 inline-block italic">Teste grátis por 30 dias com todos os recursos liberados.</span>
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
            
            <div className="lg:w-1/2 relative animate-in slide-in-from-right duration-1000">
              <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 aspect-[4/3] flex flex-col">
                  {/* Interface Mockup */}
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
                      <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-4 shadow-inner">
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
                              <div className="h-full bg-emerald-500 w-[72%] shadow-[0_0_10px_#10b981]"></div>
                          </div>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. FEATURES GRID
          ============================================================ */}
      <section id="features" className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center lg:text-left">
              <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm block mb-2">Recursos Poderosos</span>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Tudo o que você precisa para decidir</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Video, label: "Assembleia Ao Vivo", desc: "Transmissão de vídeo integrada diretamente na plataforma." },
              { icon: Clock, label: "Votação em Tempo Real", desc: "Acompanhe a apuração instantânea conforme os votos chegam." },
              { icon: FileText, label: "Ata Automática", desc: "Geração imediata de documentos após o encerramento." },
              { icon: Lock, label: "Auditoria Criptografada", desc: "Registro imutável e seguro de cada ação realizada." },
              { icon: Users, label: "Lista de Presença", desc: "Controle automático de quórum com log de entrada." },
              { icon: Mail, label: "Convocações Digitais", desc: "Envio em massa por e-mail e notificações push." },
              { icon: CheckCircle, label: "Votos Ilimitados", desc: "Sem letras miúdas: crie quantas pautas desejar." },
              { icon: BarChart3, label: "Dashboard Completo", desc: "Métricas estratégicas para o síndico e conselho." }
            ].map((feat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all border border-slate-100 group">
                <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                   <feat.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{feat.label}</h4>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          5. PRICING SECTION
          ============================================================ */}
      <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* Elemento Decorativo */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block bg-emerald-500/20 text-emerald-400 font-bold px-4 py-1.5 rounded-full mb-4 text-sm uppercase tracking-wide border border-emerald-500/30">
              Plano Free: 30 dias grátis
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">Comece grátis, renove se gostar</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Todos os condomínios começam com o <strong>Plano Free</strong>. 
              Experimente a potência da nossa plataforma sem compromisso.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* PLANO 1: ESSENCIAL */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-slate-700 hover:border-emerald-500/50 transition-all flex flex-col">
              <h3 className="text-xl font-bold text-slate-200">Essencial</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-4">Até 30 Unidades</p>
              <div className="my-8">
                <span className="text-5xl font-extrabold text-white">R$ 190</span>
                <span className="text-slate-400 text-sm ml-2">/mês</span>
              </div>
              <p className="text-slate-400 mb-8 text-sm">Ideal para condomínios de pequeno porte ou associações locais.</p>
              
              <ul className="space-y-4 mb-8 flex-1">
                 {benefitsList.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-slate-300">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" /> {item}
                    </li>
                 ))}
                 <li className="text-slate-500 text-sm italic pl-8">+ todos os outros benefícios</li>
              </ul>
              
              <Link to="/pricing" className="block w-full bg-white/5 hover:bg-white/10 text-white text-center py-4 rounded-xl font-bold transition-all border border-white/10">
                Experimentar Grátis
              </Link>
            </div>

            {/* PLANO 2: BUSINESS - MAIS POPULAR */}
            <div className="bg-slate-800 rounded-3xl p-8 border-2 border-emerald-500 relative transform md:-translate-y-4 shadow-2xl shadow-emerald-900/30 flex flex-col z-20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-900 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                RECOMENDADO
              </div>
              <h3 className="text-xl font-bold text-white">Business</h3>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-4">31 a 80 Unidades</p>
              
              <div className="my-8 text-center md:text-left">
                <span className="text-5xl font-extrabold text-white">R$ 349</span>
                <span className="text-slate-400 text-sm ml-2">/mês</span>
              </div>
              <p className="text-slate-300 mb-8 text-sm">A solução completa para o síndico que busca governança e transparência absoluta.</p>

              <ul className="space-y-4 mb-8 flex-1">
                 {benefitsList.slice(0, 6).map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-white">
                      <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 flex-shrink-0" /> {item}
                    </li>
                 ))}
                 <li className="text-slate-400 text-sm italic pl-8">+ todos os outros benefícios</li>
              </ul>
              
              <Link to="/pricing" className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-center py-4 rounded-xl font-black transition-all shadow-lg shadow-emerald-600/20">
                Experimentar Grátis
              </Link>
            </div>

            {/* PLANO 3: CUSTOM */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-slate-700 hover:border-emerald-500/50 transition-all flex flex-col">
              <h3 className="text-xl font-bold text-slate-200">Custom</h3>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-4">Acima de 80 Unidades</p>
              
              <div className="my-8">
                <span className="text-3xl lg:text-4xl font-extrabold text-white">Sob Medida</span>
              </div>
              <p className="text-slate-400 mb-8 text-sm">Escalabilidade total para grandes empreendimentos e administradoras profissionais.</p>

              <ul className="space-y-4 mb-8 flex-1">
                 {benefitsList.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="flex items-center text-sm text-slate-300">
                      <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0" /> {item}
                    </li>
                 ))}
                 <li className="text-slate-500 text-sm italic pl-8">+ todos os outros benefícios</li>
              </ul>
              
              <Link to="/pricing" className="block w-full bg-white/5 hover:bg-white/10 text-white text-center py-4 rounded-xl font-bold transition-all border border-white/10">
                Falar com Vendas
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
          6. HOW IT WORKS
          ============================================================ */}
      <section id="how-it-works" className="py-24 bg-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
             <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Como funciona</h2>
             <p className="text-slate-600 max-w-xl mx-auto italic">Processo simplificado em menos de 5 minutos.</p>
          </div>

          <div className="grid md:grid-cols-5 gap-6 relative">
            {[
              { num: "01", title: "Crie a conta", text: "Cadastre seu condomínio e ganhe 30 dias." },
              { num: "02", title: "Cadastre", text: "Importe a lista de unidades e moradores." },
              { num: "03", title: "Inicie", text: "Configure sua assembleia em segundos." },
              { num: "04", title: "Votação", text: "Moradores votam pelo app ou web." },
              { num: "05", title: "Gestão", text: "Escolha seu plano e mantenha o acesso." },
            ].map((step, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 relative z-10 text-center hover:-translate-y-2 transition-all duration-300">
                  <div className="w-12 h-12 bg-emerald-600 text-white font-black rounded-full flex items-center justify-center mx-auto mb-6 text-lg shadow-xl shadow-emerald-200 ring-4 ring-white">
                    {step.num}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3 text-lg leading-tight">{step.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.text}</p>
              </div>
            ))}
            {/* Linha Conectora Desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-200 -z-0 transform -translate-y-10"></div>
          </div>
        </div>
      </section>

      {/* ============================================================
          7. SOCIAL PROOF / DEPOIMENTOS
          ============================================================ */}
      <section className="py-10 overflow-hidden">
        <div className="max-w-0x-l mx-auto px-2 sm:px-2 lg:px-3">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-5s">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900">Aprovado pelos melhores gestores</h2>
              </div>
              <div className="bg-slate-50/80 p-10 lg:p-16 rounded-[2.5rem] border border-slate-100 text-center relative shadow-inner">
                <div className="flex justify-center text-yellow-400 mb-8 gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-6 w-6 fill-current drop-shadow-sm" />)}
                </div>
                <p className="text-slate-700 italic text-2xl lg:text-3xl mb-10 font-medium leading-relaxed">
                  &ldquo;A plataforma revolucionou nossas assembleias. O quórum aumentou de 20% para 85% já na primeira votação online. A transparência agora é inquestionável.&rdquo;
                </p>
                <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-slate-300 mb-4 overflow-hidden ring-4 ring-white shadow-lg">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar do Roberto Silva" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-slate-900 text-lg">Roberto Silva</p>
                      <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest">Síndico Profissional - SP</p>
                    </div>
                </div>
              </div>
            </div>
        </div>
      </section>
      
      {/* ============================================================
          7.5. SEÇÃO DE AFILIADOS (A IDENTIDADE DA IMAGEM SOLICITADA)
          ============================================================ */}
      <section id="affiliates" className="py-28 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white relative overflow-hidden">
        {/* Background Icons Decorativos */}
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none select-none">
            <TrendingUp className="w-[30rem] h-[30rem]" />
        </div>
        <div className="absolute bottom-0 left-0 p-20 opacity-5 pointer-events-none select-none -rotate-12">
            <Percent className="w-64 h-64" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              
              {/* Coluna de Texto e Convite */}
              <div className="lg:w-1/2 space-y-10 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4">
                    <Gift className="w-4 h-4" /> Programa de Parceiros
                </div>
                
                <h2 className="text-4xl lg:text-6xl font-black mb-6 leading-tight">
                  Lucre indicando o <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">Votzz</span>
                </h2>
                
                <div className="space-y-6">
                  <p className="text-xl text-slate-300 leading-relaxed max-w-2xl">
                    Você é síndico profissional, administradora de condomínios ou consultor imobiliário? 
                  </p>
                  
                  {/* TEXTO DE COMISSÃO DE 15% EM DESTAQUE */}
                  <div className="bg-emerald-500/5 border-l-4 border-emerald-500 p-6 rounded-r-2xl transform hover:scale-[1.02] transition-transform">
                    <p className="text-2xl lg:text-3xl font-bold text-white">
                      Ganhe <span className="text-emerald-400 font-black underline decoration-emerald-500 decoration-4 underline-offset-4">15% de comissão recorrente</span> por cada cliente ativo na base.
                    </p>
                    <p className="text-slate-400 text-sm mt-3 flex items-center gap-2 justify-center lg:justify-start">
                      <Check className="w-4 h-4 text-emerald-500" /> Dinheiro direto na sua conta todo mês enquanto o cliente pagar.
                    </p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Link 
                    to="/affiliate/register" 
                    className="group relative inline-flex items-center gap-4 bg-emerald-500 hover:bg-emerald-400 text-[#0f172a] font-black px-10 py-5 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all hover:scale-105 active:scale-95"
                  >
                      QUERO SER UM PARCEIRO AGORA
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>

                {/* Micro-Features do Programa */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-10">
                    <div className="flex items-center gap-3">
                      <CircleDollarSign className="text-emerald-500 w-5 h-5" />
                      <span className="text-xs font-bold text-slate-300">Pagamento PIX</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Handshake className="text-emerald-500 w-5 h-5" />
                      <span className="text-xs font-bold text-slate-300">Apoio em Vendas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <BarChart3 className="text-emerald-500 w-5 h-5" />
                      <span className="text-xs font-bold text-slate-300">Dashboard de Ganhos</span>
                    </div>
                </div>
              </div>

              {/* Coluna do Card (Identity Look) */}
              <div className="lg:w-1/2 w-full max-w-lg mx-auto">
                  <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-10 lg:p-12 transform hover:rotate-1 hover:scale-[1.01] transition-all duration-700 relative shadow-2xl">
                      
                      {/* BADGE DE 15% SOBRE O CARD */}
                      <div className="absolute -top-5 -right-5 bg-emerald-500 text-slate-900 font-black px-6 py-3 rounded-2xl text-lg shadow-[0_10px_20px_rgba(16,185,129,0.4)] animate-bounce z-20">
                        15% RECORRENTE
                      </div>

                      <div className="flex items-center justify-between mb-10 border-b border-slate-700 pb-6">
                        <div>
                           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Ganhos Estimados</p>
                           <p className="text-5xl font-black text-white tracking-tighter">R$ 3.450,00</p>
                        </div>
                        <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-500/30">
                           <TrendingUp className="w-8 h-8 text-emerald-500" />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Ativos na sua carteira</p>
                        
                        <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-200 font-medium">Condomínio Jardins</span>
                          </div>
                          <span className="text-emerald-400 font-black">+ R$ 45,00/mês</span>
                        </div>

                        <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-200 font-medium">Clube Pinheiros</span>
                          </div>
                          <span className="text-emerald-400 font-black">+ R$ 120,00/mês</span>
                        </div>

                        <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-200 font-medium">Residencial Orion</span>
                          </div>
                          <span className="text-emerald-400 font-black">+ R$ 52,35/mês</span>
                        </div>
                      </div>

                      <div className="mt-10 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Gestão em Tempo Real Votzz Partner</p>
                      </div>
                  </div>
              </div>
            </div>

            {/* FAQ DE AFILIADOS - Para expandir o conteúdo */}
            <div className="mt-24 max-w-4xl mx-auto grid md:grid-cols-3 gap-10 border-t border-slate-800 pt-16">
                {affiliateFaq.map((item, idx) => (
                  <div key={idx}>
                    <h4 className="font-bold text-emerald-400 mb-3">{item.q}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.a}</p>
                  </div>
                ))}
            </div>
        </div>
      </section>

      {/* ============================================================
          8. CTA FINAL
          ============================================================ */}
      <section className="py-24 bg-emerald-600 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-700 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent animate-pulse"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6">Pronto para modernizar sua assembleia?</h2>
          <p className="text-emerald-100 text-xl max-w-2xl mx-auto font-medium">Junte-se a centenas de condomínios que já decidiram pela democracia digital.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
              <Link to="/pricing" className="bg-white text-emerald-700 px-12 py-5 rounded-full font-black text-lg shadow-2xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
                VER PLANOS E ASSINAR
              </Link>
              <button className="bg-emerald-900/30 text-white border-2 border-emerald-400/50 px-12 py-5 rounded-full font-black text-lg backdrop-blur-sm hover:bg-emerald-900/50 transition-all">
                SOLICITAR DEMO
              </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          9. FOOTER
          ============================================================ */}
      <footer id="contact" className="bg-slate-900 text-slate-400 py-20 relative border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 text-center md:text-left">
              <div className="space-y-6">
                  <Link to="/" className="inline-block flex justify-center md:justify-start">
                    <Logo theme="light" showSlogan={true} />
                  </Link>
                  <p className="text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
                    A Votzz é pioneira em tecnologia para decisões democráticas e transparentes em comunidades modernas.
                  </p>
                  <div className="flex justify-center md:justify-start gap-4">
                    {/* Placeholder para Redes Sociais */}
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:text-white cursor-pointer transition-colors"><Mail size={18}/></div>
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:text-white cursor-pointer transition-colors"><Zap size={18}/></div>
                  </div>
              </div>

              <div>
                  <h4 className="text-white font-black text-lg mb-8 uppercase tracking-widest">Empresa</h4>
                  <ul className="space-y-4 text-sm font-medium">
                    <li><Link to="/pricing" className="hover:text-emerald-400 transition-colors">Preços e Planos</Link></li>
                    <li><Link to="/blog" className="hover:text-emerald-400 transition-colors">Blog da Gestão</Link></li>
                    <li><Link to="/faq" className="hover:text-emerald-400 transition-colors">Perguntas Frequentes</Link></li>
                    <li><button onClick={() => scrollToSection('affiliates')} className="hover:text-emerald-400 transition-colors">Programa de Parceiros</button></li>
                  </ul>
              </div>

              <div>
                  <h4 className="text-white font-black text-lg mb-8 uppercase tracking-widest">Transparência</h4>
                  <ul className="space-y-4 text-sm font-medium">
                    <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Termos de Uso</Link></li>
                    <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Política de Privacidade</Link></li>
                    <li><Link to="/compliance" className="hover:text-emerald-400 transition-colors">Segurança de Dados</Link></li>
                  </ul>
              </div>

              <div>
                  <h4 className="text-white font-black text-lg mb-8 uppercase tracking-widest">Suporte</h4>
                  <ul className="space-y-4 text-sm font-medium">
                    <li className="flex items-center justify-center md:justify-start gap-3">
                      <Mail size={16} className="text-emerald-500" />
                      suporte@votzz.com.br
                    </li>
                    <li className="flex items-center justify-center md:justify-start gap-3">
                      <Headphones size={16} className="text-emerald-500" />
                      Chat de Ajuda Online
                    </li>
                    <li className="pt-4">
                      <p className="text-[10px] text-slate-600 leading-tight">
                        VORDX HOLDINGS LTDA<br />
                        CNPJ: 00.000.000/0001-00
                      </p>
                    </li>
                  </ul>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-xs text-slate-500">
                  &copy; {new Date().getFullYear()} Votzz Technology. Todos os direitos reservados.
                </p>
                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">LGPD Compliant</span>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;