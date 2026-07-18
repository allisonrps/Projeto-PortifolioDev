import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import Badge from '../common/Badge';
import CertificateCard from './CertificateCard';
import { studies, certificates } from '../../data/studies';
import { motion } from 'framer-motion';
import styles from './Studies.module.css';

const statusMap = {
  concluido: { text: 'Concluído', variant: 'success' },
  'em-andamento': { text: 'Em andamento', variant: 'warning' },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

/**
 * Studies & Certificates section.
 *
 * Renders a vertical timeline for academic history
 * and a responsive grid of certificate cards with
 * stagger-in animation.
 */
export default function Studies() {
  return (
    <AnimatedSection id="studies" className={styles.studies}>
      <div className={styles.studiesInner}>
        <SectionTitle
          title="Formação & Certificados"
          subtitle="Minha jornada acadêmica e profissional"
        />

        {/* ── Timeline ──────────────────────────────── */}
        <div className={styles.timeline}>
          {studies.map((item) => {
            const isActive = item.status === 'em-andamento';
            const badge = statusMap[item.status] || statusMap.concluido;

            return (
              <div key={item.id} className={styles.timelineItem}>
                <div
                  className={`${styles.timelineDot} ${
                    isActive ? styles.timelineDotActive : ''
                  }`}
                />

                <div className={styles.timelineContent}>
                  <h3 className={styles.institution}>{item.institution}</h3>
                  <p className={styles.course}>{item.course}</p>
                  <span className={styles.period}>{item.period}</span>

                  <div style={{ marginTop: 8 }}>
                    <Badge text={badge.text} variant={badge.variant} />
                  </div>

                  {item.description && (
                    <p className={styles.description}>{item.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Certificates ─────────────────────────── */}
        <h3 className={styles.sectionLabel}>Certificados</h3>

        <div className={styles.certificatesGrid}>
          {certificates.map((cert, i) => (
            <motion.div
              key={cert.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              <CertificateCard certificate={cert} />
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
