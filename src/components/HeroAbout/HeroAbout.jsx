import { motion } from 'framer-motion';
import { FaReact, FaNodeJs, FaDocker, FaGitAlt } from 'react-icons/fa';
import { SiTypescript, SiDotnet, SiMongodb, SiPostgresql, SiTailwindcss } from 'react-icons/si';
import { VscAzure } from 'react-icons/vsc';
import { translations } from '../../data/translations';
import styles from './HeroAbout.module.css';

const skills = [
  { name: '.NET / C#', icon: SiDotnet },
  { name: 'Node.js', icon: FaNodeJs },
  { name: 'React', icon: FaReact },
  { name: 'TypeScript', icon: SiTypescript },
  { name: 'Azure', icon: VscAzure },
  { name: 'Docker', icon: FaDocker },
  { name: 'PostgreSQL', icon: SiPostgresql },
  { name: 'MongoDB', icon: SiMongodb },
  { name: 'Tailwind CSS', icon: SiTailwindcss },
  { name: 'Git', icon: FaGitAlt },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function HeroAbout({ lang }) {
  const t = translations[lang] || translations.pt;

  return (
    <section className={styles.heroAbout} id="hero">
      <motion.div
        className={styles.inner}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Upper Grid (Photo left, Bio right) */}
        <div className={styles.upperGrid}>
          {/* Photo with advanced Tech HUD effects */}
          <motion.div className={styles.photoCol} variants={itemVariants}>
            {/* Rotating Tech Ring Background */}
            <div className={styles.techRing}>
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" style={{ width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="46" strokeWidth="0.5" strokeDasharray="3, 3" opacity="0.3" />
                <circle cx="50" cy="50" r="42" strokeWidth="1" strokeDasharray="30, 15, 5, 10" opacity="0.5" />
                <circle cx="50" cy="50" r="38" strokeWidth="0.5" strokeDasharray="1, 6" opacity="0.4" />
              </svg>
            </div>

            {/* Corner Brackets */}
            <div className={`${styles.hudCorner} ${styles.topLeft}`} />
            <div className={`${styles.hudCorner} ${styles.topRight}`} />
            <div className={`${styles.hudCorner} ${styles.bottomLeft}`} />
            <div className={`${styles.hudCorner} ${styles.bottomRight}`} />

            {/* Main Photo Wrapper */}
            <div className={styles.photoWrapper}>
              <img src="/profile-photo.jpg" alt="Allison Rodrigues" />
              
              {/* Scan Overlays */}
              <div className={styles.hudOverlayGrid} />
              <div className={styles.scannerLine} />
            </div>

            {/* Symmetrical Floating Coords */}
            <div className={styles.hudCoords}>
              <span>SYS.LOC // 20.26</span>
              <span>STATUS.ACTIVE // 100%</span>
            </div>
          </motion.div>

          {/* Bio Info */}
          <div className={styles.infoCol}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
              <motion.div className={styles.nameBox} variants={itemVariants}>
                <h1 className={styles.name}>
                  Allison Rodrigues<span>.</span>
                </h1>
              </motion.div>

              {/* Stats Square */}
              <motion.div className={styles.statsSquare} variants={itemVariants}>
                <span className={styles.statsNumber}>3</span>
                <span className={styles.statsLabel}>{t.heroStatsLabel}</span>
              </motion.div>
            </div>

            <motion.p className={styles.role} variants={itemVariants}>
              {t.heroRole}
            </motion.p>

            <motion.p className={styles.bioText} variants={itemVariants}>
              {lang === 'pt' ? (
                <>
                  Sou desenvolvedor de software graduado pela{' '}
                  <span className={styles.highlight}>FATEC Franca</span> e pós-graduando em{' '}
                  <span className={styles.highlight}>Arquitetura Avançada em Nuvem Azure</span> na Faculdade Anhanguera. 
                  Especializado na construção de aplicações robustas e seguras usando{' '}
                  <span className={styles.highlight}>C# .NET Core</span> e{' '}
                  <span className={styles.highlight}>Node.js (Express)</span> no ecossistema de APIs, 
                  e interfaces de alta performance com <span className={styles.highlight}>React</span> e{' '}
                  <span className={styles.highlight}>TypeScript</span>.
                </>
              ) : (
                <>
                  I am a software developer graduated from{' '}
                  <span className={styles.highlight}>FATEC Franca</span> and postgraduate in{' '}
                  <span className={styles.highlight}>Advanced Azure Cloud Architecture</span> at Faculdade Anhanguera.
                  Specialized in building robust and secure applications using{' '}
                  <span className={styles.highlight}>C# .NET Core</span> and{' '}
                  <span className={styles.highlight}>Node.js (Express)</span> in the API ecosystem,
                  and high-performance interfaces with <span className={styles.highlight}>React</span> and{' '}
                  <span className={styles.highlight}>TypeScript</span>.
                </>
              )}
            </motion.p>

            <motion.p className={styles.bioText} variants={itemVariants}>
              {lang === 'pt' ? (
                <>
                  Minha paixão está em criar arquiteturas de dados escaláveis, 
                  garantir segurança de dados integrada (padrões OWASP, criptografia, conformidade com a LGPD) 
                  e implantar soluções cloud-native orquestradas com Docker e esteiras CI/CD automatizadas.
                </>
              ) : (
                <>
                  My passion lies in creating scalable data architectures,
                  ensuring integrated data security (OWASP standards, encryption, compliance with LGPD/GDPR)
                  and deploying cloud-native solutions orchestrated with Docker and automated CI/CD pipelines.
                </>
              )}
            </motion.p>

            <motion.div className={styles.ctaRow} variants={itemVariants}>
              <a href="#projects" className={styles.ctaBtnPrimary}>
                {t.heroCtaProjects}
              </a>
              <a href="#contact" className={styles.ctaBtnSecondary}>
                {t.heroCtaContact}
              </a>
            </motion.div>
          </div>
        </div>

        {/* Stacks Row (Stack Aqui - Icon only with Tooltip) */}
        <motion.div className={styles.stacksWrapper} variants={itemVariants}>
          <h3 className={styles.stacksTitle}>{t.heroStacksTitle}</h3>
          <div className={styles.stacksGrid}>
            {skills.map(({ name, icon: Icon }) => (
              <div key={name} className={styles.stackItem} data-tooltip={name}>
                <Icon />
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
