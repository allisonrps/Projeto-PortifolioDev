import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdArrowForward,
  MdCheckCircle,
  MdPeople,
  MdCalendarMonth,
  MdAttachMoney,
  MdMenuBook,
  MdAutoAwesome,
  MdInsights,
  MdVerifiedUser,
  MdDevices,
  MdBolt,
  MdLayers
} from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/ui/Logo';
import './Landing.css';

interface ShowcaseTab {
  id: string;
  label: string;
  tag: string;
  title: string;
  description: string;
  image: string;
  accent: string;
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Geral',
    tag: 'Visão 360° do Dia',
    title: 'Tudo o que importa logo ao abrir o sistema',
    description:
      'Alertas rápidos de aniversariantes, tarefas entregues, pagamentos pendentes, correções e as aulas programadas para hoje.',
    image: '/prints/dashboard.png',
    accent: '#7C3AED'
  },
  {
    id: 'student',
    label: 'Perfil do Aluno',
    tag: 'Prontuário Pedagógico',
    title: 'Histórico individual completo por aluno',
    description:
      'Acompanhe frequência, notas codificadas por cores, mensalidades mês a mês, horários fixos e fichas liberadas em um único perfil.',
    image: '/prints/aluno_aulas.png',
    accent: '#2563EB'
  },
  {
    id: 'activities',
    label: 'Provas & Quiz Online',
    tag: 'Avaliação Interativa',
    title: 'Crie modelos de atividades e envie por link',
    description:
      'Monte questões de múltipla escolha ou discursivas com pesos personalizados e deixe seu aluno responder direto pelo navegador.',
    image: '/prints/editor_atividade.png',
    accent: '#059669'
  },
  {
    id: 'sheets',
    label: 'Portal & Fichas',
    tag: 'Espaço do Aluno',
    title: 'Compartilhe materiais ricos com um clique',
    description:
      'Libere fichas de estudo formatadas para o Portal Público do Aluno sem exigir cadastro ou senha para visualização.',
    image: '/prints/ficha_publica.png',
    accent: '#D97706'
  },
  {
    id: 'stats',
    label: 'Estatísticas',
    tag: 'Métricas & Evolução',
    title: 'Indicadores reais de produtividade e retenção',
    description:
      'Analise carga horária mensal e anual, taxa de efetividade das aulas e distribuição de alunos por matéria.',
    image: '/prints/estatisticas.png',
    accent: '#EC4899'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { professor } = useAuth();
  const [activeShowcase, setActiveShowcase] = useState<string>('dashboard');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-reveal observer for smooth transitional effects
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleStart = () => {
    if (professor) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleRegister = () => {
    if (professor) {
      navigate('/dashboard');
    } else {
      navigate('/login?register=true');
    }
  };

  const currentTab = SHOWCASE_TABS.find(t => t.id === activeShowcase) || SHOWCASE_TABS[0];

  return (
    <div className="landing-page">
      {/* ==================== HEADER FLUTUANTE ==================== */}
      <header className={`landing-header ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="landing-header-container">
          <div className="landing-logo-container">
            <Logo size="sm" href="/" />
          </div>

          <nav className="landing-nav">
            <a href="#vitrine">Vitrine</a>
            <a href="#recursos">Recursos</a>
            <a href="#temas">Identidades Visuais</a>
            <a href="#como-funciona">Como Funciona</a>
            <a href="#planos">Planos</a>
          </nav>

          <div className="landing-header-actions">
            {professor ? (
              <button className="lp-btn lp-btn-primary lp-btn-sm" onClick={() => navigate('/dashboard')}>
                Acessar Painel <MdArrowForward />
              </button>
            ) : (
              <>
                <button className="lp-btn lp-btn-ghost lp-btn-sm" onClick={() => navigate('/login')}>
                  Entrar
                </button>
                <button className="lp-btn lp-btn-primary lp-btn-sm" onClick={handleRegister}>
                  Começar Grátis <MdArrowForward />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ==================== FAIXA 1: HERO (PROFESSORA + DEGRADÊ PARCIAL ESQUERDA->DIREITA) ==================== */}
      <section className="lp-band lp-band-hero">
        {/* Background da Professora com Degradê Suave da Esquerda para a Direita */}
        <div className="hero-photo-backdrop" aria-hidden="true">
          <img
            src="/prints/hero-teacher.jpg"
            alt="Professora sorridente utilizando a plataforma Aura"
            className="hero-teacher-bg-img"
          />
          <div className="hero-gradient-veil" />
        </div>

        <div className="hero-ambient-orb orb-violet" />
        <div className="hero-grid-pattern" />

        <div className="landing-container hero-container">
          <div className="hero-content reveal-on-scroll is-visible">
            <div className="hero-pill">
              <span className="hero-pill-dot" />
              <span>Plataforma Pedagógica & Financeira para Professores</span>
            </div>

            <h1>
              Transforme a gestão das suas{' '}
              <span className="lp-gradient-text">aulas particulares</span> com elegância.
            </h1>

            <p className="hero-subtitle">
              O <strong>Aura</strong> reúne carteira de alunos, agenda recorrente, controle de mensalidades,
              fichas de estudo e atividades online em uma experiência fluida, moderna e feita sob medida para educadores.
            </p>

            <div className="hero-actions">
              <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={handleStart}>
                <span>Acessar Plataforma</span>
                <MdArrowForward className="btn-arrow-icon" />
              </button>
              <a href="#vitrine" className="lp-btn lp-btn-secondary lp-btn-lg">
                Explorar por dentro
              </a>
            </div>

            <div className="hero-highlights-row">
              <div className="hero-mini-stat">
                <MdVerifiedUser className="mini-stat-icon" />
                <span>Portal Público do Aluno</span>
              </div>
              <div className="hero-mini-stat">
                <MdBolt className="mini-stat-icon" />
                <span>Correção & Notas Inteligentes</span>
              </div>
              <div className="hero-mini-stat">
                <MdDevices className="mini-stat-icon" />
                <span>Desktop & Mobile</span>
              </div>
            </div>
          </div>

          {/* Metade direita dedicada à foto da professora rodeada por cards flutuantes de tamanhos variados */}
          <div className="hero-visual reveal-on-scroll is-visible">
            <div className="hero-teacher-stage">
              <img
                src="/prints/hero-teacher.jpg"
                alt="Professora sorridente utilizando a plataforma Aura em uma mesa iluminada"
                className="hero-teacher-mobile-img"
              />

              {/* 1. Card Maior (Top-Left): Agenda Recorrente */}
              <div className="hero-float-badge hero-float-lg float-pos-top-left">
                <div className="float-card-header">
                  <div className="float-icon-box icon-blue">
                    <MdCalendarMonth />
                  </div>
                  <div className="float-head-copy">
                    <strong>Agenda Inteligente</strong>
                    <span>Replicação semanal e feriados</span>
                  </div>
                  <span className="float-status-pill pill-blue">14:00</span>
                </div>
                <div className="float-mini-lesson">
                  <span className="lesson-dot" />
                  <span>Inglês Avançado — Mariana S.</span>
                </div>
              </div>

              {/* 2. Card Médio (Top-Right): Portal do Aluno & Fichas */}
              <div className="hero-float-badge hero-float-md float-pos-top-right">
                <div className="float-icon-box icon-violet">
                  <MdAutoAwesome />
                </div>
                <div>
                  <strong>Portal & Fichas</strong>
                  <span>Materiais e estudos em 1 link</span>
                </div>
              </div>

              {/* 3. Card Menor / Pílula (Mid-Left): Carteira de Alunos */}
              <div className="hero-float-badge hero-float-sm float-pos-mid-left">
                <div className="float-icon-box float-icon-sm icon-cyan">
                  <MdPeople />
                </div>
                <strong>Alunos & Níveis</strong>
              </div>

              {/* 4. Card Menor / Pílula (Mid-Right): Estatísticas */}
              <div className="hero-float-badge hero-float-sm float-pos-mid-right">
                <div className="float-icon-box float-icon-sm icon-rose">
                  <MdInsights />
                </div>
                <strong>Gráficos & Evolução</strong>
              </div>

              {/* 5. Card Médio (Bottom-Left): Provas & Quiz Online */}
              <div className="hero-float-badge hero-float-md float-pos-bottom-left">
                <div className="float-icon-box icon-amber">
                  <MdMenuBook />
                </div>
                <div>
                  <strong>Provas & Quiz Online</strong>
                  <span>Nota automática + PDF/DOC</span>
                </div>
              </div>

              {/* 6. Card Maior (Bottom-Right): Mensalidades & Caixa */}
              <div className="hero-float-badge hero-float-lg float-pos-bottom-right">
                <div className="float-card-header">
                  <div className="float-icon-box icon-emerald">
                    <MdAttachMoney />
                  </div>
                  <div className="float-head-copy">
                    <strong>Mensalidades & Caixa</strong>
                    <span>Controle mensal + lançamentos</span>
                  </div>
                  <span className="float-status-pill pill-emerald">Em dia</span>
                </div>
                <div className="float-progress-track">
                  <div className="float-progress-fill" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Faixa de Métricas / Benefícios Rápidos acoplada à base do Hero */}
        <div className="landing-container">
          <div className="hero-metrics-ribbon reveal-on-scroll">
            <div className="metric-ribbon-item">
              <span className="metric-number">5 em 1</span>
              <span className="metric-caption">Alunos, Agenda, Finanças, Fichas e Quizzes</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-ribbon-item">
              <span className="metric-number">100%</span>
              <span className="metric-caption">Responsivo para celular, tablet e computador</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-ribbon-item">
              <span className="metric-number">3 Estilos</span>
              <span className="metric-caption">Clássico, Vibrant Square e Minimal Manga</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-ribbon-item">
              <span className="metric-number">PDF & DOC</span>
              <span className="metric-caption">Exportação instantânea de provas e materiais</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAIXA 2: VITRINE INTERATIVA (SOFT LAVENDER / SKY BAND) ==================== */}
      <section id="vitrine" className="lp-band lp-band-lavender">
        <div className="landing-container">
          <div className="lp-section-header reveal-on-scroll">
            <span className="lp-eyebrow eyebrow-violet">Tour Interativo</span>
            <h2>Experimente cada módulo sem sair da página</h2>
            <p>
              Navegue pelas abas abaixo e veja como o Aura organiza toda a rotina pedagógica e administrativa com clareza visual.
            </p>
          </div>

          <div className="showcase-tabs-bar reveal-on-scroll">
            {SHOWCASE_TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`showcase-tab-btn ${activeShowcase === tab.id ? 'active' : ''}`}
                onClick={() => setActiveShowcase(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="showcase-panel reveal-on-scroll" key={currentTab.id}>
            <div className="showcase-panel-info">
              <span className="showcase-tag" style={{ color: currentTab.accent, background: `${currentTab.accent}18` }}>
                {currentTab.tag}
              </span>
              <h3>{currentTab.title}</h3>
              <p>{currentTab.description}</p>
              <button className="lp-btn lp-btn-outline" onClick={handleStart}>
                Testar agora gratuitamente <MdArrowForward />
              </button>
            </div>

            <div className="showcase-panel-media">
              <div className="browser-window-frame">
                <div className="browser-Window-topbar">
                  <div className="window-dots">
                    <span className="dot dot-red" />
                    <span className="dot dot-yellow" />
                    <span className="dot dot-green" />
                  </div>
                  <div className="window-address-bar">Aura • {currentTab.label}</div>
                </div>
                <div className="browser-window-body">
                  <img src={currentTab.image} alt={currentTab.label} className="showcase-active-img" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAIXA 3: RECURSOS EM DETALHE (PURE WHITE & COLOR-TINTED CARDS) ==================== */}
      <section id="recursos" className="lp-band lp-band-white">
        <div className="landing-container">
          <div className="lp-section-header reveal-on-scroll">
            <span className="lp-eyebrow eyebrow-blue">Recursos Especializados</span>
            <h2>Desenhado para o fluxo real do professor particular</h2>
            <p>
              Substitua dezenas de planilhas, blocos de notas e mensagens soltas por ferramentas conectadas entre si.
            </p>
          </div>

          {/* Recurso 1 */}
          <div className="lp-feature-block reveal-on-scroll">
            <div className="lp-feature-copy">
              <div className="lp-feature-icon-pill pill-blue">
                <MdPeople /> <span>Gestão de Alunos</span>
              </div>
              <h3>Carteira de alunos organizada com prontuário completo</h3>
              <p>
                Visualize rapidamente matérias, níveis, contatos diretos para WhatsApp, valor de mensalidade e histórico de presença de cada estudante.
              </p>
              <ul className="lp-feature-checklist">
                <li><MdCheckCircle /> Esquema visual de cores para notas (0–5, 6–7, 8–10)</li>
                <li><MdCheckCircle /> Compartilhamento rápido do link público do Portal do Aluno</li>
                <li><MdCheckCircle /> Filtro por matéria, busca instantânea e controle de ativos/arquivados</li>
              </ul>
            </div>
            <div className="lp-feature-visual accent-glow-blue">
              <img src="/prints/alunos.png" alt="Gestão de Alunos no Aura" className="lp-feature-img" />
            </div>
          </div>

          {/* Recurso 2 */}
          <div className="lp-feature-block reverse reveal-on-scroll">
            <div className="lp-feature-copy">
              <div className="lp-feature-icon-pill pill-emerald">
                <MdCalendarMonth /> <span>Agenda Inteligente</span>
              </div>
              <h3>Horários semanais recorrentes e controle de feriados</h3>
              <p>
                Configure a grade fixa do aluno uma única vez e deixe o Aura gerar as aulas automaticamente, respeitando períodos de férias e feriados.
              </p>
              <ul className="lp-feature-checklist">
                <li><MdCheckCircle /> Replicação automática da grade semanal sem conflitos</li>
                <li><MdCheckCircle /> Registro de presença, cancelamento e anotações da última aula</li>
                <li><MdCheckCircle /> Alertas no painel para aulas anteriores pendentes de baixa</li>
              </ul>
            </div>
            <div className="lp-feature-visual accent-glow-emerald">
              <img src="/prints/agenda.png" alt="Agenda Semanal do Aura" className="lp-feature-img" />
            </div>
          </div>

          {/* Recurso 3 */}
          <div className="lp-feature-block reveal-on-scroll">
            <div className="lp-feature-copy">
              <div className="lp-feature-icon-pill pill-amber">
                <MdAttachMoney /> <span>Gestão Financeira</span>
              </div>
              <h3>Mensalidades e lançamentos manuais sempre sob controle</h3>
              <p>
                Acompanhe o faturamento mensal, anual e acumulado no topo, dê baixa nas mensalidades com um clique e adicione receitas avulsas quando precisar.
              </p>
              <ul className="lp-feature-checklist">
                <li><MdCheckCircle /> Quadro de mensalidades direto abaixo dos indicadores principais</li>
                <li><MdCheckCircle /> Botão de Lançamento Manual (Valor, Data e Descrição)</li>
                <li><MdCheckCircle /> Gráficos de evolução mensal e receita por matéria</li>
              </ul>
            </div>
            <div className="lp-feature-visual accent-glow-amber">
              <img src="/prints/financeiro.png" alt="Financeiro do Aura" className="lp-feature-img" />
            </div>
          </div>

          {/* Recurso 4 */}
          <div className="lp-feature-block reverse reveal-on-scroll">
            <div className="lp-feature-copy">
              <div className="lp-feature-icon-pill pill-purple">
                <MdMenuBook /> <span>Material Didático & Avaliações</span>
              </div>
              <h3>Fichas pedagógicas ricas e atividades interativas</h3>
              <p>
                Elabore resumos de aula com editor rico, organize por matéria e nível, libere para alunos específicos e exporte avaliações em PDF ou Word.
              </p>
              <ul className="lp-feature-checklist">
                <li><MdCheckCircle /> Editor visual com tamanhos de fonte, cores e emojis</li>
                <li><MdCheckCircle /> Questões de múltipla escolha com correção automática</li>
                <li><MdCheckCircle /> Exportação em PDF ou Word (.doc) com um clique</li>
              </ul>
            </div>
            <div className="lp-feature-visual accent-glow-purple">
              <img src="/prints/materias_fichas.png" alt="Fichas e Matérias do Aura" className="lp-feature-img" />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAIXA 4: IDENTIDADES VISUAIS (DEEP ROYAL CONTRAST BAND) ==================== */}
      <section id="temas" className="lp-band lp-band-dark-royal">
        <div className="landing-container">
          <div className="lp-section-header lp-header-on-dark reveal-on-scroll">
            <span className="lp-eyebrow eyebrow-cyan-glow">Personalização Total</span>
            <h2>Três estéticas visuais, infinitas combinações de cores</h2>
            <p>
              Além do modo Claro e Escuro e da escolha livre das cores primária e secundária, você pode transformar a geometria de todo o sistema.
            </p>
          </div>

          <div className="lp-themes-grid">
            <div className="lp-theme-card reveal-on-scroll">
              <div className="lp-theme-img-holder">
                <img src="/prints/dashboard.png" alt="Tema Clássico" />
                <span className="lp-theme-chip">Suave & Glass</span>
              </div>
              <div className="lp-theme-card-content">
                <h4>1. Classic Theme</h4>
                <p>
                  Bordas arredondadas, efeitos sutis de vidro translúcido e brilhos radiais suaves para uma experiência acolhedora e contemporânea.
                </p>
              </div>
            </div>

            <div className="lp-theme-card reveal-on-scroll">
              <div className="lp-theme-img-holder">
                <img src="/prints/tema_vibrantsquare.png" alt="Tema Vibrant Square" />
                <span className="lp-theme-chip chip-square">Retangular & Marcante</span>
              </div>
              <div className="lp-theme-card-content">
                <h4>2. Vibrant Square</h4>
                <p>
                  Geometria 100% reta, contornos definidos de 2px, base destacada em 4px na cor primária e sombras sólidas de inspiração neo-brutalista.
                </p>
              </div>
            </div>

            <div className="lp-theme-card reveal-on-scroll">
              <div className="lp-theme-img-holder">
                <img src="/prints/tema_minimalmanga.png" alt="Tema Minimal Manga" />
                <span className="lp-theme-chip chip-manga">Chanfrado & Screentone</span>
              </div>
              <div className="lp-theme-card-content">
                <h4>3. Minimal Manga</h4>
                <p>
                  Recortes chanfrados de 12px nos cantos superiores, textura técnica de hachuras diagonais e alto contraste editorial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAIXA 5: COMO FUNCIONA (MINT / AQUA SOFT BAND) ==================== */}
      <section id="como-funciona" className="lp-band lp-band-mint">
        <div className="landing-container">
          <div className="lp-section-header reveal-on-scroll">
            <span className="lp-eyebrow eyebrow-emerald">Fluxo Descomplicado</span>
            <h2>Sua rotina organizada em 3 passos simples</h2>
            <p>Comece em poucos minutos e sinta a diferença já na primeira semana de aulas.</p>
          </div>

          <div className="lp-steps-grid">
            <div className="lp-step-card reveal-on-scroll">
              <div className="lp-step-number">01</div>
              <div className="lp-step-icon">
                <MdLayers />
              </div>
              <h3>Estruture suas Matérias e Alunos</h3>
              <p>
                Cadastre os idiomas ou disciplinas que você leciona, defina os níveis e registre seus alunos com valor de mensalidade e horários fixos.
              </p>
            </div>

            <div className="lp-step-card reveal-on-scroll">
              <div className="lp-step-number">02</div>
              <div className="lp-step-icon">
                <MdAutoAwesome />
              </div>
              <h3>Compartilhe o Portal do Aluno</h3>
              <p>
                Envie o link exclusivo do Portal para cada estudante acessar fichas de aula liberadas, responder quizzes online e consultar suas notas.
              </p>
            </div>

            <div className="lp-step-card reveal-on-scroll">
              <div className="lp-step-number">03</div>
              <div className="lp-step-icon">
                <MdInsights />
              </div>
              <h3>Monitore Ganhos e Resultados</h3>
              <p>
                Dê baixa nas aulas do dia, registre mensalidades ou lançamentos avulsos e acompanhe sua evolução financeira e pedagógica em tempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAIXA 6: PLANOS (WARM SAND / PEARL BAND) ==================== */}
      <section id="planos" className="lp-band lp-band-sand">
        <div className="landing-container">
          <div className="lp-section-header reveal-on-scroll">
            <span className="lp-eyebrow eyebrow-violet">Investimento Transparente</span>
            <h2>Simples, acessível e com 14 dias de teste grátis</h2>
            <p>Comece agora sem precisar de cartão de crédito e assine via PIX, Cartão ou Boleto quando quiser.</p>
          </div>

          <div className="lp-pricing-grid">
            <div className="lp-price-card reveal-on-scroll">
              <div className="lp-price-top">
                <span className="lp-plan-name">Teste Grátis</span>
                <div className="lp-plan-price">
                  <strong>R$ 0</strong>
                  <span>/14 dias</span>
                </div>
                <p>Experimente toda a plataforma sem compromisso e sem cartão de crédito.</p>
              </div>
              <ul className="lp-plan-list">
                <li><MdCheckCircle /> 14 dias com todos os recursos Pro</li>
                <li><MdCheckCircle /> Alunos, agenda e financeiro liberados</li>
                <li><MdCheckCircle /> Portal do aluno, fichas e provas online</li>
                <li><MdCheckCircle /> 3 identidades visuais personalizáveis</li>
              </ul>
              <button className="lp-btn lp-btn-outline lp-btn-full" onClick={handleRegister}>
                Testar 14 Dias Grátis
              </button>
            </div>

            <div className="lp-price-card reveal-on-scroll">
              <div className="lp-price-top">
                <span className="lp-plan-name">Aura Pro Mensal</span>
                <div className="lp-plan-price">
                  <strong>R$ 29,90</strong>
                  <span>/mês</span>
                </div>
                <p>Acesso completo e ilimitado com flexibilidade mês a mês.</p>
              </div>
              <ul className="lp-plan-list">
                <li><MdCheckCircle /> Alunos e turmas ILIMITADOS</li>
                <li><MdCheckCircle /> Agenda recorrente + controle de feriados</li>
                <li><MdCheckCircle /> Gestão financeira, gráficos e recibos</li>
                <li><MdCheckCircle /> Provas online + Exportação PDF e Word</li>
              </ul>
              <button className="lp-btn lp-btn-outline lp-btn-full" onClick={handleRegister}>
                Assinar Plano Mensal
              </button>
            </div>

            <div className="lp-price-card lp-price-featured reveal-on-scroll">
              <div className="lp-featured-ribbon">Economize 2 Meses</div>
              <div className="lp-price-top">
                <span className="lp-plan-name">Aura Pro Anual</span>
                <div className="lp-plan-price">
                  <strong>R$ 299</strong>
                  <span>/ano</span>
                </div>
                <p>Equivalente a R$ 24,90/mês — 12 meses de tranquilidade e acesso total.</p>
              </div>
              <ul className="lp-plan-list">
                <li><MdCheckCircle /> Todos os recursos do Aura Pro ilimitados</li>
                <li><MdCheckCircle /> 2 meses de desconto em relação ao mensal</li>
                <li><MdCheckCircle /> Backup e restauração completa de dados</li>
                <li><MdCheckCircle /> Pagamento via PIX, Cartão ou Boleto (Asaas)</li>
              </ul>
              <button className="lp-btn lp-btn-primary lp-btn-full" onClick={handleRegister}>
                Começar 14 Dias Grátis <MdArrowForward />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAIXA 7: CTA FINAL VIBRANTE ==================== */}
      <section className="lp-band lp-band-cta">
        <div className="landing-container">
          <div className="lp-cta-banner reveal-on-scroll">
            <div className="lp-cta-text">
              <span className="lp-cta-pill">✨ Pronto para elevar o nível das suas aulas?</span>
              <h2>Diga adeus às planilhas confusas hoje mesmo.</h2>
              <p>
                Crie sua conta gratuita em segundos e descubra como é simples gerenciar seus alunos, horários, finanças e materiais em um só lugar.
              </p>
              <div className="lp-cta-buttons">
                <button className="lp-btn lp-btn-white lp-btn-lg" onClick={handleRegister}>
                  Criar Minha Conta Grátis <MdArrowForward />
                </button>
                <button className="lp-btn lp-btn-glass lp-btn-lg" onClick={handleStart}>
                  Já tenho conta
                </button>
              </div>
            </div>
            <div className="lp-cta-preview">
              <img src="/prints/configuracoes.png" alt="Personalização do Aura" />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER CLARO ELEGANTE ==================== */}
      <footer className="landing-footer">
        <div className="landing-container footer-container">
          <div className="footer-brand-col">
            <Logo size="sm" href="/" />
            <p>
              Plataforma inteligente para gestão pedagógica, agenda e controle financeiro de professores particulares.
            </p>
          </div>

          <div className="footer-links-col">
            <h5>Navegação</h5>
            <a href="#vitrine">Vitrine Interativa</a>
            <a href="#recursos">Funcionalidades</a>
            <a href="#temas">Temas Visuais</a>
            <a href="#planos">Planos e Preços</a>
          </div>

          <div className="footer-credits-col">
            <p className="footer-author">
              Desenvolvido por <strong>Allison Rodrigues</strong> &copy; {new Date().getFullYear()}
            </p>
            <div className="footer-badges">
              <span>⚡ Rápido</span>
              <span>🔒 Seguro</span>
              <span>🎨 Personalizável</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
