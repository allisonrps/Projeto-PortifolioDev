import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import { motion } from 'framer-motion';
import { FaCode, FaCloud, FaMobileAlt, FaDatabase } from 'react-icons/fa';
import styles from './Services.module.css';

const services = [
  {
    icon: FaCode,
    title: 'Desenvolvimento Web',
    description: 'Aplicações web modernas e responsivas com React, TypeScript e as melhores práticas do mercado.',
  },
  {
    icon: FaCloud,
    title: 'Arquitetura Cloud',
    description: 'Soluções escaláveis na nuvem Azure com infraestrutura como código e pipelines CI/CD.',
  },
  {
    icon: FaDatabase,
    title: 'Backend & APIs',
    description: 'APIs RESTful robustas com C# .NET Core e Node.js, autenticação JWT, segurança OWASP e integração com bancos de dados.',
  },
  {
    icon: FaMobileAlt,
    title: 'Aplicações Mobile',
    description: 'Apps multiplataforma com React Native, integrando serviços cloud e experiências nativas.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function Services() {
  return (
    <AnimatedSection id="services" className={styles.services}>
      <div className={styles.servicesInner}>
        <SectionTitle
          label="Serviços"
          title="O Que Eu Faço de"
          highlightText="Melhor."
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
                <div className={styles.iconBox}>
                  <Icon />
                </div>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AnimatedSection>
  );
}
