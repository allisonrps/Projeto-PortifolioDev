import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import { FaReact, FaNodeJs, FaDocker, FaGitAlt } from 'react-icons/fa';
import { SiTypescript, SiDotnet, SiMongodb, SiPostgresql, SiTailwindcss } from 'react-icons/si';
import { VscAzure } from 'react-icons/vsc';
import styles from './About.module.css';

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

export default function About() {
  return (
    <AnimatedSection id="about" className={styles.about}>
      <div className={styles.aboutInner}>
        <SectionTitle
          label="Sobre Mim"
          title="Soluções que geram"
          highlightText="Impacto."
          subtitle="Conheça um pouco sobre minha trajetória e paixão por tecnologia."
        />

        <div className={styles.content}>
          <div className={styles.photoSide}>
            <div className={styles.aboutPhoto}>
              <img src="/profile-photo.jpg" alt="Allison Rodrigues" />
            </div>
          </div>

          <div className={styles.textSide}>
            <p className={styles.bioText}>
              Sou desenvolvedor de software graduado pela{' '}
              <span className={styles.highlight}>FATEC Franca</span>, com
              experiência na construção de aplicações web modernas e escaláveis.
              Atualmente curso pós-graduação em{' '}
              <span className={styles.highlight}>Arquitetura Avançada em Nuvem Azure</span>,
              aprofundando meus conhecimentos em infraestrutura distribuída e
              serviços cloud-native.
            </p>

            <p className={styles.bioText}>
              Sou apaixonado por{' '}
              <span className={styles.highlight}>Clean Code</span>,{' '}
              <span className={styles.highlight}>arquiteturas escaláveis</span>{' '}
              e <span className={styles.highlight}>soluções cloud-native</span>.
              No meu dia a dia trabalho com C# .NET Core, Node.js (Express), React, TypeScript,
              Docker e serviços Azure.
            </p>

            <div className={styles.skillsGrid}>
              {skills.map(({ name, icon: Icon }) => (
                <div key={name} className={styles.skillCard}>
                  <Icon />
                  <span>{name}</span>
                </div>
              ))}
            </div>

            <a href="#contact" className={styles.moreBtn}>
              Contato →
            </a>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
