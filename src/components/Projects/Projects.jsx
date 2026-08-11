import { useState } from 'react';
import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import Badge from '../common/Badge';
import { projects } from '../../data/projects';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiExternalLink } from 'react-icons/fi';
import { FaGithub } from 'react-icons/fa';
import styles from './Projects.module.css';

const statusMap = {
  concluido: { text: 'Concluído', variant: 'success' },
  'em-desenvolvimento': { text: 'Em desenvolvimento', variant: 'warning' },
  pausado: { text: 'Pausado', variant: 'info' },
};

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (direction) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  }),
};

export default function Projects() {
  const [[page, direction], setPage] = useState([0, 0]);

  const activeIndex = (page % projects.length + projects.length) % projects.length;

  const paginate = (newDirection) => {
    setPage([page + newDirection, newDirection]);
  };

  const project = projects[activeIndex];
  const badgeProps = statusMap[project.status] || statusMap.concluido;

  return (
    <AnimatedSection id="projects" className={styles.projects}>
      <div className={styles.projectsInner}>
        <div className={styles.titleRow}>
          <SectionTitle
            label="Portfólio"
            title="Projetos"
            highlightText="Selecionados."
          />
          <a
            href="https://github.com/allisonrps"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewAll}
          >
            Ver Todos no GitHub →
          </a>
        </div>

        <div className={styles.carouselWrapper}>
          <div className={styles.carouselContent}>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={page}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className={styles.carouselCard}
              >
                {/* Imagem (Esquerda) */}
                <div className={styles.imageArea}>
                  <img src={project.image} alt={project.title} loading="lazy" />
                  <div className={styles.imageOverlay} />
                </div>

                {/* Info (Direita) */}
                <div className={styles.infoArea}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>{project.title}</h3>
                    <span className={styles.cardType}>{project.type}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Badge text={badgeProps.text} variant={badgeProps.variant} />
                  </div>

                  <div className={styles.stacks}>
                    {project.stacks.map((tech) => (
                      <span key={tech} className={styles.stackBadge}>
                        {tech}
                      </span>
                    ))}
                  </div>

                  <p className={styles.summary}>{project.summary}</p>

                  <div className={styles.links}>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      <FaGithub /> Código
                    </a>
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        <FiExternalLink /> Demo
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.dots}>
              {projects.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPage([index, index > activeIndex ? 1 : -1])}
                  className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ''}`}
                  type="button"
                  aria-label={`Ir para o slide ${index + 1}`}
                />
              ))}
            </div>

            <div className={styles.arrows}>
              <button
                className={styles.arrowBtn}
                onClick={() => paginate(-1)}
                type="button"
                aria-label="Projeto anterior"
              >
                <FiChevronLeft />
              </button>
              <button
                className={styles.arrowBtn}
                onClick={() => paginate(1)}
                type="button"
                aria-label="Próximo projeto"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
