import { useRef, useState } from 'react';
import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import Badge from '../common/Badge';
import CertificateCard from './CertificateCard';
import { studies, certificates } from '../../data/studies';
import { translations } from '../../data/translations';
import { FiChevronLeft, FiChevronRight, FiX, FiExternalLink, FiZoomIn } from 'react-icons/fi';
import { FaLaptopCode, FaCloud, FaShieldAlt } from 'react-icons/fa';
import { SiMongodb } from 'react-icons/si';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Studies.module.css';

const educationIcons = {
  1: FaCloud,
  2: FaLaptopCode,
};

const certDescriptions = {
  0: {
    pt: 'Certificação de proficiência em língua inglesa TOEIC (Test of English for International Communication) com pontuação obtida de 665/990, comprovando habilidades de audição e leitura para o mercado internacional.',
    en: 'TOEIC (Test of English for International Communication) proficiency certification in English with a score of 665/990, demonstrating listening and reading skills for the global market.'
  },
  1: {
    pt: 'Formação oficial da Cisco Networking Academy abordando fundamentos de segurança cibernética, proteção de dados, segurança de redes e resposta a incidentes.',
    en: 'Official training from Cisco Networking Academy covering cybersecurity basics, data protection, network security, and incident response.'
  },
  2: {
    pt: 'Conceitos e fundamentos de gestão ágil ministrados pelo Google no Coursera. Cobre frameworks Scrum, Kanban, gerenciamento de backlog, reuniões diárias e planejamento de sprint.',
    en: 'Concepts and fundamentals of agile management taught by Google on Coursera. Covers Scrum, Kanban, backlog management, daily standups, and sprint planning.'
  }
};

export default function Studies({ lang }) {
  const t = translations[lang] || translations.pt;
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
    let description = '';
    if (certDescriptions[cert.id]) {
      description = certDescriptions[cert.id][lang] || certDescriptions[cert.id].pt;
    } else {
      description = lang === 'pt'
        ? `Certificado de capacitação profissional em ${cert.name} emitido por ${cert.issuer}, atestando a conclusão da carga horária e aproveitamento técnico.`
        : `Professional training certificate in ${cert.name} issued by ${cert.issuer}, validating course load completion and technical expertise.`;
    }

    setSelectedCert({ ...cert, description });
  };

  return (
    <AnimatedSection id="studies" className={styles.studies}>
      <div className={styles.studiesInner}>
        <SectionTitle
          label={t.studiesLabel}
          title={t.studiesTitle}
          highlightText={t.studiesHighlight}
        />

        {/* ── Education Grid ── */}
        <div className={styles.educationGrid}>
          {studies.map((item) => {
            const badgeText = item.status === 'em-andamento' ? t.studiesStatusAndamento : t.studiesStatusConcluido;
            const badgeVariant = item.status === 'em-andamento' ? 'warning' : 'success';
            const Icon = educationIcons[item.id] || FaLaptopCode;
            const courseName = item.course[lang] || item.course.pt;
            const periodText = item.period[lang] || item.period.pt;
            const descText = item.description[lang] || item.description.pt;

            return (
              <div key={item.id} className={styles.educationCard}>
                <div className={styles.cardIconWrapper}>
                  <Icon />
                </div>

                <div>
                  <h3 className={styles.institution}>{item.institution}</h3>
                  <p className={styles.course}>{courseName}</p>
                  <span className={styles.period}>{periodText}</span>
                </div>

                <div>
                  <div style={{ marginTop: 12, marginBottom: 12 }}>
                    <Badge text={badgeText} variant={badgeVariant} />
                  </div>
                  {descText && (
                    <p className={styles.description}>{descText}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Certificates Carousel ── */}
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionLabel}>{t.studiesCertificates}</h3>
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

      {/* ── Modal overlay and content (Large readable certificates) ── */}
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

              {/* Large Image Showcase (Click to zoom/open) */}
              <div className={styles.modalBadgeWrapper}>
                {selectedCert.image ? (
                  <a
                    href={selectedCert.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Clique para abrir em tamanho real"
                  >
                    <img src={selectedCert.image} alt={selectedCert.name} />
                  </a>
                ) : (
                  <div className={styles.modalBadgePlaceholder}>
                    {selectedCert.issuer.includes('MongoDB') ? <SiMongodb /> : <FaShieldAlt />}
                  </div>
                )}
              </div>

              <div className={styles.modalMeta}>
                <h3 className={styles.modalTitle}>{selectedCert.name}</h3>
                <div className={styles.modalSubRow}>
                  <p className={styles.modalIssuer}>{selectedCert.issuer}</p>
                  <span className={styles.modalYear}>{t.studiesCertIssued} {selectedCert.year}</span>
                </div>
              </div>

              <p className={styles.modalDescription}>{selectedCert.description}</p>

              {/* Action Buttons */}
              <div className={styles.modalActions}>
                {selectedCert.verifyUrl && (
                  <a
                    href={selectedCert.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.modalBtn}
                  >
                    <FiExternalLink /> {t.studiesBtnVerify}
                  </a>
                )}
                
                {selectedCert.image && (
                  <a
                    href={selectedCert.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.modalBtnSec}
                  >
                    <FiZoomIn /> {t.studiesBtnFull}
                  </a>
                )}
                
                <button
                  className={selectedCert.verifyUrl || selectedCert.image ? styles.modalBtnSec : styles.modalBtn}
                  onClick={() => setSelectedCert(null)}
                  type="button"
                  style={{ flex: selectedCert.verifyUrl && selectedCert.image ? '0.5' : '1' }}
                >
                  {t.studiesBtnClose}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedSection>
  );
}
