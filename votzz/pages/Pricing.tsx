
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, 
  X, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Menu, 
  X as CloseIcon, 
  ShieldCheck, 
  Zap, 
  Headphones,
  ArrowRight,
  ChevronRight,
  Star,
  Crown
} from 'lucide-react';
import { Logo } from '../components/Logo';

const PricingHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-sm py-3' : 'bg-slate-900 text-white py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo theme={isScrolled ? "dark" : "light"} />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/pricing" className={`text-sm font-bold ${isScrolled ? 'text-emerald-600' : 'text-white'}`}>Preços</Link>
          <Link to="/blog" className={`text-sm font-medium ${isScrolled ? 'text-slate-600 hover:text-emerald-600' : 'text-slate-300 hover:text-white'}`}>Blog</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className={`text-sm font-medium ${isScrolled ? 'text-emerald-600' : 'text-emerald-400'}`}>Entrar</Link>
          <Link to="/login" state={{ isRegister: true }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-md">
            Começar Agora
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <CloseIcon className={isScrolled ? 'text-slate-800' : 'text-white'} /> : <Menu className={isScrolled ? 'text-slate-800' : 'text-white'} />}
        </button>
      </div>

       {/* Mobile Menu */}
       {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-lg p-4 flex flex-col space-y-4 animate-in slide-in-from-top-2 text-slate-800">
            <Link to="/pricing" className="py-2 font-bold text-emerald-600 border-b border-slate-50">Preços</Link>
            <Link to="/blog" className="py-2 border-b border-slate-50">Blog</Link>
            <Link to="/login" className="py-2 text-emerald-600">Entrar</Link>
          </div>
        )}
    </header>
  );
};

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200">
      <button 
        className="w-full py-4 flex items-center justify-between text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold text-slate-800">{question}</span>
        {isOpen ? <ChevronUp className="text-emerald-600" /> : <ChevronDown className="text-slate-400" />}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 pb-4' : 'max-h-0'}`}>
        <p className="text-slate-600 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <PricingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-slate-900 text-white text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-600/10 opacity-30"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-500 rounded-full blur-[128px] opacity-20"></div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 relative z-10">
          Planos Flexíveis para sua Gestão
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto relative z-10">
          Transparência total. Sem taxas ocultas. Escolha a opção que melhor se adapta ao tamanho e necessidade do seu condomínio ou associação.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 -mt-10 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            
            {/* Plan 1: Avulso */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-xl transition-all duration-300 relative group">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Plano Avulso</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">Ideal para eleições anuais ou demandas pontuais.</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-4xl font-extrabold text-slate-900">R$ 220</span>
                <span className="text-slate-500 ml-2">/assembleia</span>
              </div>

              <Link 
                to="/login" 
                state={{ isRegister: true }}
                className="block w-full py-3 px-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl text-center hover:border-emerald-500 hover:text-emerald-600 transition-colors"
              >
                Contratar Avulso
              </Link>

              <div className="mt-8 space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">O que está incluso:</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start"><Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" /> Ata digital automática</li>
                  <li className="flex items-start"><Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" /> Painel de votação seguro</li>
                  <li className="flex items-start"><Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" /> Suporte via e-mail (Básico)</li>
                  <li className="flex items-start"><Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" /> Usuários ilimitados</li>
                </ul>
              </div>
            </div>

            {/* Plan 2: Mensal (Featured) */}
            <div className="bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500 p-8 transform md:-translate-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">MAIS POPULAR</div>
              
              <h3 className="text-xl font-bold text-white mb-2">Plano Mensal</h3>
              <p className="text-emerald-100/70 text-sm mb-6 h-10">Para condomínios ativos, clubes e empresas.</p>
              
              <div className="flex items-baseline mb-6">
                <span className="text-5xl font-extrabold text-white">R$ 290</span>
                <span className="text-slate-400 ml-2">/mês</span>
              </div>

              <Link 
                to="/login" 
                state={{ isRegister: true }}
                className="block w-full py-4 px-4 bg-emerald-600 text-white font-bold rounded-xl text-center hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105"
              >
                Assinar Mensal
              </Link>

              <div className="mt-8 space-y-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tudo do Avulso, mais:</p>
                <ul className="space-y-3 text-sm text-slate-200">
                  <li className="flex items-start"><Zap className="w-5 h-5 text-emerald-400 mr-2 flex-shrink-0" /> <span className="font-bold">Assembleias Ilimitadas</span></li>
                  <li className="flex items-start"><Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" /> Recursos Premium liberados</li>
                  <li className="flex items-start"><Headphones className="w-5 h-5 text-emerald-400 mr-2 flex-shrink-0" /> Suporte Prioritário (WhatsApp)</li>
                  <li className="flex items-start"><Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" /> Gestão de documentos</li>
                  <li className="flex items-start"><Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" /> Histórico vitalício</li>
                </ul>
              </div>
            </div>

            {/* Plan 3: Anual */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-xl transition-all duration-300 relative">
               <div className="absolute top-0 inset-x-0 bg-emerald-50 h-1.5 rounded-t-2xl"></div>
              <h3 className="text-xl font-bold text-emerald-700 mb-2">Plano Anual</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">Economia inteligente com foco em fidelização.</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-extrabold text-slate-900">R$ 2.436</span>
                <span className="text-slate-500 ml-2">/ano</span>
              </div>
              <p className="text-emerald-600 text-xs font-bold mb-6 bg-emerald-50 inline-block px-2 py-1 rounded">30% de Desconto (Eq. R$ 203/mês)</p>

              <Link 
                to="/login" 
                state={{ isRegister: true }}
                className="block w-full py-3 px-4 bg-slate-800 text-white font-bold rounded-xl text-center hover:bg-slate-700 transition-colors"
              >
                Assinar Anual
              </Link>

              <div className="mt-8 bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Vantagens exclusivas:</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start"><Crown className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" /> <span className="font-bold text-slate-900">Módulo Governança Digital</span></li>
                  <li className="flex items-start"><Check className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" /> Gestão de Reservas de Áreas</li>
                  <li className="flex items-start"><Check className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" /> Enquetes e Mural Oficial</li>
                  <li className="flex items-start"><ShieldCheck className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" /> Suporte VIP (WhatsApp)</li>
                  <li className="flex items-start"><Check className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" /> Treinamento de Implantação</li>
                </ul>
              </div>
            </div>

          </div>
          
          <div className="text-center mt-12">
            <Link to="/pricing" className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center justify-center mx-auto">
              Ver tabela completa de preços <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Comparativo de Recursos</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 px-2 text-slate-500 font-medium">Recursos</th>
                  <th className="py-4 px-2 text-center text-slate-900 font-bold w-1/4">Avulso</th>
                  <th className="py-4 px-2 text-center text-emerald-600 font-bold w-1/4 bg-emerald-50 rounded-t-lg">Mensal</th>
                  <th className="py-4 px-2 text-center text-emerald-700 font-bold w-1/4">Anual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { name: "Ata Automática", avulso: true, mensal: true, anual: true },
                  { name: "Criptografia de Ponta", avulso: true, mensal: true, anual: true },
                  { name: "Assembleias", avulso: "1 Única", mensal: "Ilimitadas", anual: "Ilimitadas" },
                  { name: "Suporte", avulso: "E-mail", mensal: "WhatsApp + E-mail", anual: "Gerente de Conta" },
                  { name: "Upload de Documentos", avulso: "50MB", mensal: "10GB", anual: "100GB" },
                  { name: "Módulo Governança (Reservas/Enquetes)", avulso: false, mensal: false, anual: true },
                  { name: "Integração API", avulso: false, mensal: true, anual: true },
                  { name: "Treinamento", avulso: false, mensal: false, anual: true },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-4 px-2 text-slate-700 font-medium">{row.name}</td>
                    <td className="py-4 px-2 text-center text-slate-600">
                      {typeof row.avulso === 'boolean' ? (row.avulso ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />) : row.avulso}
                    </td>
                    <td className="py-4 px-2 text-center text-slate-600 bg-emerald-50/50">
                      {typeof row.mensal === 'boolean' ? (row.mensal ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />) : row.mensal}
                    </td>
                    <td className="py-4 px-2 text-center text-slate-600">
                      {typeof row.anual === 'boolean' ? (row.anual ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : <X className="w-5 h-5 text-slate-300 mx-auto" />) : row.anual}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-8">
            <HelpCircle className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-slate-900">Perguntas Frequentes</h2>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-2">
            <FaqItem 
              question="Como funciona o pagamento?" 
              answer="Aceitamos cartões de crédito (todas as bandeiras), boleto bancário e PIX. Para o plano mensal, a cobrança é recorrente no cartão de crédito." 
            />
            <FaqItem 
              question="Posso cancelar a qualquer momento?" 
              answer="Sim. No plano mensal, você pode cancelar a qualquer momento sem multa. O acesso permanece ativo até o fim do ciclo pago. No plano anual, o cancelamento encerra a renovação automática." 
            />
            <FaqItem 
              question="O que conta como uma assembleia ilimitada?" 
              answer="Nos planos Mensal e Anual, você pode abrir quantas votações e assembleias (AGO, AGE) quiser, sem custo adicional por evento." 
            />
            <FaqItem 
              question="Tenho garantia de segurança?" 
              answer="Sim. Utilizamos criptografia SHA-256 e logs auditáveis para garantir que cada voto seja único, secreto (quando aplicável) e imutável." 
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                 <div className="mb-4">
                    <Link to="/">
                        <Logo theme="light" />
                    </Link>
                 </div>
                 <p className="text-sm">Tecnologia para decisões democráticas e transparentes.</p>
              </div>
              
              <div>
                 <h4 className="text-white font-bold mb-4">Empresa</h4>
                 <ul className="space-y-2 text-sm">
                    <li><Link to="/pricing" className="hover:text-white">Preços</Link></li>
                    <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                    <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                    <li><Link to="/testimonials" className="hover:text-white">Depoimentos</Link></li>
                 </ul>
              </div>

              <div>
                 <h4 className="text-white font-bold mb-4">Legal</h4>
                 <ul className="space-y-2 text-sm">
                    <li><Link to="/terms" className="hover:text-white">Termos de Uso</Link></li>
                    <li><Link to="/privacy" className="hover:text-white">Privacidade</Link></li>
                    <li><Link to="/compliance" className="hover:text-white">Compliance</Link></li>
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

export default Pricing;
