import { useState } from 'react';
import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import Badge from '../common/Badge';
import { projects } from '../../data/projects';
import { translations } from '../../data/translations';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiExternalLink, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';
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
  3: { // Setlist Band Manager
    pt: {
      backend: 'Interface nativa multiplataforma utilizando React Native (Expo) integrada a serviços do dispositivo e banco local.',
      security: 'Armazenamento interno seguro de arquivos de música e persistência local isolada de configurações e setlists.',
      frontend: 'Layout 100% focado na usabilidade de palco, com suporte a gestos, roteiro de leitura rápida e controle de ensaios.',
      devops: 'Ecosistema de armazenamento baseado em SQLite local (Expo SQLite), leitura em lote via File System e exportação de arquivos com Sharing.',
    },
    en: {
      backend: 'Cross-platform native interface using React Native (Expo) integrated with device services and local database.',
      security: 'Secure internal storage of music files and isolated local persistence of configurations and setlists.',
      frontend: 'Layout 100% focused on stage usability, with gestures support, fast-reading script, and rehearsal control.',
      devops: 'Storage ecosystem based on local SQLite (Expo SQLite), bulk file reading via File System, and file exporting with Sharing.',
    }
  }
};

export default function Projects({ lang }) {
  const t = translations[lang] || translations.pt;
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState(null);

  const handleCardClick = (id) => {
    setExpandedProjectId(id);
    setActiveImageIndex(0);
    // Scroll smoothly to section top to keep the expanded content fully visible
    const el = document.getElementById('projects');
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 72,
        behavior: 'smooth',
      });
    }
  };

  const handleClose = () => {
    setExpandedProjectId(null);
    setActiveImageIndex(0);
  };

  const activeProject = projects.find((p) => p.id === expandedProjectId);
  const details = activeProject ? projectDetails[activeProject.id][lang] : null;
  const badgeProps = activeProject ? (statusMap[activeProject.status][lang] || statusMap.concluido[lang]) : null;

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

        <div style={{ position: 'relative' }}>
          <AnimatePresence mode="wait">
            {!expandedProjectId ? (
              /* ── Grid/Carousel List View (Cards Compactos) ── */
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={styles.projectsGrid}
              >
                {projects.map((p) => {
                  const cardBadge = statusMap[p.status][lang] || statusMap.concluido[lang];
                  const typeText = p.type[lang] || p.type.pt;
                  const summaryText = p.summary[lang] || p.summary.pt;

                  return (
                    <div
                      key={p.id}
                      className={styles.simpleCard}
                      onClick={() => handleCardClick(p.id)}
                    >
                      <div className={styles.simpleImageWrapper}>
                        <img src={p.image} alt={p.title} loading="lazy" />
                        <div className={styles.simpleImageOverlay} />
                      </div>

                      <div className={styles.simpleCardBody}>
                        <div className={styles.simpleHeader}>
                          <h3 className={styles.simpleTitle}>{p.title}</h3>
                          <span className={styles.simpleCardType}>{typeText}</span>
                        </div>

                        <div style={{ display: 'flex' }}>
                          <Badge text={cardBadge.text} variant={cardBadge.variant} />
                        </div>

                        {/* Stacks do projeto */}
                        <div className={styles.simpleStacks}>
                          {p.stacks.slice(0, 4).map((tech) => (
                            <span key={tech} className={styles.simpleStackBadge}>
                              {tech}
                            </span>
                          ))}
                          {p.stacks.length > 4 && (
                            <span className={styles.simpleStackBadge}>+{p.stacks.length - 4}</span>
                          )}
                        </div>

                        <span className={styles.expandPrompt}>
                          {t.projectCaseDetails} <FiChevronRight />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              /* ── Expanded Detail Case-Study View (Detalhada) ── */
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3, type: 'spring', damping: 25 }}
                className={styles.expandedCard}
              >
                <div className={styles.expandedGrid}>
                  {/* Left Col — Giant Image / Click to open Lightbox */}
                  <div
                    className={styles.expandedImageArea}
                    onClick={() => setLightboxImage(activeProject.images ? activeProject.images[activeImageIndex] : activeProject.image)}
                    title="Clique para abrir imagem em tela cheia"
                  >
                    <img 
                      src={activeProject.images ? activeProject.images[activeImageIndex] : activeProject.image} 
                      alt={`${activeProject.title} screenshot ${activeImageIndex + 1}`} 
                    />
                    <div className={styles.expandedOverlay} />

                    {activeProject.images && activeProject.images.length > 1 && (
                      <>
                        {/* Img Carousel Navigation Arrows */}
                        <button
                          className={styles.imgArrowLeft}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex(prev => prev === 0 ? activeProject.images.length - 1 : prev - 1);
                          }}
                          type="button"
                          aria-label="Imagem anterior"
                        >
                          <FiChevronLeft />
                        </button>
                        <button
                          className={styles.imgArrowRight}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImageIndex(prev => prev === activeProject.images.length - 1 ? 0 : prev + 1);
                          }}
                          type="button"
                          aria-label="Próxima imagem"
                        >
                          <FiChevronRight />
                        </button>

                        {/* Img Indicator Dots */}
                        <div className={styles.imgDots}>
                          {activeProject.images.map((_, idx) => (
                            <button
                              key={idx}
                              className={`${styles.imgDot} ${idx === activeImageIndex ? styles.imgDotActive : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImageIndex(idx);
                              }}
                              type="button"
                              aria-label={`Visualizar imagem ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right Col — Detailed Info */}
                  <div className={styles.expandedInfoArea}>
                    <button
                      className={styles.closeExpandedBtn}
                      onClick={handleClose}
                      type="button"
                      aria-label="Voltar para lista"
                    >
                      <FiX />
                    </button>

                    <div className={styles.expandedHeader}>
                      <h3 className={styles.expandedTitle}>{activeProject.title}</h3>
                      <span className={styles.expandedType}>{activeProject.type[lang] || activeProject.type.pt}</span>
                    </div>

                    <div className={styles.expandedBadgeRow}>
                      <Badge text={badgeProps.text} variant={badgeProps.variant} />
                    </div>

                    <p className={styles.expandedSummary}>{activeProject.summary[lang] || activeProject.summary.pt}</p>

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

                    <div className={styles.expandedStacks}>
                      {activeProject.stacks.map((tech) => (
                        <span key={tech} className={styles.expandedStackBadge}>
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className={styles.expandedLinks}>
                      {activeProject.githubUrl && (
                        <a
                          href={activeProject.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.expandedLink}
                        >
                          <FaGithub /> {t.projectBtnCode}
                        </a>
                      )}
                      {activeProject.liveUrl && (
                        <a
                          href={activeProject.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.expandedLink}
                        >
                          <FiExternalLink /> {t.projectBtnDemo}
                        </a>
                      )}
                      <button
                        onClick={handleClose}
                        className={styles.expandedLink}
                        style={{ marginLeft: 'auto', cursor: 'pointer', background: 'transparent' }}
                      >
                        {t.projectBackToList}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
