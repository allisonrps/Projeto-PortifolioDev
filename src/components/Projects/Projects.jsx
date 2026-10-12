import { useState, useRef, useEffect } from 'react';
import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import Badge from '../common/Badge';
import { projects } from '../../data/projects';
import { translations } from '../../data/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiExternalLink, FiChevronRight, FiChevronLeft, FiUsers, FiLayers, FiMusic } from 'react-icons/fi';
import { FaGithub, FaGooglePlay } from 'react-icons/fa';
import styles from './Projects.module.css';

const statusMap = {
  'em-producao': {
    pt: { text: 'Em Produção', variant: 'success' },
    en: { text: 'In Production', variant: 'success' }
  },
  concluido: {
    pt: { text: 'Concluído', variant: 'success' },
    en: { text: 'Completed', variant: 'success' }
  },
  'em-desenvolvimento': {
    pt: { text: 'Em desenvolvimento', variant: 'warning' },
    en: { text: 'In development', variant: 'warning' }
  },
  pausado: {
    pt: { text: 'Pausado', variant: 'info' },
    en: { text: 'Paused', variant: 'info' }
  },
};

// Symmetrical translated specifications for the detailed case studies
const projectDetails = {
  1: { // Autonomax
    pt: {
      backend: 'Arquitetura desacoplada em .NET 9, utilizando DTOs para otimizar tráfego de dados e Entity Framework Core para persistência.',
      security: 'Segurança multicamada seguindo padrões OWASP, com autenticação JWT, senhas criptografadas com BCrypt e Rate Limiting.',
      frontend: 'Interface reativa em React 18+ com TypeScript, Axios Interceptors para consumo e design responsivo com Tailwind CSS.',
      devops: 'Pipelines de CI/CD automatizadas via GitHub Actions enviando para Vercel (Frontend) e Railway (Backend/Database PostgreSQL).',
    },
    en: {
      backend: 'Decoupled architecture in .NET 9, utilizing DTOs to optimize data traffic and Entity Framework Core for persistence.',
      security: 'Multilayer security following OWASP standards, with JWT authentication, BCrypt encrypted passwords, and Rate Limiting.',
      frontend: 'Reactive interface in React 18+ with TypeScript, Axios Interceptors for data fetching, and responsive design with Tailwind CSS.',
      devops: 'Automated CI/CD pipelines via GitHub Actions deploying to Vercel (Frontend) and Railway (Backend/Database PostgreSQL).',
    }
  },
  2: { // Aura
    pt: {
      backend: 'Backend modular robusto estruturado em .NET 10 e ASP.NET Web API utilizando Clean Architecture (DDD) e EF Core.',
      security: 'Autenticação de usuários, isolamento de inquilinos (multi-tenant) e integridade referencial nas finanças escolares.',
      frontend: 'Frontend SPA dinâmico desenvolvido com React, TypeScript, Axios e estilização componentizada com CSS Modules.',
      devops: 'Provisionamento de recursos, orquestração local e automação de builds com foco em deploys ágeis em ambientes Azure.',
    },
    en: {
      backend: 'Robust modular backend structured in .NET 10 and ASP.NET Web API utilizing Clean Architecture (DDD) and EF Core.',
      security: 'User authentication, multi-tenant isolation, and referential integrity in school financials.',
      frontend: 'Dynamic SPA frontend developed with React, TypeScript, Axios, and componentized styling with CSS Modules.',
      devops: 'Resource provisioning, local orchestration, and build automation focusing on agile deployments in Azure environments.',
    }
  },
  3: { // Band Link
    pt: {
      backend: 'Arquitetura modular em React Native (Expo) com SQLite embutido, isolando dados offline-first com alto desempenho.',
      security: 'Armazenamento interno seguro de arquivos de cifras/músicas e integridade na persistência local de grupos e finanças.',
      frontend: 'Interface otimizada para palco (Stage Mode), suporte a tablets no pedestal, gestos rápidos e controle dinâmico de tom e BPM.',
      devops: 'Publicado na Google Play Store, pipeline de build via EAS (Expo Application Services) e exportação de setlists com Expo Sharing.',
    },
    en: {
      backend: 'Modular architecture in React Native (Expo) with embedded SQLite, isolating offline-first data with high performance.',
      security: 'Secure local storage of chord/music files and referential integrity for band profiles, repertoires, and finances.',
      frontend: 'Stage Mode interface tailored for stage pedestals and tablets, quick swipe gestures, dynamic key transposition, and BPM.',
      devops: 'Published on Google Play Store, build pipeline via EAS (Expo Application Services), and setlist sharing via Expo Sharing.',
    }
  }
};

function ProjectGallery({ project, setLightboxImage }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const images = project.images && project.images.length > 0 ? project.images : [project.image];
  const isMobile = project.type?.pt === 'Mobile App';

  const checkScroll = () => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 15);
  };

  const scroll = (direction) => {
    if (!trackRef.current) return;
    const amount = trackRef.current.clientWidth * 0.75;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  return (
    <div className={styles.galleryWrapper}>
      <div className={styles.galleryTopBar}>
        <span className={styles.galleryCount}>
          {images.length} {images.length === 1 ? 'tela' : 'telas'} • clique para tela cheia / zoom
        </span>
        {images.length > 1 && (
          <div className={styles.galleryNav}>
            <button
              type="button"
              className={styles.galleryNavBtn}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Rolar para a esquerda"
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              className={styles.galleryNavBtn}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Rolar para a direita"
            >
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      <div className={styles.galleryTrack} ref={trackRef}>
        {images.map((src, idx) => (
          <div
            key={idx}
            className={`${styles.galleryCard} ${isMobile ? styles.mobileCard : ''}`}
            onClick={() => setLightboxImage(src)}
            title="Clique para abrir imagem em tela cheia com zoom"
          >
            <img
              src={src}
              alt={`${project.title} screenshot ${idx + 1}`}
              loading="lazy"
            />
            <div className={styles.galleryCardOverlay}>
              <span className={styles.zoomPill}>⤢ Zoom</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Projects({ lang }) {
  const t = translations[lang] || translations.pt;
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  const handleHeaderClick = (id) => {
    setExpandedProjectId((prev) => (prev === id ? null : id));
  };

  return (
    <AnimatedSection id="projects" className={styles.projects}>
      <div className={styles.projectsInner}>
        <div className={styles.titleRow}>
          <SectionTitle
            label={t.projectsLabel}
            title={t.projectsTitle}
            highlightText={t.projectsHighlight}
          />
          <a
            href="https://github.com/allisonrps"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewAll}
          >
            {t.projectsBtnGitHub}
          </a>
        </div>

        <div className={styles.accordionContainer}>
          {projects.map((p) => {
            const isOpen = expandedProjectId === p.id;
            const cardBadge = statusMap[p.status][lang] || statusMap.concluido[lang];
            const typeText = p.type[lang] || p.type.pt;
            const details = projectDetails[p.id][lang];

            return (
              <div key={p.id} className={`${styles.accordionItem} ${isOpen ? styles.accordionItemOpen : ''}`}>
                {/* Header Row */}
                <div
                  className={styles.accordionHeader}
                  onClick={() => handleHeaderClick(p.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleHeaderClick(p.id);
                    }
                  }}
                >
                  <div className={styles.headerLeft}>
                    <h3 className={styles.projectTitle}>{p.title}</h3>
                    <span className={styles.projectType}>{typeText}</span>
                  </div>
                  <div className={styles.headerRight}>
                    <Badge text={cardBadge.text} variant={cardBadge.variant} />
                    <span className={`${styles.iconPlus} ${isOpen ? styles.rotated : ''}`}>
                      {isOpen ? '−' : '+'}
                    </span>
                  </div>
                </div>

                {/* Separator line */}
                <div className={styles.separatorLine} />

                {/* Collapsible Content */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className={styles.accordionContent}>
                        <div className={styles.expandedVerticalFlow}>
                          {/* 1. First Row — Tech Stacks */}
                          <div className={styles.expandedStacks}>
                            {p.stacks.map((tech) => (
                              <span key={tech} className={styles.expandedStackBadge}>
                                {tech}
                              </span>
                            ))}
                          </div>

                          {/* 2. Middle Row — Texts & Descriptions */}
                          <div className={styles.expandedTextSection}>
                            <p className={styles.expandedSummary}>{p.summary[lang] || p.summary.pt}</p>

                            {/* Platform Core Pillars (e.g. Band Link: Social/Anúncios, Gestão, Palco) */}
                            {p.pillars && (
                              <div className={styles.pillarsContainer}>
                                <h4 className={styles.pillarsHeader}>
                                  {lang === 'en' ? 'Core Pillars & Experience' : 'Pilares da Plataforma'}
                                </h4>
                                <div className={styles.pillarsGrid}>
                                  {p.pillars[lang].map((pillar, idx) => (
                                    <div key={idx} className={styles.pillarCard}>
                                      <div className={styles.pillarHeader}>
                                        <span className={styles.pillarIcon}>
                                          {idx === 0 && <FiUsers />}
                                          {idx === 1 && <FiLayers />}
                                          {idx === 2 && <FiMusic />}
                                        </span>
                                        <span className={styles.pillarTag}>{pillar.tag}</span>
                                      </div>
                                      <h5 className={styles.pillarTitle}>{pillar.title}</h5>
                                      <p className={styles.pillarDesc}>{pillar.desc}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Detailed Curriculum/README list of features */}
                            {details && (
                              <div className={styles.detailsList}>
                                <h4>{t.projectCaseHeader}</h4>
                                <ul>
                                  <li><strong>{t.projectArch}:</strong> {details.backend}</li>
                                  <li><strong>{t.projectSecurity}:</strong> {details.security}</li>
                                  <li><strong>{t.projectFront}:</strong> {details.frontend}</li>
                                  <li><strong>{t.projectDevOps}:</strong> {details.devops}</li>
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Hero Banner Showcase (if available) */}
                          {p.banner && (
                            <div
                              className={styles.projectHeroBanner}
                              onClick={() => setLightboxImage(p.banner)}
                              title="Clique para abrir imagem em tela cheia com zoom"
                            >
                              <img src={p.banner} alt={`${p.title} banner ecossistema`} />
                              <div className={styles.heroBannerOverlay}>
                                <span className={styles.heroBannerTag}>
                                  {lang === 'en' ? 'Complete Ecosystem • Google Play' : 'Ecossistema Completo • Google Play'}
                                </span>
                                <span className={styles.zoomPill}>⤢ Zoom</span>
                              </div>
                            </div>
                          )}

                          {/* 3. Below Texts — Side-by-Side Gallery Showcase */}
                          <ProjectGallery project={p} setLightboxImage={setLightboxImage} />

                          {/* 4. Bottom Row — Action Links */}
                          <div className={styles.expandedLinks}>
                            {p.githubUrl && (
                              <a
                                href={p.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.expandedLink}
                              >
                                <FaGithub /> {t.projectBtnCode}
                              </a>
                            )}
                            {p.playStoreUrl && (
                              <a
                                href={p.playStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.expandedLink}
                              >
                                <FaGooglePlay /> {t.projectBtnPlayStore || 'Google Play'}
                              </a>
                            )}
                            {p.liveUrl && (!p.playStoreUrl || p.liveUrl !== p.playStoreUrl) && (
                              <a
                                href={p.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.expandedLink}
                              >
                                <FiExternalLink /> {t.projectBtnDemo}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Fullscreen Lightbox Overlay for Screenshots ── */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            className={styles.lightboxOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
          >
            <button
              className={styles.lightboxCloseBtn}
              onClick={() => setLightboxImage(null)}
              type="button"
              aria-label="Fechar tela cheia"
            >
              <FiX />
            </button>
            <motion.img
              src={lightboxImage}
              alt="Screenshot ampliado"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedSection>
  );
}
