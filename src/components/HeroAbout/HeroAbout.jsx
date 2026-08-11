import { motion } from 'framer-motion';
import { FaReact, FaNodeJs, FaDocker, FaGitAlt } from 'react-icons/fa';
import { SiTypescript, SiDotnet, SiMongodb, SiPostgresql, SiTailwindcss } from 'react-icons/si';
import { VscAzure } from 'react-icons/vsc';
import styles from './HeroAbout.module.css';

const skills = [
  { name: '.NET / C#', icon: SiDotnet },
  { name: 'Node.js', icon: FaNodeJs },
  { name: 'React', icon: FaReact },
  { name: 'TypeScript', icon: SiTypescript },
  { name: 'Azure', icon: VscAzure },
  { name: 'Docker', icon: FaDocker },
  { name: 'PostgreSQL', stroke: true, icon: SiPostgresql },
  { name: 'MongoDB', icon: SiMongodb },
  { name: 'Tailwind', icon: SiTailwindcss },
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

export default function HeroAbout() {
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
          {/* Photo */}
          <motion.div className={styles.photoCol} variants={itemVariants}>
            <div className={styles.photoWrapper}>
              <img src="/profile-photo.jpg" alt="Allison Rodrigues" />
            </div>
          </motion.div>

          {/* Bio Info */}
          <div className={styles.infoCol}>
            <motion.div className={styles.nameBox} variants={itemVariants}>
              <h1 className={styles.name}>
                Allison Rodrigues<span>.</span>
              </h1>
            </motion.div>

            <motion.p className={styles.role} variants={itemVariants}>
              Software Developer & Cloud Architect
            </motion.p>

            <motion.p className={styles.bioText} variants={itemVariants}>
              Sou desenvolvedor de software graduado pela{' '}
              <span className={styles.highlight}>FATEC Franca</span> e pós-graduando em{' '}
              <span className={styles.highlight}>Arquitetura Avançada em Nuvem Azure</span> na Faculdade Anhanguera. 
              Especializado na construção de aplicações robustas e seguras usando{' '}
              <span className={styles.highlight}>C# .NET Core</span> e{' '}
              <span className={styles.highlight}>Node.js (Express)</span> no ecossistema de APIs, 
              e interfaces de alta performance com <span className={styles.highlight}>React</span> e{' '}
              <span className={styles.highlight}>TypeScript</span>.
            </motion.p>

            <motion.p className={styles.bioText} variants={itemVariants}>
              Minha paixão está em criar arquiteturas de dados escaláveis, 
              garantir segurança de dados integrada (padrões OWASP, criptografia, conformidade com a LGPD) 
              e implantar soluções cloud-native orquestradas com Docker e esteiras CI/CD automatizadas.
            </motion.p>

            <motion.div className={styles.ctaRow} variants={itemVariants}>
              <a href="#projects" className={styles.ctaBtnPrimary}>
                Ver Projetos →
              </a>
              <a href="#contact" className={styles.ctaBtnSecondary}>
                Fale Comigo
              </a>
            </motion.div>
          </div>
        </div>

        {/* Stacks Row (Stack Aqui) */}
        <motion.div className={styles.stacksWrapper} variants={itemVariants}>
          <h3 className={styles.stacksTitle}>Stack Tecnológica</h3>
          <div className={styles.stacksGrid}>
            {skills.map(({ name, icon: Icon }) => (
              <div key={name} className={styles.stackItem}>
                <Icon />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
