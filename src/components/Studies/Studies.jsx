import { useRef, useState } from 'react';
import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import Badge from '../common/Badge';
import CertificateCard from './CertificateCard';
import { studies, certificates } from '../../data/studies';
import { FiChevronLeft, FiChevronRight, FiX, FiExternalLink } from 'react-icons/fi';
import { FaLaptopCode, FaCloud, FaShieldAlt } from 'react-icons/fa';
import { SiMongodb } from 'react-icons/si';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Studies.module.css';

const statusMap = {
  concluido: { text: 'Concluído', variant: 'success' },
  'em-andamento': { text: 'Em andamento', variant: 'warning' },
};

// Map education ID to specific icons
const educationIcons = {
  1: FaCloud,      // Cloud Azure (Postgrad)
  2: FaLaptopCode, // Fullstack / mobile (Graduation)
};

export default function Studies() {
  const scrollRef = useRef(null);
  const [selectedCert, setSelectedCert] = useState(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
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

  const openModal = (cert) => {
    // Add custom description dynamically to certificates for modal details if empty
    let description = '';
    if (cert.id === 0) {
      description =
        'Certificação de proficiência em língua inglesa TOEIC (Test of English for International Communication) com pontuação obtida de 665/990, comprovando habilidades de audição e leitura para o mercado internacional.';
    } else if (cert.id === 1) {
      description =
        'Formação oficial da Cisco Networking Academy abordando fundamentos de segurança cibernética, proteção de dados, segurança de redes e resposta a incidentes.';
    } else if (cert.id === 2) {
      description =
        'Conceitos e fundamentos de gestão ágil ministrados pelo Google no Coursera. Cobre frameworks Scrum, Kanban, gerenciamento de backlog, reuniões diárias e planejamento de sprint.';
    } else {
      description = `Certificado de capacitação profissional em ${cert.name} emitido por ${cert.issuer}, atestando a conclusão da carga horária e aproveitamento técnico.`;
    }

    setSelectedCert({ ...cert, description });
  };

  return (
    <AnimatedSection id="studies" className={styles.studies}>
      <div className={styles.studiesInner}>
        <SectionTitle
          label="Formação"
          title="Jornada Acadêmica"
          highlightText="& Estudos."
        />

        {/* ── Education Grid (Figma: 2 cards side-by-side) ── */}
        <div className={styles.educationGrid}>
          {studies.map((item) => {
            const isActive = item.status === 'em-andamento';
            const badge = statusMap[item.status] || statusMap.concluido;
            const Icon = educationIcons[item.id] || FaLaptopCode;

            return (
              <div key={item.id} className={styles.educationCard}>
                {/* overlapping top-left icon box */}
                <div className={styles.cardIconWrapper}>
                  <Icon />
                </div>

                <div>
                  <h3 className={styles.institution}>{item.institution}</h3>
                  <p className={styles.course}>{item.course}</p>
                  <span className={styles.period}>{item.period}</span>
                </div>

                <div>
                  <div style={{ marginTop: 12, marginBottom: 12 }}>
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
          <h3 className={styles.sectionLabel}>&lt; Certificados &gt;</h3>
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
          <div className={styles.carouselTrack} ref={scrollRef}>
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className={styles.carouselCardWrapper}
                onClick={() => openModal(cert)}
              >
                <CertificateCard certificate={cert} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modal overlay and content ── */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              className={styles.modalContent}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.modalCloseBtn}
                onClick={() => setSelectedCert(null)}
                type="button"
                aria-label="Fechar detalhes"
              >
                <FiX />
              </button>

              <div className={styles.modalBadgeWrapper}>
                {selectedCert.image ? (
                  <img src={selectedCert.image} alt={selectedCert.name} />
                ) : (
                  <div className={styles.modalBadgePlaceholder}>
                    {selectedCert.issuer.includes('MongoDB') ? <SiMongodb /> : <FaShieldAlt />}
                  </div>
                )}
              </div>

              <h3 className={styles.modalTitle}>{selectedCert.name}</h3>
              <p className={styles.modalIssuer}>{selectedCert.issuer}</p>
              <span className={styles.modalYear}>Ano de emissão: {selectedCert.year}</span>

              <p className={styles.modalDescription}>{selectedCert.description}</p>

              {selectedCert.verifyUrl ? (
                <a
                  href={selectedCert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.modalBtn}
                >
                  <FiExternalLink /> Validar Credencial
                </a>
              ) : (
                <button
                  className={styles.modalBtn}
                  onClick={() => setSelectedCert(null)}
                  type="button"
                >
                  Fechar
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedSection>
  );
}
