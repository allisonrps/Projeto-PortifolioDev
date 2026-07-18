import { motion } from 'framer-motion';
import styles from './Hero.module.css';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Hero() {
  return (
    <section className={styles.hero} id="hero">
      <motion.div
        className={styles.heroInner}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {/* Left — Text */}
        <div className={styles.textCol}>
          <motion.p className={styles.greeting} variants={item}>
            Olá, eu sou
          </motion.p>

          <motion.h1 className={styles.name} variants={item}>
            Allison{' '}
            <span className={styles.nameAccent}>Rodrigues</span>
          </motion.h1>

          <motion.p className={styles.role} variants={item}>
            Software Developer & Cloud Architect
          </motion.p>

          <motion.p className={styles.description} variants={item}>
            Desenvolvo soluções modernas e escaláveis com foco em arquitetura
            cloud e boas práticas de engenharia de software.
          </motion.p>

          <motion.div className={styles.cta} variants={item}>
            <a href="#projects" className={styles.ctaPrimary}>
              Ver Projetos →
            </a>
            <a href="#contact" className={styles.ctaSecondary}>
              ↓ Download CV
            </a>
          </motion.div>

          <motion.div className={styles.stats} variants={item}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>5+</span>
              <span className={styles.statLabel}>Anos de Exp.</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>20+</span>
              <span className={styles.statLabel}>Projetos</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>10+</span>
              <span className={styles.statLabel}>Tecnologias</span>
            </div>
          </motion.div>
        </div>

        {/* Right — Photo */}
        <motion.div className={styles.photoCol} variants={item}>
          <div className={styles.photoWrapper}>
            <div className={styles.photoGlow} />
            <div className={styles.photoCircle}>
              <img src="/profile-photo.jpg" alt="Allison Rodrigues" />
            </div>
            <motion.div
              className={styles.floatingBadge}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.4, ease: 'easeOut' }}
            >
              <span className={styles.floatingBadgeNumber}>5+</span>
              <span className={styles.floatingBadgeText}>Anos de Experiência</span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Background glows */}
      <div className={styles.bgGlow} />
      <div className={styles.bgGlow2} />
    </section>
  );
}
