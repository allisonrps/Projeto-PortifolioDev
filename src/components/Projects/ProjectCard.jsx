import { motion } from 'framer-motion';
import { FaGithub } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import Badge from '../common/Badge';
import styles from './Projects.module.css';

/** Status slug → Badge props mapping */
const statusMap = {
  concluido: { text: 'Concluído', variant: 'success' },
  'em-desenvolvimento': { text: 'Em desenvolvimento', variant: 'warning' },
  pausado: { text: 'Pausado', variant: 'info' },
};

/**
 * Individual project card with image, badges, summary, and action links.
 *
 * @param {object}  props
 * @param {object}  props.project - Project data object
 */
export default function ProjectCard({ project }) {
  const { title, status, type, stacks, summary, githubUrl, liveUrl, image } =
    project;

  const badge = statusMap[status] || statusMap.concluido;

  return (
    <motion.div
      className={styles.card}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* ── Image ── */}
      <div className={styles.imageWrapper}>
        <img src={image} alt={title} loading="lazy" />
        <div className={styles.imageOverlay} />
      </div>

      {/* ── Body ── */}
      <div className={styles.cardBody}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <span className={styles.cardType}>{type}</span>
        </div>

        {/* Status badge */}
        <div className={styles.badges}>
          <Badge text={badge.text} variant={badge.variant} />
        </div>

        {/* Tech stacks */}
        <div className={styles.stacks}>
          {stacks.map((tech) => (
            <span key={tech} className={styles.stackBadge}>
              {tech}
            </span>
          ))}
        </div>

        {/* Summary */}
        <p className={styles.summary}>{summary}</p>

        {/* Links */}
        <div className={styles.links}>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            <FaGithub />
            Código
          </a>

          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              <FiExternalLink />
              Demo
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
