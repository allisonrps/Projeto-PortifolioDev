import AnimatedSection from '../common/AnimatedSection';
import { motion } from 'framer-motion';
import { FaReact, FaNodeJs, FaDocker, FaGitAlt } from 'react-icons/fa';
import { SiTypescript, SiDotnet, SiMongodb, SiPostgresql, SiTailwindcss } from 'react-icons/si';
import { VscAzure } from 'react-icons/vsc';
import { TbBrandReactNative } from 'react-icons/tb';
import { translations } from '../../data/translations';
import styles from './TechStack.module.css';

const skills = [
  { name: '.NET / C#', icon: SiDotnet },
  { name: 'Node.js', icon: FaNodeJs },
  { name: 'React', icon: FaReact },
  { name: 'React Native', icon: TbBrandReactNative },
  { name: 'TypeScript', icon: SiTypescript },
  { name: 'Azure', icon: VscAzure },
  { name: 'Docker', icon: FaDocker },
  { name: 'PostgreSQL', icon: SiPostgresql },
  { name: 'MongoDB', icon: SiMongodb },
  { name: 'Tailwind CSS', icon: SiTailwindcss },
  { name: 'Git', icon: FaGitAlt },
];

export default function TechStack({ lang }) {
  const t = translations[lang] || translations.pt;

  return (
    <AnimatedSection id="tech-stack" className={styles.techStack}>
      <div className={styles.inner}>
        <div className={styles.headerRow}>
          <span className={styles.tag}>STACK</span>
          <h3 className={styles.title}>{t.heroStacksTitle}</h3>
          <div className={styles.line} />
        </div>

        <div className={styles.stacksGrid}>
          {skills.map(({ name, icon: Icon }) => (
            <motion.div
              key={name}
              className={styles.stackItem}
              data-tooltip={name}
              whileHover={{ y: -4, rotate: 4 }}
              transition={{ duration: 0.2 }}
            >
              <Icon />
            </motion.div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
