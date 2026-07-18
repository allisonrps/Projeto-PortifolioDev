import AnimatedSection from '../common/AnimatedSection';
import SectionTitle from '../common/SectionTitle';
import styles from './About.module.css';

const stats = [
  { number: '20+', label: 'Projetos' },
  { number: '10+', label: 'Clientes' },
  { number: '5+', label: 'Anos Exp.' },
  { number: '12+', label: 'Certificados' },
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

            <div className={styles.statsGrid}>
              {stats.map((s) => (
                <div key={s.label} className={styles.statCard}>
                  <div className="number" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent)' }}>{s.number}</div>
                  <div className="label" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <a href="#contact" className={styles.moreBtn}>
              Mais Sobre Mim →
            </a>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
