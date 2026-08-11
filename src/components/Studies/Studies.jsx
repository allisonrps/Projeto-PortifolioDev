import { useRef } from 'react';
import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import Badge from '../common/Badge';
import CertificateCard from './CertificateCard';
import { studies, certificates } from '../../data/studies';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from './Studies.module.css';

const statusMap = {
  concluido: { text: 'Concluído', variant: 'success' },
  'em-andamento': { text: 'Em andamento', variant: 'warning' },
};

export default function Studies() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      // Scroll by 70% of the visible container width
      const scrollAmount = clientWidth * 0.7;
      const targetScroll =
        direction === 'left'
          ? scrollLeft - scrollAmount
          : scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  return (
    <AnimatedSection id="studies" className={styles.studies}>
      <div className={styles.studiesInner}>
        <SectionTitle
          label="Formação"
          title="Jornada Acadêmica"
          highlightText="& Estudos."
        />

        {/* ── Timeline ── */}
        <div className={styles.timeline}>
          {studies.map((item) => {
            const isActive = item.status === 'em-andamento';
            const badge = statusMap[item.status] || statusMap.concluido;

            return (
              <div key={item.id} className={styles.timelineItem}>
                <div
                  className={`${styles.timelineDot} ${isActive ? styles.timelineDotActive : ''}`}
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

        {/* ── Certificates Carousel ── */}
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionLabel}>Certificados</h3>
          <div className={styles.carouselControls}>
            <button
              onClick={() => scroll('left')}
              className={styles.controlBtn}
              type="button"
              aria-label="Certificados anteriores"
            >
              <FiChevronLeft />
            </button>
            <button
              onClick={() => scroll('right')}
              className={styles.controlBtn}
              type="button"
              aria-label="Próximos certificados"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className={styles.carouselContainer}>
          <div className={scrollRef ? styles.carouselTrack : ''} ref={scrollRef}>
            {certificates.map((cert) => (
              <div key={cert.id} className={styles.carouselCardWrapper}>
                <CertificateCard certificate={cert} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
