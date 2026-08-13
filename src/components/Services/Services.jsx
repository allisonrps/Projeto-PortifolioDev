import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import { motion } from 'framer-motion';
import { FaCode, FaCloud, FaMobileAlt, FaDatabase } from 'react-icons/fa';
import { translations } from '../../data/translations';
import styles from './Services.module.css';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function Services({ lang }) {
  const t = translations[lang] || translations.pt;

  const services = [
    {
      icon: FaCode,
      title: t.serviceWebTitle,
      description: t.serviceWebDesc,
    },
    {
      icon: FaCloud,
      title: t.serviceCloudTitle,
      description: t.serviceCloudDesc,
    },
    {
      icon: FaDatabase,
      title: t.serviceApiTitle,
      description: t.serviceApiDesc,
    },
    {
      icon: FaMobileAlt,
      title: t.serviceMobileTitle,
      description: t.serviceMobileDesc,
    },
  ];

  return (
    <AnimatedSection id="services" className={styles.services}>
      <div className={styles.servicesInner}>
        <SectionTitle
          label={t.servicesLabel}
          title={t.servicesTitle}
          highlightText={t.servicesHighlight}
          subtitle={t.servicesSub}
        />

        <div className={styles.grid}>
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                className={styles.card}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}>
                    <Icon />
                  </div>
                  <h3 className={styles.cardTitle}>{s.title}</h3>
                </div>
                <p className={styles.cardDescription}>{s.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}
