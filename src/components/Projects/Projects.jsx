import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import ProjectCard from './ProjectCard';
import { projects } from '../../data/projects';
import { motion } from 'framer-motion';
import styles from './Projects.module.css';

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function Projects() {
  return (
    <AnimatedSection id="projects" className={styles.projects}>
      <div className={styles.projectsInner}>
        <div className={styles.titleRow}>
          <SectionTitle
            label="Portfólio"
            title="Projetos"
            highlightText="Selecionados."
          />
          <a href="https://github.com/allisonrodrigues" target="_blank" rel="noopener noreferrer" className={styles.viewAll}>
            Ver Todos →
          </a>
        </div>

        <motion.div
          className={styles.grid}
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
